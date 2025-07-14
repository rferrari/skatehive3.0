import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { hiveUsername, updateHiveProfile, postingKey } = body;

        if (!hiveUsername) {
            return NextResponse.json(
                { success: false, message: 'Hive username is required' },
                { status: 400 }
            );
        }

        // Get user's preferences to find their FID
        const { SkateHiveFarcasterService } = await import('@/lib/farcaster/skatehive-integration');
        const preferences = await SkateHiveFarcasterService.getUserPreferences(hiveUsername);

        if (!preferences || !preferences.fid) {
            return NextResponse.json(
                { success: false, message: 'No Farcaster account linked to this Hive account' },
                { status: 404 }
            );
        }

        // Remove token from token store
        const { getTokenStore } = await import('@/lib/farcaster/token-store-factory');
        const tokenStore = getTokenStore();
        await tokenStore.removeToken(preferences.fid);

        // Remove user preferences by clearing the hive username
        const { Pool } = await import('pg');
        const pool = new Pool({
            connectionString: process.env.STORAGE_POSTGRES_URL || process.env.POSTGRES_URL
        });
        await pool.query(
            'UPDATE skatehive_farcaster_preferences SET hive_username = NULL WHERE fid = $1',
            [preferences.fid]
        );

        // Update Hive profile if requested and posting key is provided
        if (updateHiveProfile && postingKey) {
            try {
                // Remove farcaster username from Hive profile
                console.log('[UNLINK] Would update Hive profile to remove Farcaster username');
                // Note: Profile update functionality would need to be implemented
            } catch (err) {
                console.warn('[UNLINK] Failed to update Hive profile:', err);
                // Don't fail the unlink process if profile update fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Account unlinked successfully'
        });

    } catch (error) {
        console.error('[UNLINK] Error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to unlink account' },
            { status: 500 }
        );
    }
}
