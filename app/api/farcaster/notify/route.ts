import { NextRequest, NextResponse } from 'next/server';
import { farcasterNotificationService } from '@/lib/farcaster/notification-service';
import { HiveToFarcasterNotification } from '@/types/farcaster';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            type = 'vote',
            title = 'Test Notification',
            body: messageBody = 'This is a test notification from SkateHive',
            hiveUsername,
            targetUsers,
            sourceUrl
        } = body;

        // Create notification object
        const notification: HiveToFarcasterNotification = {
            type,
            title: title.substring(0, 32), // Ensure Farcaster limit
            body: messageBody.substring(0, 128), // Ensure Farcaster limit
            hiveUsername: hiveUsername || 'skatehive',
            sourceUrl: sourceUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://skatehive.app',
            metadata: {
                author: 'skatehive',
                permlink: 'test-notification',
            }
        };

        // Send notification
        const result = await farcasterNotificationService.sendNotification(
            notification,
            targetUsers
        );

        return NextResponse.json({
            success: result.success,
            results: result.results,
            notification,
        });

    } catch (error) {
        console.error('Send notification error:', error);
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
    return NextResponse.json({
        message: 'SkateHive Farcaster Notification Test Endpoint',
        usage: {
            method: 'POST',
            body: {
                type: 'vote | comment | follow | mention | reblog | transfer',
                title: 'Notification title (max 32 chars)',
                body: 'Notification body (max 128 chars)',
                hiveUsername: 'Target Hive username (optional)',
                targetUsers: ['array', 'of', 'hive', 'usernames'], // optional
                sourceUrl: 'URL to open when clicked (optional)'
            }
        },
        example: {
            type: 'vote',
            title: '👍 New Vote',
            body: 'Someone voted on your skateboarding video!',
            hiveUsername: 'skatehive',
            sourceUrl: 'https://skatehive.app/post/skatehive/awesome-trick'
        }
    });
}
