import { sql } from '@vercel/postgres';
import { Notifications } from '@hiveio/dhive';
import { serverHiveClient } from '@/lib/hive/server-client';
import { SkateHiveFarcasterService, FarcasterPreferences } from './skatehive-integration';
import { farcasterNotificationService } from './notification-service';
import { getTokenStore } from './token-store-factory';
import { HiveToFarcasterNotification } from '@/types/farcaster';

// Configure the database connection
const getDatabaseUrl = () => {
    return process.env.STORAGE_POSTGRES_URL || process.env.POSTGRES_URL;
};

// Ensure we have a database connection
if (getDatabaseUrl()) {
    // Set the URL for Vercel Postgres if using STORAGE_ prefix
    if (process.env.STORAGE_POSTGRES_URL && !process.env.POSTGRES_URL) {
        process.env.POSTGRES_URL = process.env.STORAGE_POSTGRES_URL;
    }
}

/**
 * Automated Notification Service for Hive → Farcaster
 * Continuously processes unread notifications every minute, sending them from oldest to newest
 * until all unread notifications are sent. No scheduling needed - fully automated.
 */
export class AutomatedNotificationService {

    /**
     * Process unread notifications for all users with active Farcaster tokens
     * Runs every minute via cron, sends notifications from bottom to top (oldest first)
     */
    static async processUnreadNotifications(): Promise<{
        processedUsers: number;
        totalNotificationsSent: number;
        errors: string[];
        processedNotifications: any[];
    }> {
        const results = {
            processedUsers: 0,
            totalNotificationsSent: 0,
            errors: [] as string[],
            processedNotifications: [] as any[]
        };

        try {
            console.log(`[AutomatedNotificationService] Starting automated notification processing at ${new Date().toISOString()}`);

            // Get all users with active Farcaster tokens
            const activeUsers = await this.getActiveUsers();
            console.log(`[AutomatedNotificationService] Found ${activeUsers.length} active users with Farcaster tokens`);

            for (const user of activeUsers) {
                try {
                    console.log(`[AutomatedNotificationService] Processing notifications for ${user.hiveUsername || user.fid}`);

                    const sentCount = await this.processUserUnreadNotifications(user);

                    if (sentCount > 0) {
                        results.processedUsers++;
                        results.totalNotificationsSent += sentCount;
                        console.log(`[AutomatedNotificationService] ✅ Sent ${sentCount} notifications to ${user.hiveUsername || user.fid}`);
                    } else {
                        console.log(`[AutomatedNotificationService] No new notifications for ${user.hiveUsername || user.fid}`);
                    }
                } catch (userError) {
                    const errorMsg = `Failed to process notifications for ${user.hiveUsername || user.fid}: ${userError instanceof Error ? userError.message : 'Unknown error'}`;
                    console.error(`[AutomatedNotificationService] ❌ ${errorMsg}`);
                    results.errors.push(errorMsg);
                }
            }

            console.log(`[AutomatedNotificationService] Completed processing. Processed ${results.processedUsers} users, sent ${results.totalNotificationsSent} notifications total`);

        } catch (error) {
            const errorMsg = `Failed to process automated notifications: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[AutomatedNotificationService] ❌ ${errorMsg}`);
            results.errors.push(errorMsg);
        }

        return results;
    }

    /**
     * Get all users with active Farcaster tokens and notification preferences
     */
    private static async getActiveUsers(): Promise<Array<{
        fid: string;
        hiveUsername: string;
        farcasterUsername: string;
        lastNotificationId?: number;
    }>> {
        try {
            const result = await sql`
                SELECT 
                    t.fid,
                    p.hive_username,
                    t.username as farcaster_username,
                    p.last_notification_id
                FROM farcaster_tokens t
                JOIN skatehive_farcaster_preferences p ON t.fid = p.fid
                WHERE t.is_active = true
                  AND p.notifications_enabled = true
                ORDER BY p.hive_username
            `;

            return result.rows.map(row => ({
                fid: row.fid,
                hiveUsername: row.hive_username,
                farcasterUsername: row.farcaster_username,
                lastNotificationId: row.last_notification_id
            }));
        } catch (error) {
            console.error('Failed to get active users:', error);
            return [];
        }
    }

    /**
     * Process unread notifications for a specific user
     */
    private static async processUserUnreadNotifications(user: {
        fid: string;
        hiveUsername: string;
        farcasterUsername: string;
        lastNotificationId?: number;
    }): Promise<number> {
        try {
            // Fetch user's notifications from Hive
            const allNotifications = await serverHiveClient.fetchNotifications(user.hiveUsername);

            if (!allNotifications || allNotifications.length === 0) {
                console.log(`No notifications found for ${user.hiveUsername}`);
                return 0;
            }

            // Filter notifications to only those newer than the last processed one
            const newNotifications = allNotifications.filter(notification => {
                // If we have a last processed ID, only include notifications with higher IDs
                if (user.lastNotificationId && notification.id) {
                    return notification.id > user.lastNotificationId;
                }
                // If no last processed ID, include all notifications
                return true;
            });

            console.log(`[processUserUnreadNotifications] Found ${newNotifications.length} new notifications out of ${allNotifications.length} total for ${user.hiveUsername} (last processed ID: ${user.lastNotificationId})`);

            if (newNotifications.length === 0) {
                console.log(`No new notifications to send for ${user.hiveUsername}`);
                return 0;
            }

            // Sort notifications oldest first (ascending by ID)
            const sortedNotifications = newNotifications.sort((a, b) => {
                if (a.id && b.id) {
                    return a.id - b.id;
                }
                return 0;
            });

            // Convert Hive notifications to Farcaster format
            const farcasterNotifications: HiveToFarcasterNotification[] = sortedNotifications.map((notification: Notifications) => {
                return this.convertHiveToFarcasterNotification(notification, user.hiveUsername);
            });

            console.log(`[processUserUnreadNotifications] Will attempt to send ${farcasterNotifications.length} notifications`);

            // Send notifications to Farcaster
            let sentCount = 0;
            const tokenStore = getTokenStore();
            const userToken = await tokenStore.getTokenByFid(user.fid);

            if (!userToken || !userToken.isActive) {
                console.log(`No active Farcaster token found for FID ${user.fid} (user: ${user.hiveUsername})`);
                return 0;
            }

            console.log(`[processUserUnreadNotifications] Found active token for FID ${user.fid} (user: ${user.hiveUsername})`);

            for (let i = 0; i < farcasterNotifications.length; i++) {
                const notification = farcasterNotifications[i];
                const originalNotification = sortedNotifications[i];
                console.log(`[processUserUnreadNotifications] Sending notification ${i + 1}/${farcasterNotifications.length} to ${user.hiveUsername}: ${notification.title}`);

                try {
                    // Send notification directly using token details
                    const result = await this.sendNotificationDirectly(
                        notification,
                        userToken
                    );

                    if (result.success) {
                        sentCount++;
                        console.log(`[processUserUnreadNotifications] ✅ Successfully sent notification ${i + 1} to ${user.hiveUsername}`);

                        // Log the notification for analytics
                        await SkateHiveFarcasterService.logNotification(
                            user.hiveUsername,
                            'automated_notification',
                            notification.title,
                            notification.body,
                            true,
                            undefined,
                            notification.sourceUrl
                        );
                    } else {
                        console.log(`[processUserUnreadNotifications] ❌ Failed to send notification ${i + 1} to ${user.hiveUsername}`);
                    }
                } catch (error) {
                    console.error(`[processUserUnreadNotifications] ❌ Error sending notification ${i + 1} to ${user.hiveUsername}:`, error);

                    // Log the failed notification
                    await SkateHiveFarcasterService.logNotification(
                        user.hiveUsername,
                        'automated_notification',
                        notification.title,
                        notification.body,
                        false,
                        error instanceof Error ? error.message : 'Unknown error',
                        notification.sourceUrl
                    );
                }
            }

            // Update the last processed notification ID to the highest ID from this batch
            if (sortedNotifications.length > 0) {
                const processedIds = sortedNotifications
                    .map((n: any) => n.id)
                    .filter((id: any) => id !== undefined && id !== null)
                    .map((id: any) => Number(id));

                if (processedIds.length > 0) {
                    const highestProcessedId = Math.max(...processedIds);

                    console.log(`[processUserUnreadNotifications] Updating last processed notification ID from ${user.lastNotificationId} to ${highestProcessedId} for ${user.hiveUsername}`);

                    await sql`
                        UPDATE skatehive_farcaster_preferences 
                        SET last_notification_id = ${highestProcessedId}
                        WHERE hive_username = ${user.hiveUsername}
                    `;
                }
            }

            console.log(`Sent ${sentCount}/${sortedNotifications.length} automated notifications to ${user.hiveUsername}`);
            return sentCount;

        } catch (error) {
            console.error(`Failed to process automated notifications for ${user.hiveUsername}:`, error);
            throw error;
        }
    }

    /**
     * Convert Hive notification to Farcaster format
     */
    private static convertHiveToFarcasterNotification(
        hiveNotification: Notifications,
        hiveUsername: string
    ): HiveToFarcasterNotification {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skatehive.app';
        const type = hiveNotification.type;

        let title = '🛹 SkateHive';
        let body = hiveNotification.msg || 'New activity';
        let sourceUrl = baseUrl;

        // Parse additional info from the URL if available
        let author = '';
        let permlink = '';

        if (hiveNotification.url) {
            const cleanUrl = hiveNotification.url.replace(/^@/, '').replace(/\/@/g, '/');
            const urlParts = cleanUrl.split('/').filter(part => part.length > 0);

            if (urlParts.length >= 1) {
                author = urlParts[0];
            }
            if (urlParts.length >= 2) {
                permlink = urlParts[1];
            }
        }

        switch (type) {
            case 'vote':
                title = '🔥 New Vote';
                body = hiveNotification.msg || 'Someone voted on your post';
                if (author && permlink) {
                    sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                } else {
                    sourceUrl = `${baseUrl}/profile/${hiveUsername}`;
                }
                break;

            case 'comment':
                title = '💬 New Comment';
                body = hiveNotification.msg || 'Someone commented on your post';
                if (author && permlink) {
                    sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                } else {
                    sourceUrl = `${baseUrl}/profile/${hiveUsername}`;
                }
                break;

            case 'follow':
                title = '👥 New Follower';
                body = hiveNotification.msg || 'Someone started following you';
                sourceUrl = `${baseUrl}/profile/${hiveUsername}`;
                break;

            case 'mention':
                title = '📢 Mentioned';
                body = hiveNotification.msg || 'Someone mentioned you';
                if (author && permlink) {
                    sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                } else {
                    sourceUrl = `${baseUrl}/profile/${hiveUsername}`;
                }
                break;

            case 'reblog':
                title = '🔄 Reblogged';
                body = hiveNotification.msg || 'Someone reblogged your post';
                if (author && permlink) {
                    sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                } else {
                    sourceUrl = `${baseUrl}/profile/${hiveUsername}`;
                }
                break;

            case 'transfer':
                title = '💰 Transfer';
                body = hiveNotification.msg || 'Someone sent you tokens';
                sourceUrl = `${baseUrl}/wallet`;
                break;

            default:
                title = '🛹 SkateHive';
                body = hiveNotification.msg || 'New activity';
                sourceUrl = baseUrl;
        }

        // Ensure the URL is valid and properly formatted
        try {
            new URL(sourceUrl);
        } catch (error) {
            console.warn(`Invalid URL generated: ${sourceUrl}, falling back to base URL`);
            sourceUrl = baseUrl;
        }

        // Truncate to Farcaster limits
        title = title.substring(0, 32);
        body = body.substring(0, 128);

        return {
            type: type as any,
            title,
            body,
            hiveUsername,
            sourceUrl,
            metadata: {
                author,
                permlink
            }
        };
    }

    /**
     * Send notification directly to a specific Farcaster token
     */
    private static async sendNotificationDirectly(
        notification: HiveToFarcasterNotification,
        userToken: any
    ): Promise<{ success: boolean }> {
        try {
            const response = await fetch(userToken.notificationUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    notificationId: `skatehive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: notification.title,
                    body: notification.body,
                    targetUrl: notification.sourceUrl,
                    tokens: [userToken.token]
                })
            });

            if (!response.ok) {
                console.error(`Failed to send notification to ${userToken.fid}: ${response.status} ${response.statusText}`);
                return { success: false };
            }

            const responseData = await response.json();
            console.log(`Successfully sent notification to FID ${userToken.fid}:`, responseData);
            return { success: true };

        } catch (error) {
            console.error(`Error sending notification to FID ${userToken.fid}:`, error);
            return { success: false };
        }
    }
    errors: string[];
    upcomingNotifications: any[];
    nextScheduledTime: string | null;
} = {
    processedUsers: 0,
        totalNotificationsSent: 0,
            errors: [],
                upcomingNotifications: [],
                    nextScheduledTime: null
};

try {
    // Get detailed info about all scheduled users and upcoming notifications
    const allScheduledUsers = await this.getAllScheduledUsersInfo();
    const nextScheduledInfo = await this.getNextScheduledNotificationInfo();

    results.upcomingNotifications = allScheduledUsers;
    results.nextScheduledTime = nextScheduledInfo.nextTime;

    console.log('[CRON DEBUG] Current time (UTC):', new Date().toISOString());
    console.log('[CRON DEBUG] All users with scheduled notifications:', allScheduledUsers);
    console.log('[CRON DEBUG] Next scheduled notification:', nextScheduledInfo);

    // Get all users who have scheduled notifications enabled
    const users = await this.getUsersReadyForScheduledNotifications();
    console.log('[DEBUG] Users selected for scheduled notifications:', users.map(u => u.hiveUsername));

    for (const user of users) {
        try {
            const notificationCount = await this.processUserScheduledNotifications(user);
            results.processedUsers++;
            results.totalNotificationsSent += notificationCount;
        } catch (error) {
            const errorMsg = `Failed to process notifications for ${user.hiveUsername}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            results.errors.push(errorMsg);
            console.error(errorMsg);
        }
    }

    console.log(`Processed scheduled notifications: ${results.processedUsers} users, ${results.totalNotificationsSent} notifications sent`);

} catch (error) {
    const errorMsg = `Failed to process scheduled notifications: ${error instanceof Error ? error.message : 'Unknown error'}`;
    results.errors.push(errorMsg);
    console.error(errorMsg);
}

return results;
    }

    /**
     * Get users who are ready for their scheduled notification check
     */
    private static async getUsersReadyForScheduledNotifications(): Promise < ScheduledNotificationConfig[] > {
    try {


        const now = new Date();
        const currentHour = now.getUTCHours();
        const currentMinute = now.getUTCMinutes();
        const minMinute = (currentMinute - 5 + 60) % 60;
        const maxMinute = (currentMinute + 5) % 60;

        console.log('[DEBUG] Scheduled notification query params:', {
            currentHour,
            currentMinute,
            minMinute,
            maxMinute
        });

        // Find users whose preferred time is within ±5 minutes of current time
        const result = await sql`
                SELECT 
                    p.hive_username,
                    p.scheduled_time_hour,
                    p.scheduled_time_minute,
                    p.timezone,
                    p.max_notifications_per_batch,
                    p.last_scheduled_notification_id
                FROM skatehive_farcaster_preferences p
                JOIN farcaster_tokens t ON p.fid = t.fid
                WHERE p.scheduled_notifications_enabled = true
                  AND p.notifications_enabled = true
                  AND t.is_active = true
                  AND p.scheduled_time_hour = ${currentHour}
                  AND (
                    (p.scheduled_time_minute >= ${minMinute} AND p.scheduled_time_minute <= ${maxMinute})
                  )
            `;

        console.log('[DEBUG] Raw SQL result for scheduled notifications:', result.rows);

        const selectedUsers = result.rows.map(row => ({
            hiveUsername: row.hive_username,
            scheduledTimeHour: row.scheduled_time_hour,
            scheduledTimeMinute: row.scheduled_time_minute,
            timezone: row.timezone,
            maxNotificationsPerBatch: row.max_notifications_per_batch,
            lastScheduledNotificationId: row.last_scheduled_notification_id
        }));

        console.log('[DEBUG] Users selected for scheduled notifications:', selectedUsers);
        return selectedUsers;

    } catch(error) {
        console.error('Failed to get users ready for scheduled notifications:', error);
        return [];
    }
}

    /**
     * Process scheduled notifications for a specific user
     */
    private static async processUserScheduledNotifications(
    config: ScheduledNotificationConfig
): Promise < number > {
    const { hiveUsername, maxNotificationsPerBatch, lastScheduledNotificationId } = config;

    console.log(`[processUserScheduledNotifications] ENTERED for ${hiveUsername}`);
    try {
        // Log user preferences and next notification time at the start
        const now = new Date();
        console.log(`[processUserScheduledNotifications] User preferences for ${hiveUsername}:`, {
            hiveUsername,
            maxNotificationsPerBatch,
            lastScheduledNotificationId,
        });
        console.log(`[processUserScheduledNotifications] Next scheduled notification for ${hiveUsername} at ${now.toISOString()} (UTC hour: ${now.getUTCHours()}, minute: ${now.getUTCMinutes()})`);


        // Fetch user's notifications from Hive
        const allNotifications = await serverHiveClient.fetchNotifications(hiveUsername);

        if(!allNotifications || allNotifications.length === 0) {
    console.log(`No notifications found for ${hiveUsername}`);
    return 0;
}

// Filter notifications to only those newer than the last processed one
const newNotifications = allNotifications.filter(notification => {
    // If we have a last processed ID, only include notifications with higher IDs
    if (lastScheduledNotificationId && notification.id) {
        return notification.id > lastScheduledNotificationId;
    }
    // If no last processed ID, include all notifications
    return true;
});

console.log(`[processUserScheduledNotifications] Found ${newNotifications.length} new notifications out of ${allNotifications.length} total for ${hiveUsername} (last processed ID: ${lastScheduledNotificationId})`);

if (newNotifications.length === 0) {
    console.log(`No new notifications to send for ${hiveUsername}`);
    return 0;
}

// Limit to user's preference for batch size
const notificationsToSend = newNotifications.slice(0, maxNotificationsPerBatch);

console.log(`[processUserScheduledNotifications] Will attempt to send ${notificationsToSend.length} notifications (max batch size: ${maxNotificationsPerBatch})`);

// Convert Hive notifications to Farcaster format
const farcasterNotifications: HiveToFarcasterNotification[] = notificationsToSend.map((notification: Notifications) => {
    return ScheduledNotificationService.convertHiveToFarcasterNotification(notification, hiveUsername);
});

console.log(`[processUserScheduledNotifications] Converted ${farcasterNotifications.length} notifications to Farcaster format`);

// Log the notifications we're about to send
if (farcasterNotifications.length > 0) {
    console.log(`[processUserScheduledNotifications] Notifications for ${hiveUsername}:`);
    farcasterNotifications.forEach((notification, index) => {
        console.log(`  ${index + 1}. ${notification.title}: ${notification.body}`);
    });
} else {
    console.log(`[processUserScheduledNotifications] No notifications to send for ${hiveUsername}`);
}

// Send notifications to Farcaster
let sentCount = 0;

// Get user's FID from preferences
const userPreferences = await SkateHiveFarcasterService.getUserPreferences(hiveUsername);
if (!userPreferences?.fid) {
    console.log(`No FID found for user ${hiveUsername}, cannot send Farcaster notifications`);
    return 0;
}

const tokenStore = getTokenStore();
const userToken = await tokenStore.getTokenByFid(userPreferences.fid);

if (!userToken || !userToken.isActive) {
    console.log(`No active Farcaster token found for FID ${userPreferences.fid} (user: ${hiveUsername})`);
    return 0;
}

console.log(`[processUserScheduledNotifications] Found active token for FID ${userPreferences.fid} (user: ${hiveUsername})`);
console.log(`[processUserScheduledNotifications] Starting to send ${farcasterNotifications.length} notifications...`); for (let i = 0; i < farcasterNotifications.length; i++) {
    const notification = farcasterNotifications[i];
    const originalNotification = notificationsToSend[i]; // Get the original Hive notification for ID tracking
    console.log(`[processUserScheduledNotifications] Sending notification ${i + 1}/${farcasterNotifications.length} to ${hiveUsername}: ${notification.title}`);

    try {
        // Send notification directly using token details
        const result = await this.sendNotificationDirectly(
            notification,
            userToken
        );

        if (result.success) {
            sentCount++;
            console.log(`[processUserScheduledNotifications] ✅ Successfully sent notification ${i + 1} to ${hiveUsername}`);

            // Log the notification for analytics (but not for deduplication)
            await SkateHiveFarcasterService.logNotification(
                hiveUsername,
                'scheduled_notification',
                notification.title,
                notification.body,
                true,
                undefined,
                notification.sourceUrl
            );
        } else {
            console.log(`[processUserScheduledNotifications] ❌ Failed to send notification ${i + 1} to ${hiveUsername}`);
        }
    } catch (error) {
        console.error(`[processUserScheduledNotifications] ❌ Error sending notification ${i + 1} to ${hiveUsername}:`, error);

        // Log the failed notification
        await SkateHiveFarcasterService.logNotification(
            hiveUsername,
            'scheduled_notification',
            notification.title,
            notification.body,
            false,
            error instanceof Error ? error.message : 'Unknown error',
            notification.sourceUrl
        );
    }
}

// Update the last processed notification ID to the highest ID from this batch
// This ensures the next cron run will start from where this one left off
if (notificationsToSend.length > 0) {
    const processedIds = notificationsToSend
        .map((n: any) => n.id)
        .filter((id: any) => id !== undefined && id !== null)
        .map((id: any) => Number(id));

    if (processedIds.length > 0) {
        const highestProcessedId = Math.max(...processedIds);

        console.log(`[processUserScheduledNotifications] Updating last processed notification ID from ${lastScheduledNotificationId} to ${highestProcessedId} for ${hiveUsername}`);

        await sql`
                        UPDATE skatehive_farcaster_preferences 
                        SET last_scheduled_notification_id = ${highestProcessedId}
                        WHERE hive_username = ${hiveUsername}
                    `;
    } else {
        console.log(`[processUserScheduledNotifications] No valid notification IDs found to update for ${hiveUsername}`);
    }
}

console.log(`Sent ${sentCount}/${notificationsToSend.length} scheduled notifications to ${hiveUsername}`);
return sentCount;

        } catch (error) {
    console.error(`Failed to process scheduled notifications for ${hiveUsername}:`, error);
    throw error;
}
    }

    /**
     * Convert Hive notification to Farcaster format
     */
    private static convertHiveToFarcasterNotification(
    hiveNotification: Notifications,
    hiveUsername: string
): HiveToFarcasterNotification {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skatehive.app';
    const type = hiveNotification.type;

    let title = '🛹 SkateHive';
    let body = hiveNotification.msg || 'New activity';
    let sourceUrl = baseUrl; // Default to base URL

    console.log(`[convertHiveToFarcasterNotification] Processing notification for ${hiveUsername}:`, {
        type,
        originalUrl: hiveNotification.url,
        msg: hiveNotification.msg
    });

    // Parse additional info from the URL if available
    let author = '';
    let permlink = '';

    if (hiveNotification.url) {
        // Clean up the URL - remove @ symbols and handle different formats
        const cleanUrl = hiveNotification.url.replace(/^@/, '').replace(/\/@/g, '/');
        const urlParts = cleanUrl.split('/').filter(part => part.length > 0);

        if (urlParts.length >= 1) {
            author = urlParts[0];
        }
        if (urlParts.length >= 2) {
            permlink = urlParts[1];
        }

        console.log(`[convertHiveToFarcasterNotification] Parsed URL parts:`, {
            cleanUrl,
            urlParts,
            author,
            permlink
        });
    }

    switch (type) {
        case 'vote':
            title = '🔥 New Vote';
            body = hiveNotification.msg || 'Someone voted on your post';
            if (author && permlink) {
                sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
            } else {
                sourceUrl = `${baseUrl}/profile/${hiveUsername}`;
            }
            break;

        case 'comment':
            title = '💬 New Comment';
            body = hiveNotification.msg || 'Someone commented on your post';
            if (author && permlink) {
                sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
            } else {
                sourceUrl = `${baseUrl}/profile/${hiveUsername}`;
            }
            break;

        case 'follow':
            title = '👥 New Follower';
            body = hiveNotification.msg || 'Someone started following you';
            sourceUrl = `${baseUrl}/profile/${hiveUsername}`;
            break;

        case 'mention':
            title = '📢 Mentioned';
            body = hiveNotification.msg || 'Someone mentioned you';
            if (author && permlink) {
                sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
            } else {
                sourceUrl = `${baseUrl}/profile/${hiveUsername}`;
            }
            break;

        case 'reblog':
            title = '🔄 Reblogged';
            body = hiveNotification.msg || 'Someone reblogged your post';
            if (author && permlink) {
                sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
            } else {
                sourceUrl = `${baseUrl}/profile/${hiveUsername}`;
            }
            break;

        case 'transfer':
            title = '💰 Transfer';
            body = hiveNotification.msg || 'Someone sent you tokens';
            sourceUrl = `${baseUrl}/wallet`;
            break;

        default:
            title = '🛹 SkateHive';
            body = hiveNotification.msg || 'New activity';
            sourceUrl = baseUrl;
    }

    // Ensure the URL is valid and properly formatted
    try {
        new URL(sourceUrl);
    } catch (error) {
        console.warn(`[convertHiveToFarcasterNotification] Invalid URL generated: ${sourceUrl}, falling back to base URL`);
        sourceUrl = baseUrl;
    }

    // Truncate to Farcaster limits
    title = title.substring(0, 32);
    body = body.substring(0, 128);

    console.log(`[convertHiveToFarcasterNotification] Final notification for ${hiveUsername}:`, {
        title,
        body,
        sourceUrl
    });

    return {
        type: type as any,
        title,
        body,
        hiveUsername,
        sourceUrl,
        metadata: {
            author,
            permlink
        }
    };
}

    /**
     * Update user's scheduled notification preferences
     */
    static async updateScheduledPreferences(
    hiveUsername: string,
    preferences: {
    scheduledNotificationsEnabled?: boolean;
    scheduledTimeHour?: number;
    scheduledTimeMinute?: number;
    timezone?: string;
    maxNotificationsPerBatch?: number;
}
): Promise < { success: boolean; message: string } > {
    try {
        // Validate inputs
        if(preferences.scheduledTimeHour !== undefined &&
            (preferences.scheduledTimeHour < 0 || preferences.scheduledTimeHour > 23)) {
    return { success: false, message: 'Hour must be between 0 and 23' };
}

if (preferences.scheduledTimeMinute !== undefined &&
    (preferences.scheduledTimeMinute < 0 || preferences.scheduledTimeMinute > 59)) {
    return { success: false, message: 'Minute must be between 0 and 59' };
}

if (preferences.maxNotificationsPerBatch !== undefined &&
    (preferences.maxNotificationsPerBatch < 1 || preferences.maxNotificationsPerBatch > 20)) {
    return { success: false, message: 'Max notifications per batch must be between 1 and 20' };
}

// Build update query dynamically
const updates = [];
const values = [];
let paramIndex = 1;

if (preferences.scheduledNotificationsEnabled !== undefined) {
    updates.push(`scheduled_notifications_enabled = $${paramIndex++}`);
    values.push(preferences.scheduledNotificationsEnabled);
}

if (preferences.scheduledTimeHour !== undefined) {
    updates.push(`scheduled_time_hour = $${paramIndex++}`);
    values.push(preferences.scheduledTimeHour);
}

if (preferences.scheduledTimeMinute !== undefined) {
    updates.push(`scheduled_time_minute = $${paramIndex++}`);
    values.push(preferences.scheduledTimeMinute);
}

if (preferences.timezone !== undefined) {
    updates.push(`timezone = $${paramIndex++}`);
    values.push(preferences.timezone);
}

if (preferences.maxNotificationsPerBatch !== undefined) {
    updates.push(`max_notifications_per_batch = $${paramIndex++}`);
    values.push(preferences.maxNotificationsPerBatch);
}

if (updates.length === 0) {
    return { success: false, message: 'No preferences to update' };
}

values.push(hiveUsername);

await sql.query(`
                UPDATE skatehive_farcaster_preferences 
                SET ${updates.join(', ')}
                WHERE hive_username = $${paramIndex}
            `, values);

return { success: true, message: 'Scheduled notification preferences updated successfully' };

        } catch (error) {
    console.error('Failed to update scheduled preferences:', error);
    return {
        success: false,
        message: `Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
}
    }

    /**
     * Get users who should receive notifications at a specific time
     * Useful for testing or manual triggers
     */
    static async getUsersForTime(hour: number, minute: number): Promise < string[] > {
    try {
        const result = await sql`
                SELECT p.hive_username
                FROM skatehive_farcaster_preferences p
                JOIN farcaster_tokens t ON p.fid = t.fid
                WHERE p.scheduled_notifications_enabled = true
                  AND p.notifications_enabled = true
                  AND t.is_active = true
                  AND p.scheduled_time_hour = ${hour}
                  AND p.scheduled_time_minute = ${minute}
            `;

        return result.rows.map(row => row.hive_username);
    } catch(error) {
        console.error('Failed to get users for time:', error);
        return [];
    }
}

    /**
     * Manually trigger scheduled notifications for a user (for testing)
     */
    static async triggerUserNotifications(hiveUsername: string): Promise < {
    success: boolean;
    notificationsSent: number;
    message: string;
} > {
    console.log(`[triggerUserNotifications] API called for ${hiveUsername}`);
    try {
        const preferences = await SkateHiveFarcasterService.getUserPreferences(hiveUsername);
        console.log(`[triggerUserNotifications] User preferences for ${hiveUsername}:`, preferences);
        if(!preferences) {
            return { success: false, notificationsSent: 0, message: 'User not found' };
        }
            if(!preferences.scheduledNotificationsEnabled) {
    return { success: false, notificationsSent: 0, message: 'Scheduled notifications are disabled for this user' };
}

const config: ScheduledNotificationConfig = {
    hiveUsername: preferences.hiveUsername,
    scheduledTimeHour: preferences.scheduledTimeHour,
    scheduledTimeMinute: preferences.scheduledTimeMinute,
    timezone: preferences.timezone,
    maxNotificationsPerBatch: preferences.maxNotificationsPerBatch,
    lastScheduledNotificationId: preferences.lastScheduledNotificationId
};

const notificationsSent = await this.processUserScheduledNotifications(config);

return {
    success: true,
    notificationsSent,
    message: `Successfully sent ${notificationsSent} notifications`
};

        } catch (error) {
    return {
        success: false,
        notificationsSent: 0,
        message: `Failed to trigger notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
}
    }

    /**
     * Get information about all users with scheduled notifications (for debugging/logging)
     */
    private static async getAllScheduledUsersInfo(): Promise < any[] > {
    try {
        const result = await sql`
                SELECT 
                    p.hive_username,
                    p.fid,
                    p.scheduled_time_hour,
                    p.scheduled_time_minute,
                    p.timezone,
                    p.scheduled_notifications_enabled,
                    p.notifications_enabled,
                    p.max_notifications_per_batch,
                    p.last_scheduled_notification_id,
                    t.is_active as token_active,
                    t.username as farcaster_username
                FROM skatehive_farcaster_preferences p
                LEFT JOIN farcaster_tokens t ON p.fid = t.fid
                WHERE p.scheduled_notifications_enabled = true
                ORDER BY p.scheduled_time_hour, p.scheduled_time_minute
            `;

        return result.rows.map(row => ({
            hiveUsername: row.hive_username,
            fid: row.fid,
            farcasterUsername: row.farcaster_username,
            scheduledTime: `${String(row.scheduled_time_hour).padStart(2, '0')}:${String(row.scheduled_time_minute).padStart(2, '0')} UTC`,
            timezone: row.timezone,
            scheduledNotificationsEnabled: row.scheduled_notifications_enabled,
            notificationsEnabled: row.notifications_enabled,
            tokenActive: row.token_active,
            maxNotificationsPerBatch: row.max_notifications_per_batch,
            lastScheduledNotificationId: row.last_scheduled_notification_id,
            readyToSend: row.scheduled_notifications_enabled && row.notifications_enabled && row.token_active
        }));
    } catch(error) {
        console.error('Failed to get all scheduled users info:', error);
        return [];
    }
}

    /**
     * Get information about the next scheduled notification time
     */
    private static async getNextScheduledNotificationInfo(): Promise < {
    nextTime: string | null;
    minutesUntilNext: number | null;
    usersAtNextTime: number;
} > {
    try {
        const now = new Date();
        const currentHour = now.getUTCHours();
        const currentMinute = now.getUTCMinutes();

        // Find the next scheduled time
        const result = await sql`
                SELECT 
                    scheduled_time_hour,
                    scheduled_time_minute,
                    COUNT(*) as user_count
                FROM skatehive_farcaster_preferences p
                JOIN farcaster_tokens t ON p.fid = t.fid
                WHERE p.scheduled_notifications_enabled = true
                  AND p.notifications_enabled = true
                  AND t.is_active = true
                GROUP BY scheduled_time_hour, scheduled_time_minute
                ORDER BY 
                    CASE 
                        WHEN (scheduled_time_hour > ${currentHour}) OR 
                             (scheduled_time_hour = ${currentHour} AND scheduled_time_minute > ${currentMinute})
                        THEN scheduled_time_hour * 60 + scheduled_time_minute
                        ELSE (scheduled_time_hour * 60 + scheduled_time_minute) + 1440
                    END
                LIMIT 1
            `;

        if(result.rows.length === 0) {
    return { nextTime: null, minutesUntilNext: null, usersAtNextTime: 0 };
}

const nextRow = result.rows[0];
const nextHour = nextRow.scheduled_time_hour;
const nextMinute = nextRow.scheduled_time_minute;
const userCount = nextRow.user_count;

const nextTime = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')} UTC`;

// Calculate minutes until next notification
const nowMinutes = currentHour * 60 + currentMinute;
const nextMinutes = nextHour * 60 + nextMinute;

let minutesUntilNext;
if (nextMinutes > nowMinutes) {
    minutesUntilNext = nextMinutes - nowMinutes;
} else {
    // Next day
    minutesUntilNext = (1440 - nowMinutes) + nextMinutes;
}

return {
    nextTime,
    minutesUntilNext,
    usersAtNextTime: userCount
};
        } catch (error) {
    console.error('Failed to get next scheduled notification info:', error);
    return { nextTime: null, minutesUntilNext: null, usersAtNextTime: 0 };
}
    }

    /**
     * Send notification directly to a specific Farcaster token
     */
    private static async sendNotificationDirectly(
    notification: HiveToFarcasterNotification,
    userToken: any
): Promise < { success: boolean } > {
    try {
        const response = await fetch(userToken.notificationUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                notificationId: `skatehive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: notification.title,
                body: notification.body,
                targetUrl: notification.sourceUrl,
                tokens: [userToken.token]
            })
        });

        if(!response.ok) {
    console.error(`Failed to send notification to ${userToken.fid}: ${response.status} ${response.statusText}`);
    return { success: false };
}

const responseData = await response.json();
console.log(`Successfully sent notification to FID ${userToken.fid}:`, responseData);
return { success: true };

        } catch (error) {
    console.error(`Error sending notification to FID ${userToken.fid}:`, error);
    return { success: false };
}
    }

}
