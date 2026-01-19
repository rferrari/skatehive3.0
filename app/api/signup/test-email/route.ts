import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { EMAIL_DEFAULTS } from '@/config/app.config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!
);

/**
 * Send test email with keys (for testing purposes)
 * POST /api/signup/test-email
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Test email endpoint called');
    
    const body = await request.json();
    console.log('Request body received:', { ...body, keys: body.keys ? 'PRESENT' : 'MISSING' });
    
    const { username, email, keys, signup_token } = body;

    if (!username || !email || !keys || !signup_token) {
      console.log('Missing fields:', { username: !!username, email: !!email, keys: !!keys, signup_token: !!signup_token });
      return NextResponse.json(
        { error: 'Missing required fields: username, email, keys, signup_token' },
        { status: 400 }
      );
    }

    // For test emails, we'll skip session validation since this is just testing email delivery
    // In a real signup, the session would be validated in the main submit endpoint
    console.log('Test email - skipping session validation for testing purposes');
    console.log('Would check session for:', { username, signup_token });

    // Create email transporter
    console.log('Email config:', {
      host: process.env.SMTP_HOST || EMAIL_DEFAULTS.SMTP_HOST,
      port: process.env.SMTP_PORT || EMAIL_DEFAULTS.SMTP_PORT,
      secure: process.env.SMTP_SECURE ?? EMAIL_DEFAULTS.SMTP_SECURE,
      user: process.env.EMAIL_USER ? 'SET' : 'MISSING',
      pass: process.env.EMAIL_PASS ? 'SET' : 'MISSING'
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || EMAIL_DEFAULTS.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || EMAIL_DEFAULTS.SMTP_PORT.toString()),
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : EMAIL_DEFAULTS.SMTP_SECURE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const emailSubject = `🔑 TEST EMAIL - Account Keys Preview for @${username}`;
    const emailBody = `
🚨 TEST EMAIL - ACCOUNT NOT CREATED YET 🚨

Hello ${username},

This is a TEST EMAIL to verify that email delivery is working properly before you create your actual Hive account.

⚠️ IMPORTANT: Your Hive account has NOT been created on the blockchain yet! This is just a preview of what your keys would look like.

Here are your generated keys for testing:

🔑 ACCOUNT KEYS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏠 Owner Key (Master key - keep EXTREMELY safe):
${keys.owner}

⚡ Active Key (For transfers and wallet operations):
${keys.active}

📝 Posting Key (For posting and social interactions):
${keys.posting}

💌 Memo Key (For encrypted messages):
${keys.memo}

🔐 Master Password (Can derive all keys):
${keys.master}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 SECURITY REMINDERS:
• This is a TEST - your account has not been created on the blockchain yet
• Store these keys in a secure password manager
• Never share your private keys with anyone
• The Owner key should be kept offline and only used for account recovery
• Use the Posting key for daily interactions on Hive apps
• We cannot recover these keys if you lose them

SkateHive Team 🛹
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER || EMAIL_DEFAULTS.FROM_ADDRESS,
      to: email,
      subject: emailSubject,
      text: emailBody,
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully! Check your inbox (and spam folder).',
      email_sent_to: email,
      note: 'This was a TEST email only - no account was created on the blockchain',
      next_step: 'If you received the email, you can proceed with creating your actual account'
    });

  } catch (error: any) {
    console.error('Test email error (full):', error);
    console.error('Test email error message:', error.message);
    console.error('Test email error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error.message,
        type: error.constructor.name
      },
      { status: 500 }
    );
  }
}