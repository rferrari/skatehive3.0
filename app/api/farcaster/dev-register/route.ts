import { NextRequest, NextResponse } from 'next/server';
import { getTokenStore } from '@/lib/farcaster/token-store-factory';

// Development-only endpoint to manually register Farcaster tokens for testing
export async function POST(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'This endpoint is only available in development' },
            { status: 403 }
        );
    }

    try {
        const { fid, username, token, notificationUrl } = await request.json();

        if (!fid || !username) {
            return NextResponse.json(
                { error: 'fid and username are required' },
                { status: 400 }
            );
        }

        const tokenStore = getTokenStore();

        // Add token to store (simulating what the webhook would do)
        await tokenStore.addToken(
            fid,
            username,
            token || `dev_token_${fid}_${Date.now()}`,
            notificationUrl || 'https://farcaster.xyz/~/miniapp/skatehive'
        );

        return NextResponse.json({
            success: true,
            message: `Successfully registered FID ${fid} (@${username}) for development testing`,
            data: {
                fid,
                username,
                token: token || `dev_token_${fid}_${Date.now()}`,
                notificationUrl: notificationUrl || 'https://farcaster.xyz/~/miniapp/skatehive'
            }
        });

    } catch (error) {
        console.error('Failed to register dev token:', error);
        return NextResponse.json(
            { error: 'Failed to register token' },
            { status: 500 }
        );
    }
}
