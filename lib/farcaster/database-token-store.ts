import { sql } from '@vercel/postgres';
import { FarcasterUserToken } from '@/types/farcaster';

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
            // Main farcaster_tokens table
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

            // Enhanced user preferences table for SkateHive integration
            await sql`
        CREATE TABLE IF NOT EXISTS skatehive_farcaster_preferences (
          id SERIAL PRIMARY KEY,
          hive_username VARCHAR(255) NOT NULL UNIQUE,
          fid VARCHAR(50),
          farcaster_username VARCHAR(255),
          notifications_enabled BOOLEAN DEFAULT TRUE,
          notify_votes BOOLEAN DEFAULT TRUE,
          notify_comments BOOLEAN DEFAULT TRUE,
          notify_follows BOOLEAN DEFAULT TRUE,
          notify_mentions BOOLEAN DEFAULT TRUE,
          notify_posts BOOLEAN DEFAULT FALSE,
          notification_frequency VARCHAR(20) DEFAULT 'instant',
          -- Scheduled notification preferences
          scheduled_notifications_enabled BOOLEAN DEFAULT FALSE,
          scheduled_time_hour INTEGER DEFAULT 9 CHECK (scheduled_time_hour >= 0 AND scheduled_time_hour <= 23),
          scheduled_time_minute INTEGER DEFAULT 0 CHECK (scheduled_time_minute >= 0 AND scheduled_time_minute <= 59),
          timezone VARCHAR(50) DEFAULT 'UTC',
          max_notifications_per_batch INTEGER DEFAULT 5 CHECK (max_notifications_per_batch > 0 AND max_notifications_per_batch <= 20),
          last_scheduled_check TIMESTAMP,
          last_scheduled_notification_id BIGINT DEFAULT 0,
          -- Existing fields
          linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_notification_at TIMESTAMP,
          hive_profile_updated BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (fid) REFERENCES farcaster_tokens(fid) ON DELETE SET NULL
        )
      `;

            // Add the new scheduled notification columns if they don't exist (for existing tables)
            await sql`
        ALTER TABLE skatehive_farcaster_preferences 
        ADD COLUMN IF NOT EXISTS scheduled_notifications_enabled BOOLEAN DEFAULT FALSE
      `;

            await sql`
        ALTER TABLE skatehive_farcaster_preferences 
        ADD COLUMN IF NOT EXISTS scheduled_time_hour INTEGER DEFAULT 9
      `;

            await sql`
        ALTER TABLE skatehive_farcaster_preferences 
        ADD COLUMN IF NOT EXISTS scheduled_time_minute INTEGER DEFAULT 0
      `;

            await sql`
        ALTER TABLE skatehive_farcaster_preferences 
        ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC'
      `;

            await sql`
        ALTER TABLE skatehive_farcaster_preferences 
        ADD COLUMN IF NOT EXISTS max_notifications_per_batch INTEGER DEFAULT 5
      `;

            await sql`
        ALTER TABLE skatehive_farcaster_preferences 
        ADD COLUMN IF NOT EXISTS last_scheduled_check TIMESTAMP
      `;

            await sql`
        ALTER TABLE skatehive_farcaster_preferences 
        ADD COLUMN IF NOT EXISTS last_scheduled_notification_id BIGINT DEFAULT 0
      `;

            // Notification logs for analytics
            await sql`
        CREATE TABLE IF NOT EXISTS farcaster_notification_logs (
          id SERIAL PRIMARY KEY,
          hive_username VARCHAR(255) NOT NULL,
          fid VARCHAR(50),
          notification_type VARCHAR(50) NOT NULL,
          title VARCHAR(32) NOT NULL,
          body VARCHAR(128) NOT NULL,
          target_url TEXT,
          success BOOLEAN NOT NULL,
          error_message TEXT,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

            // Create indexes
            await sql`CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_fid ON farcaster_tokens(fid)`;
            await sql`CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_hive_username ON farcaster_tokens(hive_username)`;
            await sql`CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_active ON farcaster_tokens(is_active)`;

            await sql`CREATE INDEX IF NOT EXISTS idx_skatehive_preferences_hive_username ON skatehive_farcaster_preferences(hive_username)`;
            await sql`CREATE INDEX IF NOT EXISTS idx_skatehive_preferences_fid ON skatehive_farcaster_preferences(fid)`;
            await sql`CREATE INDEX IF NOT EXISTS idx_skatehive_preferences_enabled ON skatehive_farcaster_preferences(notifications_enabled)`;

            await sql`CREATE INDEX IF NOT EXISTS idx_notification_logs_hive_username ON farcaster_notification_logs(hive_username)`;
            await sql`CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON farcaster_notification_logs(notification_type)`;
            await sql`CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON farcaster_notification_logs(sent_at)`;

            console.log('Enhanced SkateHive Farcaster database tables initialized successfully');
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
