import { NextRequest, NextResponse } from 'next/server';
import { Client, PrivateKey, Operation } from '@hiveio/dhive';

const HIVE_API_NODES = [
  'https://api.hive.blog',
  'https://anyx.io',
  'https://api.deathwing.me',
];

const client = new Client(HIVE_API_NODES);

interface DeleteCommentRequest {
  author: string;
  permlink: string;
}

/**
 * POST /api/admin/delete-hive-comment
 *
 * Deletes a Hive comment/post via delete_comment operation.
 *
 * Security:
 * - Requires header: x-admin-key: <ADMIN_API_KEY>
 * - Uses DEFAULT_HIVE_POSTING_KEY to sign
 */
export async function POST(req: NextRequest) {
  try {
    const adminKey = req.headers.get('x-admin-key');
    const expected = process.env.ADMIN_API_KEY;

    if (!expected) {
      return NextResponse.json(
        { error: 'Server configuration error: ADMIN_API_KEY not set' },
        { status: 500 }
      );
    }

    if (!adminKey || adminKey !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DeleteCommentRequest = await req.json();
    const { author, permlink } = body;

    if (!author || !permlink) {
      return NextResponse.json(
        { error: 'Missing author or permlink' },
        { status: 400 }
      );
    }

    const postingKey = process.env.DEFAULT_HIVE_POSTING_KEY;
    if (!postingKey) {
      return NextResponse.json(
        { error: 'Server configuration error: DEFAULT_HIVE_POSTING_KEY not set' },
        { status: 500 }
      );
    }

    const op: Operation = [
      'delete_comment',
      {
        author,
        permlink,
      },
    ];

    const privateKey = PrivateKey.fromString(postingKey);
    const result = await client.broadcast.sendOperations([op], privateKey);

    return NextResponse.json({
      success: true,
      author,
      permlink,
      transaction_id: result.id,
    });
  } catch (error: any) {
    console.error('[Delete Hive Comment] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
