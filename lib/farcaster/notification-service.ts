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
        baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.skatehive.app'
    ): HiveToFarcasterNotification {
        const type = hiveNotification.type;
        let title = 'SkateHive';
        let body = hiveNotification.msg || 'New activity';
        let sourceUrl = baseUrl;

        // Parse Hive url field: '@author/permlink' or '@author'
        let author = '';
        let permlink = '';
        if (hiveNotification.url) {
            const match = hiveNotification.url.match(/^@([^/]+)(?:\/(.+))?$/);
            if (match) {
                author = match[1];
                permlink = match[2] || '';
            }
        }

        switch (type) {
            case 'vote':
                title = '💰 New Vote';
                body = hiveNotification.msg || `@${author} voted on your post`;
                if (author && permlink) {
                    sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                }
                break;
            case 'reply':
            case 'comment':
                title = '💬 New Reply';
                body = hiveNotification.msg || `@${author} replied to your post`;
                if (author && permlink) {
                    sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                }
                break;
            case 'mention':
                title = '🏷 Mention';
                body = hiveNotification.msg || `@${author} mentioned you`;
                if (author && permlink) {
                    sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                }
                break;
            case 'follow':
                title = '🛹 New Follower';
                body = hiveNotification.msg || `@${author} followed you`;
                if (author) {
                    sourceUrl = `${baseUrl}/user/${author}?view=snaps`;
                }
                break;
            case 'reblog':
                title = '🔄 Reblogged';
                body = hiveNotification.msg || `@${author} reblogged your post`;
                if (author && permlink) {
                    sourceUrl = `${baseUrl}/post/${author}/${permlink}`;
                }
                break;

            // TODO: I think transfer notifications does not exist and it was an AI slop, review this, may be deletable code
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

        // Truncate to Farcaster limits
        title = title.substring(0, 32);
        body = body.substring(0, 128);

        return {
            type: type as any,
            title,
            body,
            hiveUsername: '', // Set if needed
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
            let result;
            // If targetUsers is a FID array, use FID lookup
            if (targetUsers && targetUsers.length === 1 && /^[0-9]+$/.test(targetUsers[0])) {
                const tokenStore = getTokenStore();
                const userToken = await tokenStore.getTokenByFid(targetUsers[0]);
                if (userToken) {
                    // Send directly to this token
                    const tokensByUrl = new Map();
                    tokensByUrl.set(userToken.notificationUrl, [userToken.token]);
                    const singleResults = [];
                    for (const [notificationUrl, tokens] of tokensByUrl.entries()) {
                        const r = await this.sendToFarcasterClient(farcasterNotification, tokens, notificationUrl);
                        singleResults.push(r);
                    }
                    result = { success: true, results: singleResults };
                } else {
                    result = { success: true, results: [] };
                }
            } else {
                result = await this.sendNotification(farcasterNotification, targetUsers);
            }
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
    private async handleInvalidTokens(invalidTokens: string[] | undefined): Promise<void> {
        if (!invalidTokens || invalidTokens.length === 0) return;

        const tokenStore = getTokenStore();
        const allTokens = await tokenStore.getAllTokens();

        for (const invalidToken of invalidTokens) {
            const userToken = allTokens.find((token: FarcasterUserToken) => token.token === invalidToken);
            if (userToken) {
                await tokenStore.removeToken(userToken.fid);
            }
        }
    }
}

// Singleton instance
export const farcasterNotificationService = new FarcasterNotificationService();
