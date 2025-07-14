import { sql } from '@vercel/postgres';
import { Notifications } from '@hiveio/dhive';
import { serverHiveClient } from '@/lib/hive/server-client';
import { SkateHiveFarcasterService, FarcasterPreferences } from './skatehive-integration';
import { farcasterNotificationService } from './notification-service';
import { getTokenStore } from './token-store-factory';
import { HiveToFarcasterNotification } from '@/types/farcaster';

// Content enrichment cache to prevent duplicate API calls
const enrichmentCache = new Map<string, { content: string | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
const MAX_CACHE_SIZE = 1000; // Maximum cache entries to prevent memory bloat

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
    linkedAt: Date; // When the user linked their Farcaster account
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

        console.log(`[AutomatedNotificationService] 🚀 Starting automated notification processing`);
        console.log(`[AutomatedNotificationService] 📊 Cache stats: ${enrichmentCache.size} cached entries`);

        // Run cleanup once per day (check if we should clean up)
        const shouldCleanup = Math.random() < 0.1; // 10% chance per run
        if (shouldCleanup) {
            console.log(`[AutomatedNotificationService] 🧹 Running periodic cleanup...`);
            try {
                const cleanupResults = await this.cleanupNotificationLogs();
                console.log(`[AutomatedNotificationService] 🧹 Cleanup completed:`, cleanupResults);
            } catch (error) {
                console.error(`[AutomatedNotificationService] ❌ Cleanup failed:`, error);
            }
        }

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
                    t.created_at as linked_at,
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
                maxNotificationsPerBatch: row.max_notifications_per_batch || 5,
                linkedAt: new Date(row.linked_at)
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
            console.log(`[processUserUnreadNotifications] Processing notifications for ${hiveUsername} (linked at: ${user.linkedAt.toISOString()})`);

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

            // Filter to get only unread notifications (those not in our sent log AND after user linked account)
            const unreadNotifications = await this.getUnreadNotifications(hiveUsername, allNotifications, user.linkedAt);

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
     * Also filters out notifications that occurred before the user linked their Farcaster account
     */
    private static async getUnreadNotifications(hiveUsername: string, allNotifications: any[], linkedAt: Date): Promise<any[]> {
        try {
            console.log(`[getUnreadNotifications] Filtering notifications for ${hiveUsername}, linked at: ${linkedAt.toISOString()}`);

            // First, filter out notifications that occurred before the user linked their account
            const notificationsAfterLinking = allNotifications.filter(notification => {
                const notificationTimestamp = new Date(notification.timestamp || 0);
                const isAfterLinking = notificationTimestamp >= linkedAt;

                if (!isAfterLinking) {
                    console.log(`[getUnreadNotifications] Skipping historical notification from ${notificationTimestamp.toISOString()} (before linking at ${linkedAt.toISOString()})`);
                }

                return isAfterLinking;
            });

            console.log(`[getUnreadNotifications] Filtered ${allNotifications.length} total notifications down to ${notificationsAfterLinking.length} after account linking date`);

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

            for (const notification of notificationsAfterLinking) {
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
            // Return notifications after linking date if we can't check the log
            const notificationsAfterLinking = allNotifications.filter(notification => {
                const notificationTimestamp = new Date(notification.timestamp || 0);
                return notificationTimestamp >= linkedAt;
            });
            console.log(`[getUnreadNotifications] Treating ${notificationsAfterLinking.length} notifications after linking as unread due to error`);
            return notificationsAfterLinking;
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
     * Only enriches notifications that are about to be sent to reduce API calls
     */
    private static async convertToFarcasterNotifications(notifications: any[]): Promise<HiveToFarcasterNotification[]> {
        console.log(`[convertToFarcasterNotifications] Converting ${notifications.length} notifications`);

        // Clean up old cache entries before processing
        this.cleanupEnrichmentCache();

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

        console.log(`[convertToFarcasterNotifications] Successfully converted ${farcasterNotifications.length}/${notifications.length} notifications`);
        return farcasterNotifications;
    }

    /**
     * Convert a single Hive notification to Farcaster format with rich content
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
                    // Only enrich votes occasionally to reduce API calls
                    if (author && permlink && Math.random() < 0.2) { // 20% chance for votes
                        const enrichedContent = await this.enrichNotificationContent(author, permlink, 'vote');
                        body = enrichedContent || notification.msg || `@${author} voted on your post`;
                        sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                    } else {
                        body = notification.msg || `@${author} voted on your content`;
                        if (author && permlink) {
                            sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                        }
                    }
                    break;

                case 'reply':
                case 'comment':
                case 'reply_comment':
                    title = '💬 New Comment';
                    // Always enrich comments as they are high-value notifications
                    if (author && permlink) {
                        const enrichedContent = await this.enrichNotificationContent(author, permlink, 'comment');
                        body = enrichedContent || notification.msg || `@${author} commented on your post`;
                        sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                    } else {
                        body = notification.msg || 'Someone commented on your post';
                    }
                    break;

                case 'mention':
                    title = '📢 You were mentioned';
                    // Always enrich mentions as they are high-value notifications
                    if (author && permlink) {
                        const enrichedContent = await this.enrichNotificationContent(author, permlink, 'mention');
                        body = enrichedContent || notification.msg || `@${author} mentioned you`;
                        sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                    } else {
                        body = notification.msg || 'You were mentioned in a post';
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
                    // Enrich reblogs selectively (50% chance)
                    if (author && permlink && Math.random() < 0.5) {
                        const enrichedContent = await this.enrichNotificationContent(author, permlink, 'reblog');
                        body = enrichedContent || notification.msg || `@${author} reblogged your post`;
                        sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                    } else {
                        body = notification.msg || `@${author} reblogged your content`;
                        if (author && permlink) {
                            sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                        }
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

    /**
     * Enrich notification content with actual post/comment data
     * Uses direct Hive API calls for speed and reliability
     * Includes caching to prevent duplicate API calls
     */
    private static async enrichNotificationContent(
        author: string,
        permlink: string,
        notificationType: 'vote' | 'comment' | 'mention' | 'reblog'
    ): Promise<string | null> {
        // Create cache key
        const cacheKey = `${author}/${permlink}`;

        // Check cache first
        const cached = enrichmentCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            console.log(`[enrichNotificationContent] Using cached content for ${cacheKey}`);
            return cached.content;
        }

        // Validate that we have meaningful author and permlink
        if (!author || !permlink || author.length < 3 || permlink.length < 3) {
            console.log(`[enrichNotificationContent] Skipping enrichment for invalid author/permlink: ${author}/${permlink}`);
            return null;
        }

        try {
            console.log(`[enrichNotificationContent] Fetching content for ${author}/${permlink} (${notificationType})`);

            // Fetch the actual post/comment content from Hive blockchain
            const content = await serverHiveClient.fetchContent(author, permlink);

            if (!content || !content.body) {
                console.log(`[enrichNotificationContent] No content found for ${author}/${permlink}`);
                // Cache the null result to avoid repeated failures
                enrichmentCache.set(cacheKey, { content: null, timestamp: Date.now() });
                return null;
            }

            // Clean and extract meaningful text from the content
            let enrichedBody = '';
            const cleanText = this.extractCleanText(content.body);

            // Skip enrichment if content is too short or empty
            if (!cleanText || cleanText.trim().length < 10) {
                console.log(`[enrichNotificationContent] Content too short for ${author}/${permlink}, skipping enrichment`);
                enrichmentCache.set(cacheKey, { content: null, timestamp: Date.now() });
                return null;
            }

            switch (notificationType) {
                case 'vote':
                    // For votes, show what was voted on
                    const postTitle = content.title || this.extractFirstLine(cleanText);
                    enrichedBody = `@${author} voted on: "${this.truncateText(postTitle, 60)}"`;
                    break;

                case 'comment':
                    // For comments, show the actual comment text
                    enrichedBody = `@${author}: "${this.truncateText(cleanText, 80)}"`;
                    break;

                case 'mention':
                    // For mentions, show context around the mention
                    const mentionContext = this.extractMentionContext(content.body, cleanText);
                    enrichedBody = `@${author} mentioned you: "${this.truncateText(mentionContext, 70)}"`;
                    break;

                case 'reblog':
                    // For reblogs, show what was reblogged
                    const reblogTitle = content.title || this.extractFirstLine(cleanText);
                    enrichedBody = `@${author} reblogged: "${this.truncateText(reblogTitle, 60)}"`;
                    break;

                default:
                    enrichmentCache.set(cacheKey, { content: null, timestamp: Date.now() });
                    return null;
            }

            console.log(`[enrichNotificationContent] ✅ Enriched content: ${enrichedBody}`);

            // Cache the successful result
            enrichmentCache.set(cacheKey, { content: enrichedBody, timestamp: Date.now() });
            return enrichedBody;

        } catch (error) {
            console.error(`[enrichNotificationContent] ❌ Error enriching content for ${author}/${permlink}:`, error);

            // Cache the failure to avoid repeated attempts
            enrichmentCache.set(cacheKey, { content: null, timestamp: Date.now() });

            // Only try OpenGraph fallback for important notification types
            if (notificationType === 'comment' || notificationType === 'mention') {
                try {
                    const fallbackResult = await this.enrichWithOpenGraph(author, permlink, notificationType);
                    if (fallbackResult) {
                        enrichmentCache.set(cacheKey, { content: fallbackResult, timestamp: Date.now() });
                        return fallbackResult;
                    }
                } catch (fallbackError) {
                    console.error(`[enrichNotificationContent] ❌ OpenGraph fallback also failed:`, fallbackError);
                }
            }

            return null;
        }
    }

    /**
     * Fallback: Enrich content using OpenGraph metadata from URL
     */
    private static async enrichWithOpenGraph(
        author: string,
        permlink: string,
        notificationType: string
    ): Promise<string | null> {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skatehive.app';
            const postUrl = `${baseUrl}/post/${author}/${permlink}`;

            console.log(`[enrichWithOpenGraph] Fetching OpenGraph for: ${postUrl}`);

            const response = await fetch(postUrl, {
                headers: {
                    'User-Agent': 'SkateHive-Notification-Bot/1.0'
                },
                // Add timeout to prevent hanging
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();

            // Extract OpenGraph title and description
            const ogTitle = this.extractOGTag(html, 'og:title');
            const ogDescription = this.extractOGTag(html, 'og:description');

            if (ogTitle) {
                return `@${author}: "${this.truncateText(ogTitle, 70)}"`;
            } else if (ogDescription) {
                return `@${author}: "${this.truncateText(ogDescription, 80)}"`;
            }

            return null;

        } catch (error) {
            console.error(`[enrichWithOpenGraph] Failed to fetch OpenGraph for ${author}/${permlink}:`, error);
            return null;
        }
    }

    /**
     * Extract clean text from markdown/HTML content
     */
    private static extractCleanText(body: string): string {
        return body
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image markdown
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes  
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
            .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
            .replace(/\n\s*\n/g, ' ') // Remove extra line breaks
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Extract first meaningful line from text
     */
    private static extractFirstLine(text: string): string {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        return lines[0] || text.substring(0, 50);
    }

    /**
     * Extract context around a mention in text
     */
    private static extractMentionContext(originalBody: string, cleanText: string): string {
        // Try to find the sentence containing the mention
        const sentences = cleanText.split(/[.!?]+/);
        const mentionSentence = sentences.find(sentence =>
            sentence.includes('@') && sentence.trim().length > 10
        );

        return mentionSentence?.trim() || cleanText.substring(0, 100);
    }

    /**
     * Truncate text to specified length with ellipsis
     */
    private static truncateText(text: string, maxLength: number): string {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3).trim() + '...';
    }

    /**
     * Extract OpenGraph tag content from HTML
     */
    private static extractOGTag(html: string, property: string): string | null {
        const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*?)["']`, 'i');
        const match = html.match(regex);
        return match ? match[1] : null;
    }    /**
     * Clean up old entries from the enrichment cache
     * Also enforces maximum cache size to prevent memory bloat
     */
    private static cleanupEnrichmentCache(): void {
        const now = Date.now();
        let cleanedCount = 0;

        // First pass: Remove expired entries
        for (const [key, value] of enrichmentCache.entries()) {
            if (now - value.timestamp > CACHE_TTL) {
                enrichmentCache.delete(key);
                cleanedCount++;
            }
        }

        // Second pass: If still over size limit, remove oldest entries
        if (enrichmentCache.size > MAX_CACHE_SIZE) {
            const entries = Array.from(enrichmentCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp); // Sort by timestamp, oldest first

            const entriesToRemove = enrichmentCache.size - MAX_CACHE_SIZE;
            for (let i = 0; i < entriesToRemove; i++) {
                enrichmentCache.delete(entries[i][0]);
                cleanedCount++;
            }

            console.log(`[cleanupEnrichmentCache] Removed ${entriesToRemove} entries due to size limit`);
        }

        if (cleanedCount > 0) {
            console.log(`[cleanupEnrichmentCache] Cleaned up ${cleanedCount} cache entries, ${enrichmentCache.size} remaining`);
        }
    }

    /**
     * Clean up old notification logs to prevent database bloat
     * Should be called periodically (e.g., daily)
     */
    static async cleanupNotificationLogs(): Promise<{
        deduplicationLogsDeleted: number;
        analyticsLogsDeleted: number;
        errors: string[];
    }> {
        const results = {
            deduplicationLogsDeleted: 0,
            analyticsLogsDeleted: 0,
            errors: [] as string[]
        };

        try {
            const databaseUrl = getDatabaseUrl();
            if (!databaseUrl) {
                throw new Error('Database URL not configured');
            }

            console.log('[cleanupNotificationLogs] Starting database cleanup...');

            // Clean up old notification logs but preserve recent ones for deduplication
            // Only delete logs older than 30 days to maintain deduplication integrity
            // Recent logs (last 30 days) are kept to prevent duplicate notifications
            try {
                const cleanupResult = await sql`
                    DELETE FROM farcaster_notification_logs 
                    WHERE sent_at < NOW() - INTERVAL '30 days'
                `;
                results.deduplicationLogsDeleted = cleanupResult.rowCount || 0;
                results.analyticsLogsDeleted = results.deduplicationLogsDeleted; // Same table
                console.log(`[cleanupNotificationLogs] Deleted ${results.deduplicationLogsDeleted} notification logs older than 30 days (preserved recent logs for deduplication)`);
            } catch (error) {
                const errorMsg = `Failed to clean notification logs: ${error instanceof Error ? error.message : 'Unknown error'}`;
                console.error(`[cleanupNotificationLogs] ${errorMsg}`);
                results.errors.push(errorMsg);
            }

            // Vacuum tables if we deleted a significant number of rows
            if (results.deduplicationLogsDeleted > 1000 || results.analyticsLogsDeleted > 1000) {
                try {
                    console.log('[cleanupNotificationLogs] Running VACUUM ANALYZE...');
                    await sql`VACUUM ANALYZE farcaster_notification_log`;
                    await sql`VACUUM ANALYZE farcaster_notification_logs`;
                    console.log('[cleanupNotificationLogs] VACUUM completed');
                } catch (error) {
                    const errorMsg = `Failed to vacuum tables: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    console.error(`[cleanupNotificationLogs] ${errorMsg}`);
                    results.errors.push(errorMsg);
                }
            }

            console.log('[cleanupNotificationLogs] Database cleanup completed');

        } catch (error) {
            const errorMsg = `Failed to cleanup notification logs: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[cleanupNotificationLogs] ${errorMsg}`);
            results.errors.push(errorMsg);
        }

        return results;
    }

    /**
     * Get database statistics for monitoring
     */
    static async getDatabaseStats(): Promise<{
        notificationLogSize: string;
        analyticsLogSize: string;
        notificationLogCount: number;
        analyticsLogCount: number;
        oldestDeduplicationLog: Date | null;
        oldestAnalyticsLog: Date | null;
    }> {
        try {
            const databaseUrl = getDatabaseUrl();
            if (!databaseUrl) {
                throw new Error('Database URL not configured');
            }

            // Get table sizes
            const tableSizes = await sql`
                SELECT 
                    tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
                FROM pg_tables 
                WHERE tablename = 'farcaster_notification_logs'
            `;

            // Get row counts and oldest entries
            const logStats = await sql`
                SELECT 
                    COUNT(*) as notification_log_count,
                    MIN(sent_at) as oldest_notification_log
                FROM farcaster_notification_logs
            `;

            const notificationLogSize = tableSizes.rows.find((t: any) => t.tablename === 'farcaster_notification_logs')?.size || 'Unknown';
            const analyticsLogSize = notificationLogSize; // Same table serves both purposes

            const statsRow = logStats.rows[0];

            return {
                notificationLogSize,
                analyticsLogSize,
                notificationLogCount: parseInt(statsRow?.notification_log_count) || 0,
                analyticsLogCount: parseInt(statsRow?.notification_log_count) || 0, // Same table
                oldestDeduplicationLog: statsRow?.oldest_notification_log || null,
                oldestAnalyticsLog: statsRow?.oldest_notification_log || null, // Same table
            };

        } catch (error) {
            console.error('[getDatabaseStats] Error getting database stats:', error);
            return {
                notificationLogSize: 'Error',
                analyticsLogSize: 'Error',
                notificationLogCount: 0,
                analyticsLogCount: 0,
                oldestDeduplicationLog: null,
                oldestAnalyticsLog: null
            };
        }
    }
}
