import { sql } from '@vercel/postgres';
import { Notifications } from '@hiveio/dhive';
import { serverHiveClient } from '@/lib/hive/server-client';
import { SkateHiveFarcasterService, FarcasterPreferences } from './skatehive-integration';
import { farcasterNotificationService } from './notification-service';
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

export interface ScheduledNotificationConfig {
    hiveUsername: string;
    scheduledTimeHour: number;
    scheduledTimeMinute: number;
    timezone: string;
    maxNotificationsPerBatch: number;
    lastScheduledNotificationId: number;
}

/**
 * Service for handling scheduled Farcaster notifications from Hive
 * Runs at user-preferred times to avoid costly real-time streaming
 */
export class ScheduledNotificationService {

    /**
     * Check if it's time to send notifications for any users
     * This should be called every minute by a cron job
     */
    static async processScheduledNotifications(): Promise<{
        processedUsers: number;
        totalNotificationsSent: number;
        errors: string[];
    }> {
        const results: {
            processedUsers: number;
            totalNotificationsSent: number;
            errors: string[];
        } = {
            processedUsers: 0,
            totalNotificationsSent: 0,
            errors: []
        };

        try {
            // Get all users who have scheduled notifications enabled
            const users = await this.getUsersReadyForScheduledNotifications();

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
    private static async getUsersReadyForScheduledNotifications(): Promise<ScheduledNotificationConfig[]> {
        try {
            const now = new Date();
            const currentHour = now.getUTCHours();
            const currentMinute = now.getUTCMinutes();

            // Find users whose scheduled time matches current time (within 1 minute window)
            // and haven't been checked in the last 23 hours
            const result = await sql`
                SELECT 
                    p.hive_username,
                    p.scheduled_time_hour,
                    p.scheduled_time_minute,
                    p.timezone,
                    p.max_notifications_per_batch,
                    p.last_scheduled_notification_id,
                    p.last_scheduled_check
                FROM skatehive_farcaster_preferences p
                JOIN farcaster_tokens t ON p.fid = t.fid
                WHERE p.scheduled_notifications_enabled = true
                  AND p.notifications_enabled = true
                  AND t.is_active = true
                  AND p.scheduled_time_hour = ${currentHour}
                  AND p.scheduled_time_minute = ${currentMinute}
                  AND (
                    p.last_scheduled_check IS NULL 
                    OR p.last_scheduled_check < NOW() - INTERVAL '23 hours'
                  )
            `;

            return result.rows.map(row => ({
                hiveUsername: row.hive_username,
                scheduledTimeHour: row.scheduled_time_hour,
                scheduledTimeMinute: row.scheduled_time_minute,
                timezone: row.timezone,
                maxNotificationsPerBatch: row.max_notifications_per_batch,
                lastScheduledNotificationId: row.last_scheduled_notification_id
            }));

        } catch (error) {
            console.error('Failed to get users ready for scheduled notifications:', error);
            return [];
        }
    }

    /**
     * Process scheduled notifications for a specific user
     */
    private static async processUserScheduledNotifications(
        config: ScheduledNotificationConfig
    ): Promise<number> {
        const { hiveUsername, maxNotificationsPerBatch, lastScheduledNotificationId } = config;

        try {
            // Update the last scheduled check time
            await sql`
                UPDATE skatehive_farcaster_preferences 
                SET last_scheduled_check = NOW()
                WHERE hive_username = ${hiveUsername}
            `;

            // Fetch user's notifications from Hive
            const allNotifications = await serverHiveClient.fetchNotifications(hiveUsername);

            if (!allNotifications || allNotifications.length === 0) {
                console.log(`No notifications found for ${hiveUsername}`);
                return 0;
            }

            // Filter to unread notifications since last scheduled check
            const unreadNotifications = allNotifications
                .filter((notification: Notifications) => {
                    // Filter by notification ID if we track them
                    return notification.id && notification.id > lastScheduledNotificationId;
                })
                .slice(0, maxNotificationsPerBatch); // Limit to user's preference

            if (unreadNotifications.length === 0) {
                console.log(`No new notifications for ${hiveUsername} since last check`);
                return 0;
            }

            // Convert Hive notifications to Farcaster format
            const farcasterNotifications: HiveToFarcasterNotification[] = unreadNotifications.map((notification: Notifications) => {
                return ScheduledNotificationService.convertHiveToFarcasterNotification(notification, hiveUsername);
            });

            // Send notifications to Farcaster
            let sentCount = 0;
            for (const notification of farcasterNotifications) {
                try {
                    const result = await farcasterNotificationService.sendNotification(
                        notification,
                        [hiveUsername]
                    );

                    if (result.success && result.results.length > 0) {
                        sentCount++;

                        // Log the notification
                        await SkateHiveFarcasterService.logNotification(
                            hiveUsername,
                            notification.type,
                            notification.title,
                            notification.body,
                            true,
                            undefined,
                            notification.sourceUrl
                        );
                    }
                } catch (error) {
                    console.error(`Failed to send notification to ${hiveUsername}:`, error);

                    // Log the failed notification
                    await SkateHiveFarcasterService.logNotification(
                        hiveUsername,
                        notification.type,
                        notification.title,
                        notification.body,
                        false,
                        error instanceof Error ? error.message : 'Unknown error',
                        notification.sourceUrl
                    );
                }
            }

            // Update the last processed notification ID
            if (unreadNotifications.length > 0) {
                const highestId = Math.max(...unreadNotifications.map(n => n.id).filter(id => id !== undefined));

                await sql`
                    UPDATE skatehive_farcaster_preferences 
                    SET last_scheduled_notification_id = ${highestId}
                    WHERE hive_username = ${hiveUsername}
                `;
            }

            console.log(`Sent ${sentCount}/${unreadNotifications.length} scheduled notifications to ${hiveUsername}`);
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
        let sourceUrl = hiveNotification.url || baseUrl;

        // Parse additional info from the URL if available
        const urlParts = hiveNotification.url ? hiveNotification.url.split('/') : [];
        const author = urlParts.length > 1 ? urlParts[urlParts.length - 2] : '';
        const permlink = urlParts.length > 0 ? urlParts[urlParts.length - 1] : '';

        switch (type) {
            case 'vote':
                title = '🔥 New Vote';
                body = hiveNotification.msg || 'Someone voted on your post';
                sourceUrl = hiveNotification.url || `${baseUrl}/post/${author}/${permlink}`;
                break;

            case 'comment':
                title = '💬 New Comment';
                body = hiveNotification.msg || 'Someone commented on your post';
                sourceUrl = hiveNotification.url || `${baseUrl}/post/${author}/${permlink}`;
                break;

            case 'follow':
                title = '👥 New Follower';
                body = hiveNotification.msg || 'Someone started following you';
                sourceUrl = hiveNotification.url || `${baseUrl}/profile/${author}`;
                break;

            case 'mention':
                title = '📢 Mentioned';
                body = hiveNotification.msg || 'Someone mentioned you';
                sourceUrl = hiveNotification.url || `${baseUrl}/post/${author}/${permlink}`;
                break;

            case 'reblog':
                title = '🔄 Reblogged';
                body = hiveNotification.msg || 'Someone reblogged your post';
                sourceUrl = hiveNotification.url || `${baseUrl}/post/${author}/${permlink}`;
                break;

            case 'transfer':
                title = '💰 Transfer';
                body = hiveNotification.msg || 'Someone sent you tokens';
                sourceUrl = hiveNotification.url || `${baseUrl}/wallet`;
                break;

            default:
                title = '🛹 SkateHive';
                body = hiveNotification.msg || 'New activity';
                sourceUrl = hiveNotification.url || baseUrl;
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
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Validate inputs
            if (preferences.scheduledTimeHour !== undefined &&
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
    static async getUsersForTime(hour: number, minute: number): Promise<string[]> {
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
        } catch (error) {
            console.error('Failed to get users for time:', error);
            return [];
        }
    }

    /**
     * Manually trigger scheduled notifications for a user (for testing)
     */
    static async triggerUserNotifications(hiveUsername: string): Promise<{
        success: boolean;
        notificationsSent: number;
        message: string;
    }> {
        try {
            const preferences = await SkateHiveFarcasterService.getUserPreferences(hiveUsername);

            if (!preferences) {
                return { success: false, notificationsSent: 0, message: 'User not found' };
            }

            if (!preferences.scheduledNotificationsEnabled) {
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
}
