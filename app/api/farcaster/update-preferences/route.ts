import { NextRequest, NextResponse } from 'next/server';
import { SkateHiveFarcasterService, FarcasterPreferences } from '@/lib/farcaster/skatehive-integration';

export async function POST(request: NextRequest) {
    try {
        const { hiveUsername, preferences } = await request.json();

        if (!hiveUsername || !preferences) {
            return NextResponse.json(
                { success: false, message: 'Missing required parameters' },
                { status: 400 }
            );
        }

        const result = await SkateHiveFarcasterService.updatePreferences(
            hiveUsername,
            preferences as Partial<FarcasterPreferences>
        );

        return NextResponse.json(result);

    } catch (error) {
        console.error('Failed to update preferences:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update preferences' },
            { status: 500 }
        );
    }
}
