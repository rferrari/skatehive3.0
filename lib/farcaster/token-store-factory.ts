import { farcasterTokenStore } from './token-store';
import { DatabaseTokenStore } from './database-token-store';
import { FarcasterUserToken } from '@/types/farcaster';

// Interface for token store operations
export interface ITokenStore {
    addToken(
        fid: string,
        username: string,
        token: string,
        notificationUrl: string,
        hiveUsername?: string
    ): Promise<void>;

    removeToken(fid: string): Promise<void>;

    disableNotifications(fid: string): Promise<void>;

    enableNotifications(
        fid: string,
        token: string,
        notificationUrl: string
    ): Promise<void>;

    getActiveTokens(): Promise<FarcasterUserToken[]>;

    getTokensForHiveUsers(
        hiveUsernames: string[]
    ): Promise<FarcasterUserToken[]>;

    getTokenByFid(
        fid: string
    ): Promise<FarcasterUserToken | undefined>;

    getAllTokens(): Promise<FarcasterUserToken[]>;
}

// Factory function to create appropriate token store
export function createTokenStore(): ITokenStore {
    // Use database store in production, in-memory for development
    if (process.env.NODE_ENV === 'production' || process.env.POSTGRES_URL) {
        return new DatabaseTokenStore();
    } else {
        console.warn('Using in-memory token store - tokens will not persist across restarts');
        return farcasterTokenStore as any; // Cast to interface
    }
}

// Singleton instance
let tokenStoreInstance: ITokenStore | null = null;

export function getTokenStore(): ITokenStore {
    if (!tokenStoreInstance) {
        tokenStoreInstance = createTokenStore();
    }
    return tokenStoreInstance;
}
