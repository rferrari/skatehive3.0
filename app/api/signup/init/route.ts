import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { validateAccountName, checkAccountExists } from '@/lib/invite/helpers';

// Simple in-memory rate limiting
const RATE_LIMIT = 20; // requests per window
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const hits = new Map<string, { count: number; timestamp: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const record = hits.get(ip) || { count: 0, timestamp: now };
  
  // Reset if window has expired
  if (now - record.timestamp > WINDOW_MS) {
    record.count = 0;
    record.timestamp = now;
  }
  
  record.count++;
  hits.set(ip, record);
  
  return record.count <= RATE_LIMIT;
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface InitSignupRequest {
  username: string;
  email: string;
  vip_code: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = request.headers.get('x-forwarded-for') ?? 
              request.headers.get('x-real-ip') ?? 
              'localhost';
    
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const { username, email, vip_code }: InitSignupRequest = await request.json();

    // Validate required fields
    if (!username || !email || !vip_code) {
      return NextResponse.json(
        { error: 'Missing required fields: username, email, vip_code' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameError = validateAccountName(username.toLowerCase());
    if (usernameError) {
      return NextResponse.json(
        { error: usernameError },
        { status: 400 }
      );
    }

    // Check if username is available on Hive
    const isAvailable = await checkAccountExists(username.toLowerCase());
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Username already exists on Hive blockchain' },
        { status: 409 }
      );
    }

    // Validate VIP code format (should be like: 4RCHXV-9F9YWCZS)
    const codeParts = vip_code.split('-');
    if (codeParts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid VIP code format. Use format: XXXXXX-XXXXXXXX' },
        { status: 400 }
      );
    }

    const [codeId, secret] = codeParts;

    // Look up VIP code by code_id
    const { data: vipCodeData, error: vipCodeError } = await supabase
      .from('vip_codes')
      .select('*')
      .eq('code_id', codeId)
      .single();

    if (vipCodeError || !vipCodeData) {
      return NextResponse.json(
        { error: 'Invalid or expired VIP code' },
        { status: 400 }
      );
    }

    // Verify the secret part against the stored hash (with pepper)
    const argon2 = require('argon2');
    const vipPepper = process.env.VIP_PEPPER;
    
    if (!vipPepper) {
      console.error('VIP_PEPPER environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    try {
      // Concatenate secret with pepper for verification
      const secretWithPepper = secret + vipPepper;
      const isValidSecret = await argon2.verify(vipCodeData.secret_hash, secretWithPepper);
      if (!isValidSecret) {
        return NextResponse.json(
          { error: 'Invalid or expired VIP code' },
          { status: 400 }
        );
      }
    } catch (hashError) {
      console.error('Argon2 verification error:', hashError);
      return NextResponse.json(
        { error: 'VIP code verification failed' },
        { status: 500 }
      );
    }

    // Check if VIP code is still active
    if (vipCodeData.consumed_at) {
      return NextResponse.json(
        { error: 'VIP code has already been used' },
        { status: 400 }
      );
    }

    // Check expiration date
    if (vipCodeData.expires_at && new Date(vipCodeData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'VIP code has expired' },
        { status: 400 }
      );
    }

    // Generate signup token  
    const signupToken = uuidv4();

    // Create signup session
    const { data: signupSession, error: sessionError } = await supabase
      .from('signup_sessions')
      .insert({
        id: signupToken,
        signup_token: signupToken, // Add this field in case the table has both
        vip_code_id: vipCodeData.id,
        username: username.toLowerCase(),
        email,
        status: 'INIT',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating signup session:', {
        error: sessionError,
        code: sessionError.code,
        message: sessionError.message,
        details: sessionError.details,
        hint: sessionError.hint,
        signupToken,
        vipCodeId: vipCodeData.id,
        username: username.toLowerCase(),
        email
      });
      return NextResponse.json(
        { 
          error: 'Failed to create signup session',
          details: sessionError.message || 'Unknown database error'
        },
        { status: 500 }
      );
    }

    // Log VIP code usage attempt - use actual table schema
    const { error: usageError } = await supabase
      .from('vip_code_uses')
      .insert({
        vip_code_id: vipCodeData.id,
        email,
        username: username.toLowerCase(),
        // Only use columns that actually exist in the table
      });

    if (usageError) {
      console.error('Error logging VIP code usage:', usageError);
      // Continue anyway - this is just for logging
    }

    return NextResponse.json({
      signup_token: signupToken,
      message: 'VIP code validated successfully'
    });

  } catch (error) {
    console.error('Signup init error:', error);
    return NextResponse.json(
      { error: 'Internal server error during signup initialization' },
      { status: 500 }
    );
  }
}