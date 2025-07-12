import { FarcasterUserToken, FarcasterWebhookPayload, FarcasterSignature } from '@/types/farcaster';

// In-memory storage for Farcaster notification tokens
// In production, this should be stored in a database
class FarcasterTokenStore {
    private tokens = new Map<string, FarcasterUserToken>();

    // Add or update a user's notification token
    addToken(fid: string, username: string, token: string, notificationUrl: string, hiveUsername?: string): void {
        const userToken: FarcasterUserToken = {
            fid,
            username,
            hiveUsername,
            token,
            notificationUrl,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.tokens.set(fid, userToken);
        console.log(`Added/Updated Farcaster token for FID ${fid}, username: ${username}`);
    }

    // Remove a user's token
    removeToken(fid: string): void {
        this.tokens.delete(fid);
        console.log(`Removed Farcaster token for FID ${fid}`);
    }

    // Disable notifications for a user
    disableNotifications(fid: string): void {
        const userToken = this.tokens.get(fid);
        if (userToken) {
            userToken.isActive = false;
            userToken.updatedAt = new Date();
            this.tokens.set(fid, userToken);
            console.log(`Disabled notifications for FID ${fid}`);
        }
    }

    // Enable notifications for a user
    enableNotifications(fid: string, token: string, notificationUrl: string): void {
        const userToken = this.tokens.get(fid);
        if (userToken) {
            userToken.isActive = true;
            userToken.token = token;
            userToken.notificationUrl = notificationUrl;
            userToken.updatedAt = new Date();
            this.tokens.set(fid, userToken);
            console.log(`Enabled notifications for FID ${fid}`);
        }
    }

    // Get all active tokens
    getActiveTokens(): FarcasterUserToken[] {
        return Array.from(this.tokens.values()).filter(token => token.isActive);
    }

    // Get tokens for specific Hive usernames
    getTokensForHiveUsers(hiveUsernames: string[]): FarcasterUserToken[] {
        return this.getActiveTokens().filter(token =>
            token.hiveUsername && hiveUsernames.includes(token.hiveUsername)
        );
    }

    // Get token by FID
    getTokenByFid(fid: string): FarcasterUserToken | undefined {
        return this.tokens.get(fid);
    }

    // Get all tokens (for debugging)
    getAllTokens(): FarcasterUserToken[] {
        return Array.from(this.tokens.values());
    }
}

// Singleton instance
export const farcasterTokenStore = new FarcasterTokenStore();

// Helper function to decode base64url
function base64urlDecode(str: string): string {
    // Add padding if needed
    const padding = '='.repeat((4 - str.length % 4) % 4);
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
    return Buffer.from(base64, 'base64').toString();
}

// Helper function to verify Farcaster signature (simplified)
export function verifyFarcasterSignature(signature: FarcasterSignature): boolean {
    try {
        const header = JSON.parse(base64urlDecode(signature.header));
        const payload = JSON.parse(base64urlDecode(signature.payload));

        // Basic validation - in production you'd verify the actual signature
        return header && payload && signature.signature;
    } catch (error) {
        console.error('Failed to verify Farcaster signature:', error);
        return false;
    }
}

// Process webhook events from Farcaster
export function processFarcasterWebhook(signedPayload: FarcasterSignature): boolean {
    try {
        if (!verifyFarcasterSignature(signedPayload)) {
            console.error('Invalid Farcaster signature');
            return false;
        }

        const header = JSON.parse(base64urlDecode(signedPayload.header));
        const payload = JSON.parse(base64urlDecode(signedPayload.payload)) as FarcasterWebhookPayload;

        const fid = header.fid?.toString();
        if (!fid) {
            console.error('No FID found in webhook header');
            return false;
        }

        switch (payload.event) {
            case 'miniapp_added':
                if (payload.notificationDetails) {
                    // Extract username from header if available
                    const username = header.username || `user_${fid}`;
                    farcasterTokenStore.addToken(
                        fid,
                        username,
                        payload.notificationDetails.token,
                        payload.notificationDetails.url
                    );
                }
                break;

            case 'miniapp_removed':
                farcasterTokenStore.removeToken(fid);
                break;

            case 'notifications_enabled':
                farcasterTokenStore.enableNotifications(
                    fid,
                    payload.notificationDetails.token,
                    payload.notificationDetails.url
                );
                break;

            case 'notifications_disabled':
                farcasterTokenStore.disableNotifications(fid);
                break;

            default:
                console.warn('Unknown Farcaster webhook event:', payload);
                return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to process Farcaster webhook:', error);
        return false;
    }
}

// Link a Hive username to a Farcaster FID
export function linkHiveToFarcaster(fid: string, hiveUsername: string): boolean {
    const userToken = farcasterTokenStore.getTokenByFid(fid);
    if (userToken) {
        userToken.hiveUsername = hiveUsername;
        userToken.updatedAt = new Date();
        farcasterTokenStore.addToken(
            userToken.fid,
            userToken.username,
            userToken.token,
            userToken.notificationUrl,
            hiveUsername
        );
        console.log(`Linked Hive user ${hiveUsername} to Farcaster FID ${fid}`);
        return true;
    }
    return false;
}
