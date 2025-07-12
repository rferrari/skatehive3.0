import { NextRequest, NextResponse } from 'next/server';
import { linkHiveToFarcaster, farcasterTokenStore } from '@/lib/farcaster/token-store';

export async function POST(request: NextRequest) {
    try {
        const { fid, hiveUsername } = await request.json();

        if (!fid || !hiveUsername) {
            return NextResponse.json(
                { error: 'Missing fid or hiveUsername' },
                { status: 400 }
            );
        }

        const success = linkHiveToFarcaster(fid, hiveUsername);

        if (success) {
            return NextResponse.json({
                success: true,
                message: `Linked Hive user ${hiveUsername} to Farcaster FID ${fid}`
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to link accounts. FID may not exist or be inactive.' },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error('Link accounts error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const hiveUsername = searchParams.get('hiveUsername');
        const fid = searchParams.get('fid');

        if (hiveUsername) {
            // Get tokens for a specific Hive user
            const tokens = farcasterTokenStore.getTokensForHiveUsers([hiveUsername]);
            return NextResponse.json({
                hiveUsername,
                tokens: tokens.map(token => ({
                    fid: token.fid,
                    username: token.username,
                    isActive: token.isActive,
                    createdAt: token.createdAt,
                }))
            });
        } else if (fid) {
            // Get token for a specific FID
            const token = farcasterTokenStore.getTokenByFid(fid);
            if (token) {
                return NextResponse.json({
                    fid: token.fid,
                    username: token.username,
                    hiveUsername: token.hiveUsername,
                    isActive: token.isActive,
                    createdAt: token.createdAt,
                });
            } else {
                return NextResponse.json(
                    { error: 'FID not found' },
                    { status: 404 }
                );
            }
        } else {
            // Get all active tokens (for debugging)
            const activeTokens = farcasterTokenStore.getActiveTokens();
            return NextResponse.json({
                totalActive: activeTokens.length,
                tokens: activeTokens.map(token => ({
                    fid: token.fid,
                    username: token.username,
                    hiveUsername: token.hiveUsername,
                    isActive: token.isActive,
                    createdAt: token.createdAt,
                }))
            });
        }
    } catch (error) {
        console.error('Get link info error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
