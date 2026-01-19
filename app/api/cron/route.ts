import { NextResponse } from 'next/server';

/**
 * @deprecated Farcaster notification features have been removed
 */
export async function GET() {
    return NextResponse.json({ 
        ok: false, 
        error: 'Farcaster notification features have been removed' 
    });
}
