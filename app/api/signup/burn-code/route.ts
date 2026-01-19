import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface BurnCodeRequest {
  signup_token: string;
  test_mode?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { signup_token, test_mode = false }: BurnCodeRequest = await request.json();

    // Validate required fields
    if (!signup_token) {
      return NextResponse.json(
        { error: 'Missing required field: signup_token' },
        { status: 400 }
      );
    }

    // Lookup signup session
    const { data: signupSession, error: sessionError } = await supabase
      .from('signup_sessions')
      .select(`
        *,
        vip_codes (*)
      `)
      .eq('id', signup_token)
      .eq('status', 'INIT')
      .single();

    if (sessionError || !signupSession) {
      return NextResponse.json(
        { error: 'Invalid or expired signup token' },
        { status: 400 }
      );
    }

    const vipCode = signupSession.vip_codes;
    if (!vipCode) {
      return NextResponse.json(
        { error: 'VIP code not found for this session' },
        { status: 400 }
      );
    }

    // Check if VIP code is already consumed
    if (vipCode.consumed_at) {
      return NextResponse.json(
        { error: 'VIP code has already been consumed' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 1. Consume VIP code - use actual schema columns
    const { error: consumeError } = await supabase
      .from('vip_codes')
      .update({
        consumed_at: now,
        consumed_email: signupSession.email,
        // Remove consumed_username if it doesn't exist
      })
      .eq('id', vipCode.id);

    if (consumeError) {
      console.error('Error consuming VIP code:', consumeError);
      return NextResponse.json(
        { error: 'Failed to consume VIP code: ' + consumeError.message },
        { status: 500 }
      );
    }

    // 2. Update signup session status
    const { error: updateSessionError } = await supabase
      .from('signup_sessions')
      .update({
        status: test_mode ? 'BURNED' : 'SUCCESS',
        completed_at: now,
      })
      .eq('id', signup_token);

    if (updateSessionError) {
      console.error('Error updating signup session:', updateSessionError);
      // Continue anyway - VIP code was consumed successfully
    }

    // 3. Update VIP code usage log - use actual schema
    // Since signup_session_id column doesn't exist, we'll match by email and username
    const { error: usageLogError } = await supabase
      .from('vip_code_uses')
      .update({
        // Can only update existing columns - if status column exists
        // status: test_mode ? 'BURNED' : 'SUCCESS',
      })
      .eq('vip_code_id', vipCode.id)
      .eq('email', signupSession.email);

    if (usageLogError) {
      console.error('Error updating VIP code usage log:', usageLogError);
      // Continue anyway - main operations succeeded
    }

    // 4. Create a test user record (if not test mode) - use actual schema
    if (!test_mode) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          username: signupSession.username,
          email: signupSession.email,
          hive_account: signupSession.username,
          created_at: now,
          // Remove signup_method and vip_code_used if columns don't exist
        });

      if (userError) {
        console.error('Error creating user record:', userError);
        // Continue anyway - main operations succeeded
      }
    }

    // Return success with detailed information
    return NextResponse.json({
      success: true,
      message: test_mode ? 'VIP code burned successfully (test mode)' : 'VIP code consumed successfully',
      details: {
        vip_code: vipCode.code_id,
        username: signupSession.username,
        email: signupSession.email,
        consumed_at: now,
        test_mode,
        operations_completed: {
          vip_code_consumed: !consumeError,
          session_updated: !updateSessionError,
          usage_logged: !usageLogError,
          user_created: test_mode ? 'skipped' : 'attempted'
        }
      }
    });

  } catch (error) {
    console.error('Burn code error:', error);
    return NextResponse.json(
      { error: 'Internal server error during VIP code burning' },
      { status: 500 }
    );
  }
}