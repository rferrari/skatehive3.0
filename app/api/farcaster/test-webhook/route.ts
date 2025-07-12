import { NextRequest, NextResponse } from 'next/server';
import {
    createMockFarcasterWebhook,
    processFarcasterWebhookUnsafe,
    farcasterTokenStore
} from '@/lib/farcaster/token-store';

export async function POST(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Test endpoint not available in production' },
            { status: 403 }
        );
    }

    try {
        const {
            fid,
            event = 'miniapp_added',
            notificationUrl = 'https://api.farcaster.com/v1/frame-notifications',
            token = `test_token_${Date.now()}`
        } = await request.json();

        if (!fid) {
            return NextResponse.json(
                { error: 'FID is required' },
                { status: 400 }
            );
        }

        // Create mock webhook payload
        const notificationDetails = ['miniapp_added', 'notifications_enabled'].includes(event)
            ? { url: notificationUrl, token }
            : undefined;

        const mockWebhook = createMockFarcasterWebhook(fid, event, notificationDetails);

        // Process the mock webhook
        const success = await processFarcasterWebhookUnsafe(mockWebhook);

        if (success) {
            const currentTokens = farcasterTokenStore.getAllTokens();
            return NextResponse.json({
                success: true,
                message: `Successfully processed ${event} for FID ${fid}`,
                mockWebhook,
                currentTokens: currentTokens.map(t => ({
                    fid: t.fid,
                    username: t.username,
                    hiveUsername: t.hiveUsername,
                    isActive: t.isActive,
                    hasToken: !!t.token
                }))
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to process mock webhook' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Test webhook error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Test endpoint not available in production' },
            { status: 403 }
        );
    }

    const currentTokens = farcasterTokenStore.getAllTokens();

    return NextResponse.json({
        message: 'Farcaster Webhook Test Endpoint - Development Only',
        usage: {
            method: 'POST',
            body: {
                fid: 'string (required) - Farcaster FID',
                event: 'miniapp_added | miniapp_removed | notifications_enabled | notifications_disabled',
                notificationUrl: 'string (optional) - Notification URL',
                token: 'string (optional) - Notification token'
            }
        },
        examples: [
            {
                description: 'Simulate user adding SkateHive miniapp',
                body: {
                    fid: '12345',
                    event: 'miniapp_added'
                }
            },
            {
                description: 'Simulate user removing SkateHive miniapp',
                body: {
                    fid: '12345',
                    event: 'miniapp_removed'
                }
            }
        ],
        currentState: {
            totalTokens: currentTokens.length,
            activeTokens: currentTokens.filter(t => t.isActive).length,
            tokens: currentTokens.map(t => ({
                fid: t.fid,
                username: t.username,
                hiveUsername: t.hiveUsername,
                isActive: t.isActive,
                createdAt: t.createdAt
            }))
        }
    });
}
