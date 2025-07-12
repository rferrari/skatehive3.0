import { NextRequest, NextResponse } from 'next/server';
import { SkateHiveFarcasterService } from '@/lib/farcaster/skatehive-integration';
import { HiveProfileService } from '@/lib/hive/profile-service';

export async function POST(request: NextRequest) {
    try {
        const {
            hiveUsername,
            fid,
            farcasterUsername,
            preferences,
            updateHiveProfile,
            postingKey
        } = await request.json();

        if (!hiveUsername || !fid || !farcasterUsername) {
            return NextResponse.json(
                { success: false, message: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // Link the Farcaster account
        const linkResult = await SkateHiveFarcasterService.linkFarcasterAccount(
            hiveUsername,
            fid,
            farcasterUsername,
            preferences
        );

        if (!linkResult.success) {
            return NextResponse.json(linkResult, { status: 400 });
        }

        // Update Hive profile if requested and posting key provided
        let hiveProfileResult = null;
        if (updateHiveProfile && postingKey) {
            hiveProfileResult = await HiveProfileService.updateHiveProfileWithFarcaster(
                hiveUsername,
                postingKey,
                fid,
                farcasterUsername,
                preferences?.notificationsEnabled ?? true
            );
        }

        return NextResponse.json({
            success: true,
            message: linkResult.message,
            hiveProfileUpdated: hiveProfileResult?.success || false,
            hiveProfileMessage: hiveProfileResult?.message
        });

    } catch (error) {
        console.error('Failed to link SkateHive Farcaster account:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to link account' },
            { status: 500 }
        );
    }
}
