import { NextRequest, NextResponse } from 'next/server';
import { farcasterNotificationService } from '@/lib/farcaster/notification-service';
import { HiveToFarcasterNotification } from '@/types/farcaster';
import { isServerSideAdmin, logSecurityAttempt, createUnauthorizedResponse } from '@/lib/server/adminUtils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            type = 'vote',
            title = 'Test Notification',
            body: messageBody = 'This is a test notification from SkateHive',
            hiveUsername,
            targetUsers,
            sourceUrl,
            broadcast = false, // New flag to send to all users
            adminUsername // Required for admin operations
        } = body;

        // Define which notification types require admin privileges
        const adminOnlyTypes = ['custom', 'test'];
        const isAdminOperation = broadcast || adminOnlyTypes.includes(type);

        // Security check: Only admin operations require verification
        if (isAdminOperation) {
            if (!adminUsername || !isServerSideAdmin(adminUsername)) {
                logSecurityAttempt(adminUsername, `${type} notification (admin operation)`, request, false);
                return createUnauthorizedResponse();
            }
            logSecurityAttempt(adminUsername, `${type} notification (admin operation)`, request, true);
        }

        // Create notification object
        const notification: HiveToFarcasterNotification = {
            type,
            title: title.substring(0, 32), // Ensure Farcaster limit
            body: messageBody.substring(0, 128), // Ensure Farcaster limit
            hiveUsername: hiveUsername || 'skatehive',
            sourceUrl: sourceUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://skatehive.app',
            metadata: {
                author: 'skatehive',
                permlink: type === 'custom' ? 'custom-notification' : 'test-notification',
            }
        };

        // Determine target users
        let finalTargetUsers = targetUsers;

        if (broadcast) {
            // Send to all users by not specifying targetUsers
            finalTargetUsers = undefined;
        } else if (!targetUsers && hiveUsername) {
            // Send to specific user
            finalTargetUsers = [hiveUsername];
        }

        // Send notification
        const result = await farcasterNotificationService.sendNotification(
            notification,
            finalTargetUsers
        );

        return NextResponse.json({
            success: result.success,
            results: result.results,
            notification,
            message: broadcast ? 'Broadcast notification sent to all users' : 'Notification sent'
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
                type: 'vote | comment | follow | mention | reblog | transfer | custom',
                title: 'Notification title (max 32 chars)',
                body: 'Notification body (max 128 chars)',
                hiveUsername: 'Target Hive username (optional)',
                targetUsers: ['array', 'of', 'hive', 'usernames'], // optional
                sourceUrl: 'URL to open when clicked (optional)',
                broadcast: 'true to send to all users, false for targeted (optional)'
            }
        },
        examples: {
            testNotification: {
                type: 'test',
                title: '� Test Notification',
                body: 'This is a test notification from SkateHive!',
                hiveUsername: 'skatehive',
                sourceUrl: 'https://skatehive.app'
            },
            customBroadcast: {
                type: 'custom',
                title: '📢 Announcement',
                body: 'New features available on SkateHive!',
                sourceUrl: 'https://skatehive.app',
                broadcast: true
            }
        }
    });
}
