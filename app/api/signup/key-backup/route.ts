import { NextRequest, NextResponse } from 'next/server';

/**
 * Emergency key backup system - TEMPORARILY DISABLED
 * The key_backups table doesn't exist in the current schema
 */
export async function POST(request: NextRequest) {
  try {
    const { username, keys, signup_token } = await request.json();

    if (!username || !keys || !signup_token) {
      return NextResponse.json(
        { error: 'Missing required fields: username, keys, signup_token' },
        { status: 400 }
      );
    }

    // TEMPORARILY DISABLED - key_backups table doesn't exist
    // Just return success to prevent errors during signup
    return NextResponse.json({
      success: true,
      backup_id: null,
      message: 'Key backup temporarily disabled - keys sent via email only'
    });

  } catch (error: any) {
    console.error('Key backup error:', error);
    return NextResponse.json(
      { error: 'Internal server error during key backup' },
      { status: 500 }
    );
  }
}

/**
 * Get information about backup system
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Emergency Key Backup System',
    description: 'Temporarily stores encrypted keys in case email delivery fails',
    status: 'DISABLED - key_backups table not available',
    usage: {
      'POST /api/signup/key-backup': 'Create emergency backup (currently disabled)',
      'GET /api/signup/key-backup/{backup_id}': 'Retrieve backed up keys (currently disabled)'
    },
    security: [
      'Keys are encrypted before storage',
      'Backups expire in 24 hours', 
      'One-time retrieval only',
      'Requires valid signup token'
    ],
    backup_table_schema: `
      CREATE TABLE key_backups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        backup_id UUID UNIQUE NOT NULL,
        username VARCHAR(50) NOT NULL,
        signup_token UUID NOT NULL,
        keys_encrypted TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        retrieved BOOLEAN DEFAULT FALSE,
        retrieved_at TIMESTAMPTZ
      );
    `
  });
}