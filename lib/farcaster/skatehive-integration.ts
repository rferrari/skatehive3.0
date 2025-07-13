import { sql } from '@vercel/postgres';

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

export interface FarcasterPreferences {
    hiveUsername: string;
    fid?: string;
    farcasterUsername?: string;
    notificationsEnabled: boolean;
    notifyVotes: boolean;
    notifyComments: boolean;
    notifyFollows: boolean;
    notifyMentions: boolean;
    notifyPosts: boolean;
    notificationFrequency: 'instant' | 'hourly' | 'daily';
    // Scheduled notification preferences
    scheduledNotificationsEnabled: boolean;
    scheduledTimeHour: number; // 0-23
    scheduledTimeMinute: number; // 0-59
    timezone: string;
    maxNotificationsPerBatch: number; // 1-20
    lastScheduledCheck?: Date;
    lastScheduledNotificationId: number;
    // Existing fields
    linkedAt: Date;
    lastNotificationAt?: Date;
    hiveProfileUpdated: boolean;
}

export interface HiveProfileExtension {
    farcasterFid?: string;
    farcasterUsername?: string;
    farcasterNotifications?: boolean;
}

/**
 * Enhanced service for SkateHive Farcaster integration
 * Manages user preferences, Hive profile updates, and notification settings
 */
export class SkateHiveFarcasterService {

    /**
     * Get user's Farcaster preferences from database
     */
    static async getUserPreferences(hiveUsername: string): Promise<FarcasterPreferences | null> {
        try {
            const result = await sql`
                SELECT 
                    hive_username,
                    fid,
                    farcaster_username,
                    notifications_enabled,
                    notify_votes,
                    notify_comments,
                    notify_follows,
                    notify_mentions,
                    notify_posts,
                    notification_frequency,
                    scheduled_notifications_enabled,
                    scheduled_time_hour,
                    scheduled_time_minute,
                    timezone,
                    max_notifications_per_batch,
                    last_scheduled_check,
                    last_scheduled_notification_id,
                    linked_at,
                    last_notification_at,
                    hive_profile_updated
                FROM skatehive_farcaster_preferences 
                WHERE hive_username = ${hiveUsername}
                LIMIT 1
            `;

            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return {
                hiveUsername: row.hive_username,
                fid: row.fid,
                farcasterUsername: row.farcaster_username,
                notificationsEnabled: row.notifications_enabled,
                notifyVotes: row.notify_votes,
                notifyComments: row.notify_comments,
                notifyFollows: row.notify_follows,
                notifyMentions: row.notify_mentions,
                notifyPosts: row.notify_posts,
                notificationFrequency: row.notification_frequency as 'instant' | 'hourly' | 'daily',
                scheduledNotificationsEnabled: row.scheduled_notifications_enabled || false,
                scheduledTimeHour: row.scheduled_time_hour || 9,
                scheduledTimeMinute: row.scheduled_time_minute || 0,
                timezone: row.timezone || 'UTC',
                maxNotificationsPerBatch: row.max_notifications_per_batch || 5,
                lastScheduledCheck: row.last_scheduled_check ? new Date(row.last_scheduled_check) : undefined,
                lastScheduledNotificationId: row.last_scheduled_notification_id || 0,
                linkedAt: new Date(row.linked_at),
                lastNotificationAt: row.last_notification_at ? new Date(row.last_notification_at) : undefined,
                hiveProfileUpdated: row.hive_profile_updated
            };
        } catch (error) {
            console.error('Failed to get user preferences:', error);
            return null;
        }
    }

    /**
     * Link Farcaster account to Hive user with preferences
     */
    static async linkFarcasterAccount(
        hiveUsername: string,
        fid: string,
        farcasterUsername: string,
        preferences?: Partial<FarcasterPreferences>
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Check if Farcaster token exists
            const tokenCheck = await sql`
                SELECT fid, username, token, notification_url 
                FROM farcaster_tokens 
                WHERE fid = ${fid}
                LIMIT 1
            `;

            if (tokenCheck.rows.length === 0) {
                return {
                    success: false,
                    message: 'Farcaster account not found. Please add SkateHive miniapp first.'
                };
            }

            // Update farcaster_tokens with hive username
            await sql`
                UPDATE farcaster_tokens 
                SET hive_username = ${hiveUsername}, updated_at = NOW()
                WHERE fid = ${fid}
            `;


            // Default scheduled notification preferences
            const defaultScheduledNotificationsEnabled = preferences?.scheduledNotificationsEnabled ?? true;
            const defaultScheduledTimeHour = preferences?.scheduledTimeHour ?? 7; // 4:20 GMT-3 = 7:20 UTC
            const defaultScheduledTimeMinute = preferences?.scheduledTimeMinute ?? 20;
            const defaultTimezone = preferences?.timezone ?? 'GMT-3';
            const defaultMaxNotificationsPerBatch = preferences?.maxNotificationsPerBatch ?? 5;

            // Insert or update preferences
            await sql`
            INSERT INTO skatehive_farcaster_preferences (
                hive_username,
                fid,
                farcaster_username,
                notifications_enabled,
                notify_votes,
                notify_comments,
                notify_follows,
                notify_mentions,
                notify_posts,
                notification_frequency,
                scheduled_notifications_enabled,
                scheduled_time_hour,
                scheduled_time_minute,
                timezone,
                max_notifications_per_batch
            ) VALUES (
                ${hiveUsername},
                ${fid},
                ${farcasterUsername},
                ${preferences?.notificationsEnabled ?? true},
                ${preferences?.notifyVotes ?? true},
                ${preferences?.notifyComments ?? true},
                ${preferences?.notifyFollows ?? true},
                ${preferences?.notifyMentions ?? true},
                ${preferences?.notifyPosts ?? false},
                ${preferences?.notificationFrequency ?? 'instant'},
                ${defaultScheduledNotificationsEnabled},
                ${defaultScheduledTimeHour},
                ${defaultScheduledTimeMinute},
                ${defaultTimezone},
                ${defaultMaxNotificationsPerBatch}
            )
            ON CONFLICT (hive_username) 
            DO UPDATE SET 
                fid = EXCLUDED.fid,
                farcaster_username = EXCLUDED.farcaster_username,
                notifications_enabled = EXCLUDED.notifications_enabled,
                notify_votes = EXCLUDED.notify_votes,
                notify_comments = EXCLUDED.notify_comments,
                notify_follows = EXCLUDED.notify_follows,
                notify_mentions = EXCLUDED.notify_mentions,
                notify_posts = EXCLUDED.notify_posts,
                notification_frequency = EXCLUDED.notification_frequency,
                scheduled_notifications_enabled = EXCLUDED.scheduled_notifications_enabled,
                scheduled_time_hour = EXCLUDED.scheduled_time_hour,
                scheduled_time_minute = EXCLUDED.scheduled_time_minute,
                timezone = EXCLUDED.timezone,
                max_notifications_per_batch = EXCLUDED.max_notifications_per_batch,
                linked_at = NOW()
        `;

            return {
                success: true,
                message: `Successfully linked @${farcasterUsername} to Hive user @${hiveUsername}`
            };

        } catch (error) {
            console.error('Failed to link Farcaster account:', error);
            return {
                success: false,
                message: 'Failed to link accounts. Please try again.'
            };
        }
    }

    /**
     * Update user's notification preferences
     */
    static async updatePreferences(
        hiveUsername: string,
        preferences: Partial<FarcasterPreferences>
    ): Promise<{ success: boolean; message: string }> {
        try {
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (preferences.notificationsEnabled !== undefined) {
                updates.push(`notifications_enabled = $${paramIndex++}`);
                values.push(preferences.notificationsEnabled);
            }
            if (preferences.notifyVotes !== undefined) {
                updates.push(`notify_votes = $${paramIndex++}`);
                values.push(preferences.notifyVotes);
            }
            if (preferences.notifyComments !== undefined) {
                updates.push(`notify_comments = $${paramIndex++}`);
                values.push(preferences.notifyComments);
            }
            if (preferences.notifyFollows !== undefined) {
                updates.push(`notify_follows = $${paramIndex++}`);
                values.push(preferences.notifyFollows);
            }
            if (preferences.notifyMentions !== undefined) {
                updates.push(`notify_mentions = $${paramIndex++}`);
                values.push(preferences.notifyMentions);
            }
            if (preferences.notifyPosts !== undefined) {
                updates.push(`notify_posts = $${paramIndex++}`);
                values.push(preferences.notifyPosts);
            }
            if (preferences.notificationFrequency !== undefined) {
                updates.push(`notification_frequency = $${paramIndex++}`);
                values.push(preferences.notificationFrequency);
            }

            if (updates.length === 0) {
                return { success: false, message: 'No preferences to update' };
            }

            values.push(hiveUsername);

            await sql.query(
                `UPDATE skatehive_farcaster_preferences 
                 SET ${updates.join(', ')} 
                 WHERE hive_username = $${paramIndex}`,
                values
            );

            return {
                success: true,
                message: 'Preferences updated successfully'
            };

        } catch (error) {
            console.error('Failed to update preferences:', error);
            return {
                success: false,
                message: 'Failed to update preferences'
            };
        }
    }

    /**
     * Check if user should receive a specific type of notification
     */
    static async shouldNotify(
        hiveUsername: string,
        notificationType: 'votes' | 'comments' | 'follows' | 'mentions' | 'posts'
    ): Promise<boolean> {
        try {
            const preferences = await this.getUserPreferences(hiveUsername);
            if (!preferences || !preferences.notificationsEnabled) return false;

            switch (notificationType) {
                case 'votes': return preferences.notifyVotes;
                case 'comments': return preferences.notifyComments;
                case 'follows': return preferences.notifyFollows;
                case 'mentions': return preferences.notifyMentions;
                case 'posts': return preferences.notifyPosts;
                default: return false;
            }
        } catch (error) {
            console.error('Failed to check notification preference:', error);
            return false;
        }
    }

    /**
     * Log notification attempt for analytics
     */
    static async logNotification(
        hiveUsername: string,
        notificationType: string,
        title: string,
        body: string,
        success: boolean,
        errorMessage?: string,
        targetUrl?: string
    ): Promise<void> {
        try {
            const preferences = await this.getUserPreferences(hiveUsername);

            await sql`
                INSERT INTO farcaster_notification_logs (
                    hive_username,
                    fid,
                    notification_type,
                    title,
                    body,
                    target_url,
                    success,
                    error_message
                ) VALUES (
                    ${hiveUsername},
                    ${preferences?.fid || null},
                    ${notificationType},
                    ${title},
                    ${body},
                    ${targetUrl || null},
                    ${success},
                    ${errorMessage || null}
                )
            `;

            if (success) {
                await sql`
                    UPDATE skatehive_farcaster_preferences 
                    SET last_notification_at = NOW()
                    WHERE hive_username = ${hiveUsername}
                `;
            }
        } catch (error) {
            console.error('Failed to log notification:', error);
        }
    }

    /**
     * Get users who should receive notifications for specific usernames
     */
    static async getUsersForNotification(
        targetHiveUsernames: string[],
        notificationType: 'votes' | 'comments' | 'follows' | 'mentions' | 'posts'
    ): Promise<{ fid: string; hiveUsername: string; farcasterUsername: string }[]> {
        try {
            const typeColumn = `notify_${notificationType}`;

            const result = await sql.query(`
                SELECT p.fid, p.hive_username, p.farcaster_username
                FROM skatehive_farcaster_preferences p
                JOIN farcaster_tokens t ON p.fid = t.fid
                WHERE p.hive_username = ANY($1)
                  AND p.notifications_enabled = true
                  AND p.${typeColumn} = true
                  AND t.is_active = true
            `, [targetHiveUsernames]);

            return result.rows.map(row => ({
                fid: row.fid,
                hiveUsername: row.hive_username,
                farcasterUsername: row.farcaster_username
            }));
        } catch (error) {
            console.error('Failed to get users for notification:', error);
            return [];
        }
    }

    /**
     * Get analytics data for admin/user dashboard
     */
    static async getNotificationStats(hiveUsername?: string): Promise<{
        totalNotifications: number;
        successfulNotifications: number;
        failedNotifications: number;
        notificationsByType: Record<string, number>;
        recentNotifications: any[];
    }> {
        try {
            const whereClause = hiveUsername ? `WHERE hive_username = '${hiveUsername}'` : '';

            const totalResult = await sql.query(`
                SELECT COUNT(*) as total FROM farcaster_notification_logs ${whereClause}
            `);

            const successResult = await sql.query(`
                SELECT COUNT(*) as successful FROM farcaster_notification_logs 
                ${whereClause} ${hiveUsername ? 'AND' : 'WHERE'} success = true
            `);

            const failedResult = await sql.query(`
                SELECT COUNT(*) as failed FROM farcaster_notification_logs 
                ${whereClause} ${hiveUsername ? 'AND' : 'WHERE'} success = false
            `);

            const typeResult = await sql.query(`
                SELECT notification_type, COUNT(*) as count 
                FROM farcaster_notification_logs ${whereClause}
                GROUP BY notification_type
            `);

            const recentResult = await sql.query(`
                SELECT notification_type, title, body, success, sent_at, error_message
                FROM farcaster_notification_logs ${whereClause}
                ORDER BY sent_at DESC 
                LIMIT 10
            `);

            return {
                totalNotifications: parseInt(totalResult.rows[0].total),
                successfulNotifications: parseInt(successResult.rows[0].successful),
                failedNotifications: parseInt(failedResult.rows[0].failed),
                notificationsByType: Object.fromEntries(
                    typeResult.rows.map(row => [row.notification_type, parseInt(row.count)])
                ),
                recentNotifications: recentResult.rows
            };
        } catch (error) {
            console.error('Failed to get notification stats:', error);
            return {
                totalNotifications: 0,
                successfulNotifications: 0,
                failedNotifications: 0,
                notificationsByType: {},
                recentNotifications: []
            };
        }
    }
}
