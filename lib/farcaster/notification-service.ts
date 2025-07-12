import {
    FarcasterNotificationRequest,
    FarcasterNotificationResponse,
    HiveToFarcasterNotification,
    FarcasterUserToken
} from '@/types/farcaster';
import { getTokenStore } from '@/lib/farcaster/token-store-factory';
import { Notifications } from '@hiveio/dhive';

class FarcasterNotificationService {
    private readonly maxRetries = 3;
    private readonly retryDelay = 1000; // 1 second

    // Send notification to Farcaster users
    async sendNotification(
        notification: HiveToFarcasterNotification,
        targetUsers?: string[] // Hive usernames
    ): Promise<{ success: boolean; results: FarcasterNotificationResponse[] }> {
        try {
            // Get tokens for target users or all active users
            const tokenStore = getTokenStore();
            const userTokens = targetUsers
                ? await tokenStore.getTokensForHiveUsers(targetUsers)
                : await tokenStore.getActiveTokens();

            if (userTokens.length === 0) {
                console.log('No Farcaster users found for notification');
                return { success: true, results: [] };
            }

            // Group tokens by notification URL (different Farcaster clients)
            const tokensByUrl = this.groupTokensByUrl(userTokens);

            const results: FarcasterNotificationResponse[] = [];

            // Send notifications to each Farcaster client
            for (const [notificationUrl, tokens] of tokensByUrl.entries()) {
                const result = await this.sendToFarcasterClient(
                    notification,
                    tokens,
                    notificationUrl
                );
                results.push(result);
            }

            return { success: true, results };
        } catch (error) {
            console.error('Failed to send Farcaster notification:', error);
            return { success: false, results: [] };
        }
    }

    // Convert Hive notification to Farcaster format
    private convertHiveToFarcasterNotification(
        hiveNotification: Notifications,
        baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://skatehive.app'
    ): HiveToFarcasterNotification {
        const type = hiveNotification.type;
        let title = 'SkateHive';
        let body = hiveNotification.msg || 'New activity';
        let sourceUrl = hiveNotification.url || baseUrl;

        // Parse additional info from the URL if available
        const urlParts = hiveNotification.url ? hiveNotification.url.split('/') : [];
        const author = urlParts.length > 1 ? urlParts[urlParts.length - 2] : '';
        const permlink = urlParts.length > 0 ? urlParts[urlParts.length - 1] : '';

        switch (type) {
            case 'vote':
                title = '👍 New Vote';
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
                title = 'SkateHive';
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
            hiveUsername: '', // We'll need to determine this from context
            sourceUrl,
            metadata: {
                author,
                permlink,
            }
        };
    }

    // Send notifications for multiple Hive notifications
    async sendHiveNotifications(
        hiveNotifications: Notifications[],
        targetUsers?: string[]
    ): Promise<{ success: boolean; results: FarcasterNotificationResponse[] }> {
        const results: FarcasterNotificationResponse[] = [];

        for (const hiveNotification of hiveNotifications) {
            const farcasterNotification = this.convertHiveToFarcasterNotification(hiveNotification);
            const result = await this.sendNotification(farcasterNotification, targetUsers);
            results.push(...result.results);
        }

        return { success: true, results };
    }

    // Group tokens by notification URL
    private groupTokensByUrl(userTokens: FarcasterUserToken[]): Map<string, string[]> {
        const tokensByUrl = new Map<string, string[]>();

        for (const userToken of userTokens) {
            const tokens = tokensByUrl.get(userToken.notificationUrl) || [];
            tokens.push(userToken.token);
            tokensByUrl.set(userToken.notificationUrl, tokens);
        }

        return tokensByUrl;
    }

    // Send notification to a specific Farcaster client
    private async sendToFarcasterClient(
        notification: HiveToFarcasterNotification,
        tokens: string[],
        notificationUrl: string
    ): Promise<FarcasterNotificationResponse> {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skatehive.app';

        const request: FarcasterNotificationRequest = {
            notificationId: this.generateNotificationId(notification),
            title: notification.title,
            body: notification.body,
            targetUrl: notification.sourceUrl || baseUrl,
            tokens: tokens.slice(0, 100), // Max 100 tokens per request
        };

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(notificationUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(request),
                });

                if (response.ok) {
                    const result: FarcasterNotificationResponse = await response.json();

                    // Remove invalid tokens from our store
                    await this.handleInvalidTokens(result.invalidTokens);

                    return result;
                } else {
                    lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                lastError = error as Error;
                console.error(`Attempt ${attempt} failed:`, error);
            }

            // Wait before retrying
            if (attempt < this.maxRetries) {
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }

        console.error('All retry attempts failed:', lastError);

        // Return failure response
        return {
            successfulTokens: [],
            invalidTokens: [],
            rateLimitedTokens: tokens,
        };
    }

    // Generate unique notification ID
    private generateNotificationId(notification: HiveToFarcasterNotification): string {
        const timestamp = Date.now();
        const hash = Buffer.from(`${notification.type}-${notification.hiveUsername}-${timestamp}`)
            .toString('base64')
            .replace(/[+/=]/g, '')
            .substring(0, 32);
        return `skatehive-${hash}`;
    }

    // Handle invalid tokens by removing them from store
    private async handleInvalidTokens(invalidTokens: string[]): Promise<void> {
        if (invalidTokens.length === 0) return;

        const tokenStore = getTokenStore();
        const allTokens = await tokenStore.getAllTokens();

        for (const invalidToken of invalidTokens) {
            const userToken = allTokens.find((token: FarcasterUserToken) => token.token === invalidToken);
            if (userToken) {
                await tokenStore.removeToken(userToken.fid);
                console.log(`Removed invalid token for FID ${userToken.fid}`);
            }
        }
    }
}

// Singleton instance
export const farcasterNotificationService = new FarcasterNotificationService();
