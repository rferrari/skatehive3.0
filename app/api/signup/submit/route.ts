import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

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

interface SubmitSignupRequest {
  signup_token: string;
  pubkeys: {
    owner: string;
    active: string;
    posting: string;
    memo: string;
  };
  backup_blob: {
    version: number;
    cipher: string;
    data: any;
  };
}

interface HiveAuthority {
  weight_threshold: number;
  key_auths: [string, number][];
  account_auths: any[];
}

// Create email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send keys via email
const sendKeysEmail = async (email: string, username: string, keys: any, backupId?: string) => {
  const transporter = createEmailTransporter();
  
  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to Skatehive! 🛹</h2>
      
      <p>Congratulations! Your Hive account <strong>${username}</strong> has been successfully created.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #d63384;">🔐 IMPORTANT - Your Private Keys</h3>
        <p style="color: #d63384; font-weight: bold;">
          Save these keys immediately! They cannot be recovered if lost.
        </p>
        
        <div style="font-family: monospace; font-size: 12px; line-height: 1.6;">
          <p><strong>Master Password:</strong><br>${keys.masterPassword}</p>
          <p><strong>Owner Key:</strong><br>${keys.owner}</p>
          <p><strong>Active Key:</strong><br>${keys.active}</p>
          <p><strong>Posting Key:</strong><br>${keys.posting}</p>
          <p><strong>Memo Key:</strong><br>${keys.memo}</p>
        </div>
      </div>
      
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4>🛡️ Security Notes:</h4>
        <ul>
          <li>Store these keys in a secure password manager</li>
          <li>Never share your private keys with anyone</li>
          <li>The master password can regenerate all other keys</li>
          <li>Use posting key for daily activities like voting and commenting</li>
        </ul>
      </div>
      
      <p>You can now login to <a href="https://skatehive.app">Skatehive.app</a> using your username and posting key.</p>
      
      <p>Welcome to the Skatehive community! 🎉</p>
      
      ${backupId ? `
      <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #0c5460;">🛡️ Emergency Backup Available</h4>
        <p style="color: #0c5460; font-size: 14px;">
          In case you lose this email, we've created a secure 24-hour backup of your keys.<br>
          <strong>Backup ID:</strong> ${backupId}<br>
          <strong>Retrieval URL:</strong> ${process.env.NEXT_PUBLIC_APP_URL}/api/signup/key-backup/${backupId}
        </p>
        <p style="color: #721c24; font-size: 12px; background: #f8d7da; padding: 10px; border-radius: 4px;">
          ⚠️ This backup expires in 24 hours and can only be used once. Save your keys from this email first!
        </p>
      </div>
      ` : ''}
      
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #6c757d;">
        This email was sent from ${process.env.EMAIL_COMMUNITY || 'Skatehive'}<br>
        Recovery account: ${process.env.EMAIL_RECOVERYACC || 'skatehive'}
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Welcome to Skatehive - Your Account Keys for @${username}`,
    html: emailTemplate,
  });
};

export async function POST(request: NextRequest) {
  try {
    const { signup_token, pubkeys, backup_blob }: SubmitSignupRequest = await request.json();

    // Validate required fields
    if (!signup_token || !pubkeys || !backup_blob) {
      return NextResponse.json(
        { error: 'Missing required fields: signup_token, pubkeys, backup_blob' },
        { status: 400 }
      );
    }

    // Validate public keys format
    const requiredKeys = ['owner', 'active', 'posting', 'memo'];
    for (const key of requiredKeys) {
      if (!pubkeys[key as keyof typeof pubkeys]) {
        return NextResponse.json(
          { error: `Missing ${key} public key` },
          { status: 400 }
        );
      }
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

    // Check session expiration
    if (new Date(signupSession.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Signup session has expired' },
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

    // Prepare Hive account creation payload
    const createAccountPayload = {
      new_account_name: signupSession.username,
      owner: {
        weight_threshold: 1,
        key_auths: [[pubkeys.owner, 1]] as [string, number][],
        account_auths: [] as any[],
      } as HiveAuthority,
      active: {
        weight_threshold: 1,
        key_auths: [[pubkeys.active, 1]] as [string, number][],
        account_auths: [] as any[],
      } as HiveAuthority,
      posting: {
        weight_threshold: 1,
        key_auths: [[pubkeys.posting, 1]] as [string, number][],
        account_auths: [] as any[],
      } as HiveAuthority,
      memo_key: pubkeys.memo,
    };

    try {
      // First, ensure we have an account credit available (claim one if needed)
      console.log('Checking/claiming account credit...');
      const claimResponse = await fetch(`${process.env.SIGNER_URL}/claim-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signer-token': process.env.SIGNER_TOKEN!,
        },
      });

      // Note: claim-account may fail if we already have credits, which is fine
      if (claimResponse.ok) {
        const claimData = await claimResponse.json();
        console.log('Account credit claimed successfully:', claimData.transaction_id);
      } else {
        console.log('Claim account response:', claimResponse.status, await claimResponse.text());
        // Continue anyway - might already have credits
      }

      // Call signer service to create Hive account
      console.log('Creating Hive account for:', signupSession.username);
      const signerResponse = await fetch(`${process.env.SIGNER_URL}/create-claimed-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signer-token': process.env.SIGNER_TOKEN!,
        },
        body: JSON.stringify(createAccountPayload),
      });

      let signerData;
      const responseText = await signerResponse.text();
      
      try {
        signerData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Signer response parsing error:', {
          status: signerResponse.status,
          statusText: signerResponse.statusText,
          responseText: responseText.substring(0, 500), // First 500 chars for debugging
          parseError: parseError instanceof Error ? parseError.message : String(parseError)
        });
        throw new Error(`Invalid JSON response from signer service. Status: ${signerResponse.status}, Response: ${responseText.substring(0, 100)}`);
      }

      if (!signerResponse.ok) {
        console.error('Signer service error:', {
          status: signerResponse.status,
          statusText: signerResponse.statusText,
          error: signerData
        });
        throw new Error(signerData.error || `Signer service error: ${signerResponse.status}`);
      }

      // Account created successfully - consume VIP code
      const { error: consumeError } = await supabase
        .from('vip_codes')
        .update({
          consumed_at: new Date().toISOString(),
          consumed_email: signupSession.email,
          // Remove consumed_username - column doesn't exist in actual schema
        })
        .eq('id', vipCode.id);

      if (consumeError) {
        console.error('Error consuming VIP code:', consumeError);
        // Continue anyway - account was created successfully
      }

      // Create user record - use actual schema
      const { error: userError } = await supabase
        .from('users')
        .insert({
          email: signupSession.email,
          hive_account: signupSession.username,
          // Remove fields that don't exist: username, created_at, signup_method, vip_code_used
        });

      if (userError) {
        console.error('Error creating user record:', userError);
        // Continue anyway - account was created successfully
      }

      // Update signup session status - use actual schema
      const { error: updateSessionError } = await supabase
        .from('signup_sessions')
        .update({
          status: 'SUCCESS',
          // Remove completed_at - column doesn't exist
          backup_blob, // Temporarily store for email sending
        })
        .eq('id', signup_token);

      if (updateSessionError) {
        console.error('Error updating signup session:', updateSessionError);
      }

      // Log successful VIP code usage - use actual schema
      const { error: usageLogError } = await supabase
        .from('vip_code_uses')
        .update({
          status: 'SUCCESS',
          // Remove completed_at - column doesn't exist
        })
        .eq('vip_code_id', vipCode.id)
        .eq('email', signupSession.email);

      if (usageLogError) {
        console.error('Error logging VIP code usage success:', usageLogError);
      }

      // Create emergency backup before sending email
      let backupId = null;
      try {
        const backupResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/signup/key-backup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: signupSession.username,
            keys: backup_blob.data,
            signup_token
          })
        });
        
        if (backupResponse.ok) {
          const backupData = await backupResponse.json();
          backupId = backupData.backup_id;
          console.log('Emergency backup created:', backupId);
        }
      } catch (backupError) {
        console.error('Error creating emergency backup:', backupError);
        // Continue anyway
      }

      // Send keys via email
      try {
        await sendKeysEmail(signupSession.email, signupSession.username, backup_blob.data, backupId);
      } catch (emailError) {
        console.error('Error sending keys email:', emailError);
        // Don't fail the whole process for email errors - we have backup!
        console.log('Email failed but emergency backup available:', backupId);
      }

      // Clear backup_blob from session for security
      const { error: clearBlobError } = await supabase
        .from('signup_sessions')
        .update({ backup_blob: null })
        .eq('id', signup_token);

      if (clearBlobError) {
        console.error('Error clearing backup blob:', clearBlobError);
      }

      // Create one-time authentication token
      const ott = uuidv4();
      const ottExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const { error: ottError } = await supabase
        .from('auth_ott')
        .insert({
          token: ott,
          username: signupSession.username,
          expires_at: ottExpiry.toISOString(),
          // Remove created_at - column doesn't exist in actual schema
        });

      if (ottError) {
        console.error('Error creating OTT:', ottError);
        // Return success without OTT - user can login manually
        return NextResponse.json({
          success: true,
          message: 'Account created successfully! Check your email for login keys.',
          username: signupSession.username,
        });
      }

      return NextResponse.json({
        success: true,
        ott,
        username: signupSession.username,
        message: 'Account created successfully! Check your email for login keys.',
      });

    } catch (signerError: any) {
      console.error('Signer service error:', signerError);
      
      // Log failed VIP code usage
      const { error: failureLogError } = await supabase
        .from('vip_code_uses')
        .update({
          status: 'FAILED',
          error_message: signerError.message || 'Signer service error',
          completed_at: new Date().toISOString(),
        })
        .eq('signup_session_id', signup_token);

      if (failureLogError) {
        console.error('Error logging VIP code usage failure:', failureLogError);
      }

      // Update signup session status
      const { error: updateSessionError } = await supabase
        .from('signup_sessions')
        .update({
          status: 'FAILED',
          error_message: signerError.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', signup_token);

      if (updateSessionError) {
        console.error('Error updating signup session:', updateSessionError);
      }

      return NextResponse.json(
        { error: 'Failed to create Hive account: ' + signerError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Signup submit error:', error);
    return NextResponse.json(
      { error: 'Internal server error during account creation' },
      { status: 500 }
    );
  }
}