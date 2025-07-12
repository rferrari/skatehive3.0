import { NextRequest, NextResponse } from 'next/server';
import { getTokenStore } from '@/lib/farcaster/token-store-factory';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const hiveUsername = searchParams.get('hiveUsername');

    if (!hiveUsername) {
        return NextResponse.json(
            { error: 'hiveUsername parameter is required' },
            { status: 400 }
        );
    }

    try {
        const tokenStore = getTokenStore();
        const tokens = await tokenStore.getTokensForHiveUsers([hiveUsername]);

        if (tokens.length === 0) {
            return NextResponse.json({
                isLinked: false,
                notificationsEnabled: false
            });
        }

        const token = tokens[0];
        return NextResponse.json({
            isLinked: true,
            fid: token.fid,
            farcasterUsername: token.username,
            notificationsEnabled: token.isActive
        });

    } catch (error) {
        console.error('Failed to get user status:', error);
        return NextResponse.json(
            { error: 'Failed to get user status' },
            { status: 500 }
        );
    }
}
