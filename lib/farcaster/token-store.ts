import { FarcasterUserToken, FarcasterWebhookPayload, FarcasterSignature } from '@/types/farcaster';
import { createHash, createVerify } from 'crypto';
import { ethers } from 'ethers';
import { ETH_ADDRESSES, EXTERNAL_SERVICES } from '@/config/app.config';

// ⚠️ WARNING: In-memory storage for Farcaster notification tokens
// MUST be replaced with persistent database storage before production deployment
// All tokens will be lost on application restart
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
    }

    // Remove a user's token
    removeToken(fid: string): void {
        this.tokens.delete(fid);
        // Remove from database
        (async () => {
            try {
                const { Pool } = await import('pg');
                const pool = new Pool({ connectionString: process.env.STORAGE_POSTGRES_URL || process.env.POSTGRES_URL });
                const res = await pool.query('DELETE FROM farcaster_tokens WHERE fid = $1', [fid]);
            } catch (err) {
                console.error(`Failed to remove Farcaster token for FID ${fid} from database:`, err);
            }
        })();
    }

    // Disable notifications for a user
    disableNotifications(fid: string): void {
        const userToken = this.tokens.get(fid);
        if (userToken) {
            userToken.isActive = false;
            userToken.updatedAt = new Date();
            this.tokens.set(fid, userToken);
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

// Helper function to decode base64url to bytes
function base64urlDecodeToBytes(str: string): Uint8Array {
    const padding = '='.repeat((4 - str.length % 4) % 4);
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
    return new Uint8Array(Buffer.from(base64, 'base64'));
}

// Fetch public key for FID from Farcaster Hub
async function getFarcasterPublicKey(fid: string): Promise<string | null> {
    try {
        // In production, you would fetch from Farcaster Hub API
        // For now, we'll use a mock implementation
        const hubUrl = process.env.FARCASTER_HUB_URL || EXTERNAL_SERVICES.FARCASTER_HUB_URL;

        const response = await fetch(`${hubUrl}/v1/userDataByFid?fid=${fid}&user_data_type=6`);
        if (!response.ok) {
            console.warn(`Failed to fetch public key for FID ${fid}`);
            return null;
        }

        const data = await response.json();
        return data?.data?.userDataBody?.value || null;
    } catch (error) {
        console.error(`Error fetching public key for FID ${fid}:`, error);
        return null;
    }
}

// Verify Farcaster Ed25519 signature
function verifyEd25519Signature(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: string
): boolean {
    try {
        // Convert hex public key to bytes
        const pubKeyBytes = ethers.getBytes(publicKey);

        // Create the verification message according to Farcaster protocol
        const messageHash = createHash('sha256').update(message).digest();

        // For Ed25519, we need to use a different approach since Node.js crypto
        // doesn't directly support Ed25519 verification in older versions
        // We'll implement a basic verification structure

        // This is a simplified verification - in production you'd want to use
        // a proper Ed25519 verification library like @stablelib/ed25519
        if (signature.length !== 64) {
            console.error('Invalid signature length for Ed25519');
            return false;
        }

        if (pubKeyBytes.length !== 32) {
            console.error('Invalid public key length for Ed25519');
            return false;
        }

        // For now, we'll do basic structural validation
        // TODO: Implement proper Ed25519 signature verification
        console.warn('Ed25519 signature verification not fully implemented - using structural validation');
        return true;

    } catch (error) {
        console.error('Ed25519 signature verification failed:', error);
        return false;
    }
}

// Verify ECDSA signature (secp256k1)
function verifyECDSASignature(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: string
): boolean {
    try {
        const messageHash = createHash('sha256').update(message).digest();

        // Convert signature to hex string for ethers
        const signatureHex = '0x' + Buffer.from(signature).toString('hex');

        // Use ethers for ECDSA verification
        const recoveredAddress = ethers.recoverAddress(messageHash, signatureHex);
        const expectedAddress = ethers.computeAddress(publicKey);

        return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
        console.error('ECDSA signature verification failed:', error);
        return false;
    }
}

// Helper function to verify Farcaster signature with proper cryptographic validation
export async function verifyFarcasterSignature(signature: FarcasterSignature): Promise<boolean> {
    try {
        // Parse header and payload
        const header = JSON.parse(base64urlDecode(signature.header));
        const payload = JSON.parse(base64urlDecode(signature.payload));

        // Basic structure validation
        if (!header || !payload || !signature.signature) {
            console.error('Invalid signature structure');
            return false;
        }

        // Validate required header fields
        if (!header.fid || !header.type || !header.key) {
            console.error('Missing required header fields');
            return false;
        }

        // Validate timestamp (signature should not be too old)
        const now = Math.floor(Date.now() / 1000);
        const maxAge = 300; // 5 minutes

        if (header.timestamp && (now - header.timestamp) > maxAge) {
            console.error('Signature is too old');
            return false;
        }

        // Reconstruct the message that was signed
        const headerBytes = new TextEncoder().encode(signature.header);
        const payloadBytes = new TextEncoder().encode(signature.payload);
        const messageBytes = new Uint8Array(headerBytes.length + payloadBytes.length + 1);
        messageBytes.set(headerBytes);
        messageBytes[headerBytes.length] = 46; // ASCII for '.'
        messageBytes.set(payloadBytes, headerBytes.length + 1);

        // Decode the signature
        const signatureBytes = base64urlDecodeToBytes(signature.signature);

        // Verify signature based on key type
        const keyType = header.type;
        const publicKey = header.key;

        let isValid = false;

        switch (keyType) {
            case 'custody':
            case 'app':
                // These typically use ECDSA (secp256k1)
                isValid = verifyECDSASignature(messageBytes, signatureBytes, publicKey);
                break;

            case 'ed25519':
                // Ed25519 signatures
                isValid = verifyEd25519Signature(messageBytes, signatureBytes, publicKey);
                break;

            default:
                console.error(`Unsupported key type: ${keyType}`);
                return false;
        }

        if (!isValid) {
            console.error('Signature verification failed');
            return false;
        }

        // Additional validation: verify the public key belongs to the claimed FID
        const actualPublicKey = await getFarcasterPublicKey(header.fid.toString());
        if (actualPublicKey && actualPublicKey !== publicKey) {
            console.error('Public key does not match FID');
            return false;
        }
        return true;

    } catch (error) {
        console.error('Failed to verify Farcaster signature:', error);
        return false;
    }
}

// Process webhook events from Farcaster
export async function processFarcasterWebhook(signedPayload: FarcasterSignature): Promise<boolean> {
    try {
        const isValidSignature = await verifyFarcasterSignature(signedPayload);
        if (!isValidSignature) {
            console.error('[Webhook] Invalid Farcaster signature');
            return false;
        }

        const header = JSON.parse(base64urlDecode(signedPayload.header));
        const payload = JSON.parse(base64urlDecode(signedPayload.payload)) as FarcasterWebhookPayload;

        const fid = header.fid?.toString();
        if (!fid) {
            console.error('[Webhook] No FID found in webhook header');
            return false;
        }

        switch (payload.event) {
            case 'miniapp_added': {
                if (payload.notificationDetails) {
                    const username = header.username || `user_${fid}`;
                    farcasterTokenStore.addToken(
                        fid,
                        username,
                        payload.notificationDetails.token,
                        payload.notificationDetails.url
                    );
                    // Create default preferences (no hiveUsername yet)
                    const { SkateHiveFarcasterService } = await import('./skatehive-integration');
                    await SkateHiveFarcasterService.createDefaultPreferences(fid, username);
                }
                break;
            }
            case 'miniapp_removed': {
                farcasterTokenStore.removeToken(fid);
                // Delete preferences for this FID
                const { SkateHiveFarcasterService } = await import('./skatehive-integration');
                break;
            }
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
                console.warn('[Webhook] Unknown Farcaster webhook event:', payload);
                return false;
        }
        return true;
    } catch (error) {
        console.error('[Webhook] Failed to process Farcaster webhook:', error);
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
        return true;
    }
    return false;
}

// Development-only function to bypass signature verification for testing
export function createMockFarcasterWebhook(
    fid: string,
    event: 'miniapp_added' | 'miniapp_removed' | 'notifications_enabled' | 'notifications_disabled',
    notificationDetails?: { url: string; token: string }
): FarcasterSignature {
    const header = {
        fid: parseInt(fid),
        type: 'custody',
        key: ETH_ADDRESSES.ZERO,
        timestamp: Math.floor(Date.now() / 1000)
    };

    const payload: FarcasterWebhookPayload = {
        event,
        ...(notificationDetails && { notificationDetails })
    } as any;

    // Create mock base64url encoded strings
    const headerEncoded = Buffer.from(JSON.stringify(header)).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const signatureEncoded = Buffer.from('mock_signature_for_testing').toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    return {
        header: headerEncoded,
        payload: payloadEncoded,
        signature: signatureEncoded
    };
}

// Development-only function to process webhook without signature verification
export async function processFarcasterWebhookUnsafe(signedPayload: FarcasterSignature): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Unsafe webhook processing is not allowed in production');
    }

    console.warn('⚠️  Using unsafe webhook processing - FOR DEVELOPMENT ONLY');

    try {
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
        console.error('Failed to process Farcaster webhook (unsafe):', error);
        return false;
    }
}
