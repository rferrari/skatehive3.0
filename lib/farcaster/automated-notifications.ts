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

export interface ActiveUser {
    hiveUsername: string | null;
    fid: string;
    farcasterUsername: string;
    notificationsEnabled: boolean;
    tokenActive: boolean;
    maxNotificationsPerBatch: number;
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
     * Get all users with active Farcaster tokens and notifications enabled
     */
    private static async getActiveUsers(): Promise<ActiveUser[]> {
        try {
            // Get users with active Farcaster tokens and linked Hive accounts
            const result = await sql`
                SELECT 
                    t.hive_username,
                    t.fid,
                    t.username as farcaster_username,
                    t.is_active as notifications_enabled,
                    t.is_active as token_active,
                    COALESCE(p.max_notifications_per_batch, 5) as max_notifications_per_batch
                FROM farcaster_tokens t
                LEFT JOIN skatehive_farcaster_preferences p ON t.fid = p.fid
                WHERE t.is_active = true 
                AND t.hive_username IS NOT NULL
                AND t.hive_username != ''
                ORDER BY t.created_at ASC
            `;

            console.log(`[AutomatedNotificationService] Found ${result.rows.length} active users with linked Hive accounts`);

            return result.rows.map(row => ({
                hiveUsername: row.hive_username,
                fid: row.fid,
                farcasterUsername: row.farcaster_username || '',
                notificationsEnabled: row.notifications_enabled,
                tokenActive: row.token_active,
                maxNotificationsPerBatch: row.max_notifications_per_batch || 5
            }));
        } catch (error) {
            console.error('[AutomatedNotificationService] Error fetching active users:', error);
            return [];
        }
    }

    /**
     * Process unread notifications for a specific user
     * Compares sent notifications with Hive unread notifications and sends new ones
     */
    private static async processUserUnreadNotifications(user: ActiveUser): Promise<number> {
        const { hiveUsername, fid, maxNotificationsPerBatch } = user;

        if (!hiveUsername) {
            console.log(`[AutomatedNotificationService] Skipping user with FID ${fid} - no Hive username`);
            return 0;
        }

        try {
            console.log(`[processUserUnreadNotifications] Processing notifications for ${hiveUsername}`);

            // Get user's Farcaster preferences
            const userPreferences = await SkateHiveFarcasterService.getPreferencesByFid(fid) ||
                await SkateHiveFarcasterService.getUserPreferences(hiveUsername);

            if (!userPreferences) {
                console.log(`[processUserUnreadNotifications] No Farcaster preferences found for ${hiveUsername}, creating defaults...`);

                // Try to create default preferences
                try {
                    await SkateHiveFarcasterService.createDefaultPreferences(fid, user.farcasterUsername || '');

                    // Update hive username in preferences
                    await sql`
                        UPDATE skatehive_farcaster_preferences 
                        SET hive_username = ${hiveUsername}
                        WHERE fid = ${fid}
                    `;
                    console.log(`[processUserUnreadNotifications] Created default preferences for ${hiveUsername}`);
                } catch (createError) {
                    console.error(`[processUserUnreadNotifications] Failed to create preferences for ${hiveUsername}:`, createError);
                    return 0;
                }
            }

            // Get all unread notifications from Hive
            const allNotifications = await serverHiveClient.fetchNotifications(hiveUsername, 100);

            if (!allNotifications || allNotifications.length === 0) {
                console.log(`[processUserUnreadNotifications] No notifications found for ${hiveUsername}`);
                return 0;
            }

            // Filter to get only unread notifications (those not in our sent log)
            const unreadNotifications = await this.getUnreadNotifications(hiveUsername, allNotifications);

            console.log(`[processUserUnreadNotifications] Found ${unreadNotifications.length} unread notifications for ${hiveUsername}`);

            if (unreadNotifications.length === 0) {
                return 0;
            }

            // Sort notifications from oldest to newest (bottom to top approach)
            const sortedNotifications = unreadNotifications.sort((a, b) => {
                const timestampA = new Date(a.timestamp || 0).getTime();
                const timestampB = new Date(b.timestamp || 0).getTime();
                return timestampA - timestampB;
            });

            // Take only up to maxNotificationsPerBatch notifications
            const notificationsToSend = sortedNotifications.slice(0, maxNotificationsPerBatch);

            console.log(`[processUserUnreadNotifications] Will send ${notificationsToSend.length} notifications (max batch: ${maxNotificationsPerBatch})`);

            // Convert to Farcaster format
            const farcasterNotifications = await this.convertToFarcasterNotifications(notificationsToSend);

            console.log(`[processUserUnreadNotifications] Converted ${farcasterNotifications.length} notifications to Farcaster format`);

            if (farcasterNotifications.length === 0) {
                return 0;
            }

            // Send notifications to Farcaster
            let sentCount = 0;

            for (let i = 0; i < farcasterNotifications.length; i++) {
                const notification = farcasterNotifications[i];

                console.log(`[processUserUnreadNotifications] Sending notification ${i + 1}/${farcasterNotifications.length} to ${hiveUsername}: ${notification.title}`);

                try {
                    const result = await farcasterNotificationService.sendNotification(notification, [hiveUsername]);

                    // Check for successful sends - handle the actual API response structure
                    const hasSuccessfulSends = result.success && result.results.some((r: any) => {
                        // Handle both the expected structure and the actual nested structure
                        const actualResult = r.result || r;
                        return actualResult.successfulTokens && actualResult.successfulTokens.length > 0;
                    });

                    if (hasSuccessfulSends) {
                        console.log(`[processUserUnreadNotifications] ✅ Successfully sent notification ${i + 1} to ${hiveUsername}`);
                        sentCount++;

                        // Log the sent notification to prevent duplicates (only log successful sends)
                        await this.logSentNotification(hiveUsername, fid, notificationsToSend[i]);

                        // Rate limiting: wait 500ms between sends
                        if (i < farcasterNotifications.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    } else {
                        console.log(`[processUserUnreadNotifications] ❌ Failed to send notification ${i + 1} to ${hiveUsername}:`, result);

                        // Log failed notification attempt
                        await this.logFailedNotification(hiveUsername, fid, notificationsToSend[i], 'Send failed');
                    }
                } catch (error) {
                    console.error(`[processUserUnreadNotifications] ❌ Error sending notification ${i + 1} to ${hiveUsername}:`, error);

                    // Log error notification attempt
                    await this.logFailedNotification(hiveUsername, fid, notificationsToSend[i], error instanceof Error ? error.message : 'Unknown error');
                }
            }

            console.log(`[processUserUnreadNotifications] Successfully sent ${sentCount}/${farcasterNotifications.length} notifications to ${hiveUsername}`);
            return sentCount;

        } catch (error) {
            console.error(`[processUserUnreadNotifications] Error processing notifications for ${hiveUsername}:`, error);
            return 0;
        }
    }

    /**
     * Get unread notifications by comparing Hive notifications with our sent log
     */
    private static async getUnreadNotifications(hiveUsername: string, allNotifications: any[]): Promise<any[]> {
        try {
            // Get all notifications we've already processed for this user (successful OR failed)
            // Use existing columns to create unique identifiers
            const result = await sql`
                SELECT notification_type, title, body, target_url
                FROM farcaster_notification_logs 
                WHERE hive_username = ${hiveUsername}
                ORDER BY sent_at DESC
                LIMIT 1000
            `;

            // Create a set of processed notification signatures based on existing data
            const processedNotificationSignatures = new Set(result.rows.map(row => {
                // Create a signature from the converted notification data
                return `${row.notification_type}_${row.title}_${row.body}_${row.target_url}`.replace(/[^a-zA-Z0-9_-]/g, '_');
            }));

            // Filter out notifications we've already processed by converting them first and checking signature
            const unreadNotifications: any[] = [];
            
            for (const notification of allNotifications) {
                // Convert to get the signature that would be stored
                const converted = await this.convertHiveToFarcasterNotification(notification);
                if (converted) {
                    const signature = `${converted.type}_${converted.title}_${converted.body}_${converted.sourceUrl}`.replace(/[^a-zA-Z0-9_-]/g, '_');
                    
                    if (!processedNotificationSignatures.has(signature)) {
                        unreadNotifications.push(notification);
                    }
                }
            }

            console.log(`[getUnreadNotifications] Found ${processedNotificationSignatures.size} previously processed notifications, ${unreadNotifications.length} unread for ${hiveUsername}`);

            return unreadNotifications;
        } catch (error) {
            console.error(`[getUnreadNotifications] Error getting unread notifications for ${hiveUsername}:`, error);
            // Return all notifications if we can't check the log - treat all as unread
            console.log(`[getUnreadNotifications] Treating all notifications as unread due to error`);
            return allNotifications;
        }
    }

    /**
     * Log a sent notification to prevent duplicates
     */
    private static async logSentNotification(hiveUsername: string, fid: string, notification: any): Promise<void> {
        try {
            // Convert the Hive notification to the format we send to Farcaster
            const farcasterNotification = await this.convertHiveToFarcasterNotification(notification);

            if (!farcasterNotification) {
                console.log(`[logSentNotification] Could not convert notification for logging`);
                return;
            }

            // Log the notification using the existing database schema
            await sql`
                INSERT INTO farcaster_notification_logs (
                    hive_username,
                    fid,
                    notification_type,
                    title,
                    body,
                    target_url,
                    success,
                    sent_at,
                    token
                ) VALUES (
                    ${hiveUsername},
                    ${fid},
                    ${farcasterNotification.type},
                    ${farcasterNotification.title},
                    ${farcasterNotification.body},
                    ${farcasterNotification.sourceUrl},
                    true,
                    NOW(),
                    null
                )
            `;

            console.log(`[logSentNotification] ✅ Logged notification for ${hiveUsername}: ${farcasterNotification.title}`);
        } catch (error) {
            console.error(`[logSentNotification] Error logging notification for ${hiveUsername}:`, error);
        }
    }

    /**
     * Log a failed notification attempt
     */
    private static async logFailedNotification(hiveUsername: string, fid: string, notification: any, errorMessage: string): Promise<void> {
        try {
            // Convert the Hive notification to the format we would send to Farcaster
            const farcasterNotification = await this.convertHiveToFarcasterNotification(notification);

            if (!farcasterNotification) {
                console.log(`[logFailedNotification] Could not convert notification for logging`);
                return;
            }

            // Log the failed notification attempt using the existing database schema
            await sql`
                INSERT INTO farcaster_notification_logs (
                    hive_username,
                    fid,
                    notification_type,
                    title,
                    body,
                    target_url,
                    success,
                    error_message,
                    sent_at,
                    token
                ) VALUES (
                    ${hiveUsername},
                    ${fid},
                    ${farcasterNotification.type},
                    ${farcasterNotification.title},
                    ${farcasterNotification.body},
                    ${farcasterNotification.sourceUrl},
                    false,
                    ${errorMessage.substring(0, 500)}, -- Truncate error message
                    NOW(),
                    null
                )
            `;

            console.log(`[logFailedNotification] 📝 Logged failed notification for ${hiveUsername}: ${farcasterNotification.title} - ${errorMessage}`);
        } catch (error) {
            console.error(`[logFailedNotification] Error logging failed notification for ${hiveUsername}:`, error);
        }
    }

    /**
     * Generate a unique notification ID from Hive notification data
     * This must be consistent and unique for each Hive notification
     */
    private static getNotificationId(notification: any): string {
        // For Notifications objects, extract identifier parts
        if (notification.type && notification.url) {
            // Parse author/permlink from URL
            let author = '';
            let permlink = '';
            if (notification.url) {
                const match = notification.url.match(/^@([^/]+)(?:\/(.+))?$/);
                if (match) {
                    author = match[1];
                    permlink = match[2] || '';
                }
            }

            // Include timestamp if available for more uniqueness
            const timestamp = notification.timestamp || notification.date || '';
            
            // Create a unique ID that includes type, author, permlink, and timestamp
            return `${notification.type}_${author}_${permlink}_${timestamp}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        }

        // Fallback for other formats - try to use as much unique data as possible
        const id = notification.id || notification.trx_id || notification.block_num || '';
        const type = notification.type || 'unknown';
        const timestamp = notification.timestamp || notification.date || Date.now();

        return `${type}_${id}_${timestamp}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    /**
     * Convert Hive notifications to Farcaster format
     */
    private static async convertToFarcasterNotifications(notifications: any[]): Promise<HiveToFarcasterNotification[]> {
        const farcasterNotifications: HiveToFarcasterNotification[] = [];

        for (const notification of notifications) {
            try {
                const converted = await this.convertHiveToFarcasterNotification(notification);
                if (converted) {
                    farcasterNotifications.push(converted);
                }
            } catch (error) {
                console.error('[convertToFarcasterNotifications] Error converting notification:', error);
            }
        }

        return farcasterNotifications;
    }

    /**
     * Convert a single Hive notification to Farcaster format
     */
    private static async convertHiveToFarcasterNotification(notification: Notifications): Promise<HiveToFarcasterNotification | null> {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skatehive.app';

            console.log('[convertHiveToFarcasterNotification] Converting notification:', {
                type: notification.type,
                url: notification.url,
                baseUrl
            });

            // Extract notification details
            let title = '';
            let body = '';
            let sourceUrl = baseUrl;

            // Parse Hive url field: '@author/permlink' or '@author'
            let author = '';
            let permlink = '';
            if (notification.url) {
                const match = notification.url.match(/^@([^/]+)(?:\/(.+))?$/);
                if (match) {
                    author = match[1];
                    permlink = match[2] || '';
                }
            }

            switch (notification.type) {
                case 'vote':
                    title = '👍 New Vote';
                    // Extract meaningful post identifier from permlink or use message
                    if (notification.msg) {
                        // Use the original message if available (e.g., "@web-gnar voted on your post ($0.24)")
                        body = notification.msg;
                    } else {
                        // Fallback: create descriptive message
                        const postId = permlink ?
                            permlink.replace(/20\d{6}t\d{6}\w+z/, '').replace(/-/g, ' ').substring(0, 30) + '...' :
                            'your post';
                        body = `@${author} voted on "${postId}"`;
                    }
                    if (author && permlink) {
                        sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                    }
                    break;

                case 'reply':
                case 'comment':
                case 'reply_comment':
                    title = '💬 New Comment';
                    if (notification.msg) {
                        body = notification.msg;
                    } else {
                        const commentPostId = permlink ?
                            permlink.replace(/20\d{6}t\d{6}\w+z/, '').replace(/-/g, ' ').substring(0, 30) + '...' :
                            'your post';
                        body = `@${author} commented on "${commentPostId}"`;
                    }
                    if (author && permlink) {
                        sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                    }
                    break;

                case 'mention':
                    title = '📢 You were mentioned';
                    if (notification.msg) {
                        body = notification.msg;
                    } else {
                        const mentionPostId = permlink ?
                            permlink.replace(/20\d{6}t\d{6}\w+z/, '').replace(/-/g, ' ').substring(0, 30) + '...' :
                            'a post';
                        body = `@${author} mentioned you in "${mentionPostId}"`;
                    }
                    if (author && permlink) {
                        sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                    }
                    break;

                case 'follow':
                    title = '👤 New Follower';
                    body = notification.msg || `@${author} started following you`;
                    if (author) {
                        sourceUrl = `${baseUrl}/profile/${author}`;
                    }
                    break;

                case 'reblog':
                    title = '🔄 Post Reblogged';
                    body = notification.msg || `@${author} reblogged your post`;
                    if (author && permlink) {
                        sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                    }
                    break;

                case 'transfer':
                    title = '💰 Transfer Received';
                    body = notification.msg || `Received a transfer`;
                    sourceUrl = `${baseUrl}/wallet`;
                    break;

                default:
                    console.log(`[convertHiveToFarcasterNotification] Unsupported notification type: ${notification.type}`);
                    return null;
            }

            // Generate unique notification ID
            const notificationId = `${notification.type}_${author}_${permlink}_${Date.now()}`.replace(/[^a-zA-Z0-9_-]/g, '_');

            // Validate URL
            try {
                new URL(sourceUrl);
                console.log(`[convertHiveToFarcasterNotification] ✅ Generated valid URL: ${sourceUrl}`);
            } catch (urlError) {
                console.error(`[convertHiveToFarcasterNotification] ❌ Invalid URL generated: ${sourceUrl}`, urlError);
                return null;
            }

            return {
                type: notification.type as 'vote' | 'comment' | 'reply_comment' | 'follow' | 'mention' | 'reblog' | 'transfer',
                title: title.substring(0, 32), // Max 32 chars
                body: body.substring(0, 128),   // Max 128 chars
                hiveUsername: author,
                sourceUrl: sourceUrl.substring(0, 1024), // Max 1024 chars
                metadata: {
                    author,
                    permlink
                }
            };

        } catch (error) {
            console.error('[convertHiveToFarcasterNotification] Error converting notification:', error);
            return null;
        }
    }
}
