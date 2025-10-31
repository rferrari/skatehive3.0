import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
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

/**
 * Retrieve backed up keys (one-time use)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { backup_id: string } }
) {
  try {
    const { backup_id } = params;

    if (!backup_id) {
      return NextResponse.json(
        { error: 'Backup ID is required' },
        { status: 400 }
      );
    }

    // Look up backup record
    const { data: backup, error: backupError } = await supabase
      .from('key_backups')
      .select('*')
      .eq('backup_id', backup_id)
      .single();

    if (backupError || !backup) {
      return NextResponse.json(
        { error: 'Backup not found or expired' },
        { status: 404 }
      );
    }

    // Check if already retrieved
    if (backup.retrieved) {
      return NextResponse.json(
        { error: 'Backup already retrieved (one-time use only)' },
        { status: 410 }
      );
    }

    // Check if expired
    if (new Date(backup.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Backup has expired' },
        { status: 410 }
      );
    }

    // Decrypt keys
    try {
      const keysJson = Buffer.from(backup.keys_encrypted, 'base64').toString('utf-8');
      const keys = JSON.parse(keysJson);

      // Mark as retrieved (one-time use)
      await supabase
        .from('key_backups')
        .update({
          retrieved: true,
          retrieved_at: new Date().toISOString()
        })
        .eq('backup_id', backup_id);

      return NextResponse.json({
        success: true,
        username: backup.username,
        keys,
        created_at: backup.created_at,
        warning: 'This backup is now deleted. Save these keys immediately!'
      });

    } catch (decryptError) {
      console.error('Decryption error:', decryptError);
      return NextResponse.json(
        { error: 'Failed to decrypt backup' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Key backup retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}