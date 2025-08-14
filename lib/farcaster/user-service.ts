import { getTokenStore } from '@/lib/farcaster/token-store-factory';

/**
 * Service to manage Farcaster FID to Hive username mappings
 * This integrates with your existing user authentication system
 */
export class FarcasterUserService {

    /**
     * Link a Farcaster FID to a Hive username
     * Call this when a user connects their Farcaster account
     */
    static async linkFarcasterToHive(
        fid: string,
        hiveUsername: string,
        farcasterUsername?: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const tokenStore = getTokenStore();

            // Check if user already exists
            const existingToken = await tokenStore.getTokenByFid(fid);

            if (existingToken) {
                // Update existing mapping
                await tokenStore.addToken(
                    fid,
                    farcasterUsername || existingToken.username,
                    existingToken.token,
                    existingToken.notificationUrl,
                    hiveUsername
                );

                return {
                    success: true,
                    message: `Updated Farcaster FID ${fid} to link with Hive user @${hiveUsername}`
                };
            } else {
                return {
                    success: false,
                    message: `Farcaster FID ${fid} not found. User needs to add SkateHive miniapp first.`
                };
            }
        } catch (error) {
            console.error('Failed to link Farcaster to Hive:', error);
            return {
                success: false,
                message: 'Failed to link accounts. Please try again.'
            };
        }
    }

    /**
     * Get Farcaster FIDs for a list of Hive usernames
     * Use this when you want to send notifications to specific Hive users
     */
    static async getFidsForHiveUsers(hiveUsernames: string[]): Promise<{
        fid: string;
        hiveUsername: string;
        farcasterUsername: string;
    }[]> {
        try {
            const tokenStore = getTokenStore();
            const tokens = await tokenStore.getTokensForHiveUsers(hiveUsernames);

            return tokens
                .filter(token => token.hiveUsername)
                .map(token => ({
                    fid: token.fid,
                    hiveUsername: token.hiveUsername!,
                    farcasterUsername: token.username
                }));
        } catch (error) {
            console.error('Failed to get FIDs for Hive users:', error);
            return [];
        }
    }

    /**
     * Get Hive username for a Farcaster FID
     * Use this when processing Farcaster webhooks
     */
    static async getHiveUsernameByFid(fid: string): Promise<string | null> {
        try {
            const tokenStore = getTokenStore();
            const token = await tokenStore.getTokenByFid(fid);
            return token?.hiveUsername || null;
        } catch (error) {
            console.error('Failed to get Hive username by FID:', error);
            return null;
        }
    }

    /**
     * Check if a Hive user has Farcaster notifications enabled
     */
    static async hasNotificationsEnabled(hiveUsername: string): Promise<boolean> {
        try {
            const tokenStore = getTokenStore();
            const tokens = await tokenStore.getTokensForHiveUsers([hiveUsername]);
            return tokens.length > 0 && tokens[0].isActive;
        } catch (error) {
            console.error('Failed to check notification status:', error);
            return false;
        }
    }

    /**
     * Get all linked users for analytics/admin purposes
     */
    static async getAllLinkedUsers(): Promise<{
        fid: string;
        farcasterUsername: string;
        hiveUsername: string;
        isActive: boolean;
        linkedAt: Date;
    }[]> {
        try {
            const tokenStore = getTokenStore();
            const tokens = await tokenStore.getAllTokens();

            return tokens
                .filter(token => token.hiveUsername)
                .map(token => ({
                    fid: token.fid,
                    farcasterUsername: token.username,
                    hiveUsername: token.hiveUsername!,
                    isActive: token.isActive,
                    linkedAt: token.createdAt
                }));
        } catch (error) {
            console.error('Failed to get all linked users:', error);
            return [];
        }
    }
}

/**
 * Integration helpers for your existing SkateHive features
 */
export class SkateHiveNotifications {

    /**
     * Send notification when someone votes on a user's post
     */
    static async notifyPostVote(
        voterHiveUsername: string,
        postAuthorHiveUsername: string,
        postTitle: string,
        voteValue: number
    ) {
        if (voterHiveUsername === postAuthorHiveUsername) return; // Don't notify self

        const hasNotifications = await FarcasterUserService.hasNotificationsEnabled(postAuthorHiveUsername);
        if (!hasNotifications) return;

        const voteType = voteValue > 0 ? 'upvoted' : 'downvoted';
        const emoji = voteValue > 0 ? '🔥' : '👎';

        return fetch('/api/farcaster/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `${emoji} New Vote`,
                body: `@${voterHiveUsername} ${voteType} "${postTitle}"`,
                targetUsers: [postAuthorHiveUsername],
                targetUrl: `https://skatehive.app/post/${postAuthorHiveUsername}/${postTitle}`
            })
        });
    }

    /**
     * Send notification when someone comments on a user's post
     */
    static async notifyNewComment(
        commenterHiveUsername: string,
        postAuthorHiveUsername: string,
        postTitle: string
    ) {
        if (commenterHiveUsername === postAuthorHiveUsername) return; // Don't notify self

        const hasNotifications = await FarcasterUserService.hasNotificationsEnabled(postAuthorHiveUsername);
        if (!hasNotifications) return;

        return fetch('/api/farcaster/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: '💬 New Comment',
                body: `@${commenterHiveUsername} commented on "${postTitle}"`,
                targetUsers: [postAuthorHiveUsername],
                targetUrl: `https://skatehive.app/post/${postAuthorHiveUsername}/${postTitle}`
            })
        });
    }

    /**
     * Send notification when someone follows a user
     */
    static async notifyNewFollower(
        followerHiveUsername: string,
        followedHiveUsername: string
    ) {
        const hasNotifications = await FarcasterUserService.hasNotificationsEnabled(followedHiveUsername);
        if (!hasNotifications) return;

        return fetch('/api/farcaster/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: '👤 New Follower',
                body: `@${followerHiveUsername} started following you`,
                targetUsers: [followedHiveUsername],
                targetUrl: `https://skatehive.app/user/${followerHiveUsername}`
            })
        });
    }

    /**
     * Send notification when someone mentions a user
     */
    static async notifyMention(
        mentionerHiveUsername: string,
        mentionedHiveUsername: string,
        context: string
    ) {
        const hasNotifications = await FarcasterUserService.hasNotificationsEnabled(mentionedHiveUsername);
        if (!hasNotifications) return;

        return fetch('/api/farcaster/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: '🔔 Mention',
                body: `@${mentionerHiveUsername} mentioned you`,
                targetUsers: [mentionedHiveUsername],
                targetUrl: `https://skatehive.app/user/${mentionerHiveUsername}`
            })
        });
    }
}
