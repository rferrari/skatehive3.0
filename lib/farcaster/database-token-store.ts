import { sql } from '@vercel/postgres';
import { FarcasterUserToken } from '@/types/farcaster';

// Database row interface
interface TokenRow {
    fid: string;
    username: string;
    hive_username: string | null;
    token: string;
    notification_url: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Database-backed token store for production
export class DatabaseTokenStore {

    // Add or update a user's notification token
    async addToken(
        fid: string,
        username: string,
        token: string,
        notificationUrl: string,
        hiveUsername?: string
    ): Promise<void> {
        try {
            await sql`
        INSERT INTO farcaster_tokens (fid, username, hive_username, token, notification_url, updated_at)
        VALUES (${fid}, ${username}, ${hiveUsername || null}, ${token}, ${notificationUrl}, NOW())
        ON CONFLICT (fid) 
        DO UPDATE SET 
          username = EXCLUDED.username,
          hive_username = EXCLUDED.hive_username,
          token = EXCLUDED.token,
          notification_url = EXCLUDED.notification_url,
          is_active = TRUE,
          updated_at = NOW()
      `;
            console.log(`Added/Updated Farcaster token for FID ${fid}, username: ${username}`);
        } catch (error) {
            console.error('Failed to add token to database:', error);
            throw error;
        }
    }

    // Remove a user's token
    async removeToken(fid: string): Promise<void> {
        try {
            await sql`DELETE FROM farcaster_tokens WHERE fid = ${fid}`;
            console.log(`Removed Farcaster token for FID ${fid}`);
        } catch (error) {
            console.error('Failed to remove token from database:', error);
            throw error;
        }
    }

    // Disable notifications for a user
    async disableNotifications(fid: string): Promise<void> {
        try {
            await sql`
        UPDATE farcaster_tokens 
        SET is_active = FALSE, updated_at = NOW() 
        WHERE fid = ${fid}
      `;
            console.log(`Disabled notifications for FID ${fid}`);
        } catch (error) {
            console.error('Failed to disable notifications:', error);
            throw error;
        }
    }

    // Enable notifications for a user
    async enableNotifications(fid: string, token: string, notificationUrl: string): Promise<void> {
        try {
            await sql`
        UPDATE farcaster_tokens 
        SET is_active = TRUE, token = ${token}, notification_url = ${notificationUrl}, updated_at = NOW()
        WHERE fid = ${fid}
      `;
            console.log(`Enabled notifications for FID ${fid}`);
        } catch (error) {
            console.error('Failed to enable notifications:', error);
            throw error;
        }
    }

    // Get all active tokens
    async getActiveTokens(): Promise<FarcasterUserToken[]> {
        try {
            const result = await sql<TokenRow>`
        SELECT fid, username, hive_username, token, notification_url, is_active, created_at, updated_at
        FROM farcaster_tokens 
        WHERE is_active = TRUE
      `;

            return result.rows.map((row: TokenRow) => ({
                fid: row.fid,
                username: row.username,
                hiveUsername: row.hive_username || undefined,
                token: row.token,
                notificationUrl: row.notification_url,
                isActive: row.is_active,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
            }));
        } catch (error) {
            console.error('Failed to get active tokens:', error);
            return [];
        }
    }

    // Get tokens for specific Hive usernames
    async getTokensForHiveUsers(hiveUsernames: string[]): Promise<FarcasterUserToken[]> {
        try {
            const placeholders = hiveUsernames.map((_, i) => `$${i + 1}`).join(',');
            const result = await sql<TokenRow>`
        SELECT fid, username, hive_username, token, notification_url, is_active, created_at, updated_at
        FROM farcaster_tokens 
        WHERE is_active = TRUE AND hive_username IN (${hiveUsernames.join(',')})
      `;

            return result.rows.map((row: TokenRow) => ({
                fid: row.fid,
                username: row.username,
                hiveUsername: row.hive_username || undefined,
                token: row.token,
                notificationUrl: row.notification_url,
                isActive: row.is_active,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
            }));
        } catch (error) {
            console.error('Failed to get tokens for Hive users:', error);
            return [];
        }
    }

    // Get token by FID
    async getTokenByFid(fid: string): Promise<FarcasterUserToken | undefined> {
        try {
            const result = await sql<TokenRow>`
        SELECT fid, username, hive_username, token, notification_url, is_active, created_at, updated_at
        FROM farcaster_tokens 
        WHERE fid = ${fid}
        LIMIT 1
      `;

            if (result.rows.length === 0) {
                return undefined;
            }

            const row = result.rows[0];
            return {
                fid: row.fid,
                username: row.username,
                hiveUsername: row.hive_username || undefined,
                token: row.token,
                notificationUrl: row.notification_url,
                isActive: row.is_active,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
            };
        } catch (error) {
            console.error('Failed to get token by FID:', error);
            return undefined;
        }
    }

    // Get all tokens (for debugging)
    async getAllTokens(): Promise<FarcasterUserToken[]> {
        try {
            const result = await sql<TokenRow>`
        SELECT fid, username, hive_username, token, notification_url, is_active, created_at, updated_at
        FROM farcaster_tokens 
        ORDER BY created_at DESC
      `;

            return result.rows.map((row: TokenRow) => ({
                fid: row.fid,
                username: row.username,
                hiveUsername: row.hive_username || undefined,
                token: row.token,
                notificationUrl: row.notification_url,
                isActive: row.is_active,
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at),
            }));
        } catch (error) {
            console.error('Failed to get all tokens:', error);
            return [];
        }
    }

    // Initialize database tables if they don't exist
    async initializeDatabase(): Promise<void> {
        try {
            await sql`
        CREATE TABLE IF NOT EXISTS farcaster_tokens (
          id SERIAL PRIMARY KEY,
          fid VARCHAR(50) NOT NULL UNIQUE,
          username VARCHAR(255),
          hive_username VARCHAR(255),
          token TEXT NOT NULL,
          notification_url TEXT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

            await sql`
        CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_fid ON farcaster_tokens(fid)
      `;

            await sql`
        CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_hive_username ON farcaster_tokens(hive_username)
      `;

            await sql`
        CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_active ON farcaster_tokens(is_active)
      `;

            console.log('Database tables initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }
}

// Create instance based on environment
export const createTokenStore = () => {
    if (process.env.POSTGRES_URL || process.env.VERCEL_ENV === 'production') {
        console.log('Using database token store');
        return new DatabaseTokenStore();
    } else {
        console.log('Using in-memory token store for development');
        // Return the existing in-memory store for development
        const { farcasterTokenStore } = require('./token-store');
        return farcasterTokenStore;
    }
};
