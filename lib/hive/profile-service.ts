import { Client, PrivateKey } from '@hiveio/dhive';

const hiveClient = new Client([
    'https://api.hive.blog',
    'https://anyx.io',
    'https://api.openhive.network'
]);

export interface HiveProfileExtensions {
    farcaster?: {
        fid: string;
        username: string;
        notifications: boolean;
        linkedAt: string;
    };
    skatehive?: {
        version: string;
        farcasterConnected: boolean;
    };
}

/**
 * Service to manage Hive blockchain profile updates
 * Stores Farcaster FID in user's profile metadata extensions
 */
export class HiveProfileService {

    /**
     * Update user's Hive profile to include Farcaster information
     */
    static async updateHiveProfileWithFarcaster(
        hiveUsername: string,
        postingKey: string,
        farcasterFid: string,
        farcasterUsername: string,
        notificationsEnabled: boolean = true
    ): Promise<{ success: boolean; message: string; txId?: string }> {
        try {
            // Get current profile
            const accounts = await hiveClient.database.getAccounts([hiveUsername]);
            if (accounts.length === 0) {
                return { success: false, message: 'Hive account not found' };
            }

            const account = accounts[0];
            let currentProfile: any = {};

            // Parse existing profile metadata
            try {
                if (account.posting_json_metadata) {
                    currentProfile = JSON.parse(account.posting_json_metadata);
                }
            } catch (error) {
                console.log('No existing profile metadata or invalid JSON');
            }

            // Ensure extensions object exists
            if (!currentProfile.extensions) {
                currentProfile.extensions = {};
            }

            // Update Farcaster information
            currentProfile.extensions.farcaster = {
                fid: farcasterFid,
                username: farcasterUsername,
                notifications: notificationsEnabled,
                linkedAt: new Date().toISOString()
            };

            // Update SkateHive integration info
            currentProfile.extensions.skatehive = {
                version: '3.0',
                farcasterConnected: true,
                ...currentProfile.extensions.skatehive
            };

            // Create the account update operation
            const privateKey = PrivateKey.fromString(postingKey);

            const operation: ['account_update2', {
                account: string;
                posting_json_metadata: string;
                extensions: never[];
            }] = [
                    'account_update2',
                    {
                        account: hiveUsername,
                        posting_json_metadata: JSON.stringify(currentProfile),
                        extensions: []
                    }
                ];

            // Broadcast the transaction
            const result = await hiveClient.broadcast.sendOperations([operation], privateKey);

            return {
                success: true,
                message: 'Hive profile updated successfully',
                txId: result.id
            };

        } catch (error) {
            console.error('Failed to update Hive profile:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update profile'
            };
        }
    }

    /**
     * Get Farcaster information from user's Hive profile
     */
    static async getFarcasterFromHiveProfile(hiveUsername: string): Promise<{
        fid?: string;
        username?: string;
        notifications?: boolean;
        linkedAt?: string;
    } | null> {
        try {
            const accounts = await hiveClient.database.getAccounts([hiveUsername]);
            if (accounts.length === 0) return null;

            const account = accounts[0];
            if (!account.posting_json_metadata) return null;

            const profile = JSON.parse(account.posting_json_metadata);
            return profile.extensions?.farcaster || null;

        } catch (error) {
            console.error('Failed to get Farcaster info from Hive profile:', error);
            return null;
        }
    }

    /**
     * Check if user has Farcaster connected based on Hive profile
     */
    static async isConnectedToFarcaster(hiveUsername: string): Promise<boolean> {
        const farcasterInfo = await this.getFarcasterFromHiveProfile(hiveUsername);
        return farcasterInfo?.fid ? true : false;
    }

    /**
     * Remove Farcaster information from Hive profile
     */
    static async removeFarcasterFromHiveProfile(
        hiveUsername: string,
        postingKey: string
    ): Promise<{ success: boolean; message: string; txId?: string }> {
        try {
            const accounts = await hiveClient.database.getAccounts([hiveUsername]);
            if (accounts.length === 0) {
                return { success: false, message: 'Hive account not found' };
            }

            const account = accounts[0];
            let currentProfile: any = {};

            try {
                if (account.posting_json_metadata) {
                    currentProfile = JSON.parse(account.posting_json_metadata);
                }
            } catch (error) {
                return { success: false, message: 'Invalid profile metadata' };
            }

            // Remove Farcaster information
            if (currentProfile.extensions?.farcaster) {
                delete currentProfile.extensions.farcaster;
            }

            // Update SkateHive integration info
            if (currentProfile.extensions?.skatehive) {
                currentProfile.extensions.skatehive.farcasterConnected = false;
            }

            const privateKey = PrivateKey.fromString(postingKey);

            const operation: ['account_update2', {
                account: string;
                posting_json_metadata: string;
                extensions: never[];
            }] = [
                    'account_update2',
                    {
                        account: hiveUsername,
                        posting_json_metadata: JSON.stringify(currentProfile),
                        extensions: []
                    }
                ];

            const result = await hiveClient.broadcast.sendOperations([operation], privateKey);

            return {
                success: true,
                message: 'Farcaster information removed from Hive profile',
                txId: result.id
            };

        } catch (error) {
            console.error('Failed to remove Farcaster from Hive profile:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update profile'
            };
        }
    }

    /**
     * Sync Farcaster information between database and Hive profile
     */
    static async syncFarcasterInfo(hiveUsername: string): Promise<{
        success: boolean;
        message: string;
        source: 'hive' | 'database' | 'none';
        data?: any;
    }> {
        try {
            // Import here to avoid circular dependency
            const { SkateHiveFarcasterService } = await import('../farcaster/skatehive-integration');

            // Get info from both sources
            const [hiveProfile, databasePrefs] = await Promise.all([
                this.getFarcasterFromHiveProfile(hiveUsername),
                SkateHiveFarcasterService.getUserPreferences(hiveUsername)
            ]);

            if (!hiveProfile && !databasePrefs) {
                return {
                    success: true,
                    message: 'No Farcaster connection found',
                    source: 'none'
                };
            }

            if (hiveProfile && !databasePrefs) {
                return {
                    success: true,
                    message: 'Farcaster info found in Hive profile but not in database',
                    source: 'hive',
                    data: hiveProfile
                };
            }

            if (!hiveProfile && databasePrefs) {
                return {
                    success: true,
                    message: 'Farcaster info found in database but not in Hive profile',
                    source: 'database',
                    data: {
                        fid: databasePrefs.fid,
                        username: databasePrefs.farcasterUsername,
                        notifications: databasePrefs.notificationsEnabled
                    }
                };
            }

            // Both exist, check for consistency
            if (hiveProfile && databasePrefs && hiveProfile.fid !== databasePrefs.fid) {
                return {
                    success: false,
                    message: 'Inconsistent Farcaster FID between Hive profile and database',
                    source: 'database',
                    data: { hive: hiveProfile, database: databasePrefs }
                };
            }

            return {
                success: true,
                message: 'Farcaster info is consistent',
                source: 'database',
                data: databasePrefs
            };

        } catch (error) {
            console.error('Failed to sync Farcaster info:', error);
            return {
                success: false,
                message: 'Failed to sync Farcaster information',
                source: 'none'
            };
        }
    }
}
