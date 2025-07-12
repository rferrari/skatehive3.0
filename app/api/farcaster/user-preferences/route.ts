import { NextRequest, NextResponse } from 'next/server';
import { SkateHiveFarcasterService } from '@/lib/farcaster/skatehive-integration';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const hiveUsername = searchParams.get('hiveUsername');

    if (!hiveUsername) {
        return NextResponse.json(
            { success: false, message: 'hiveUsername parameter is required' },
            { status: 400 }
        );
    }

    try {
        const preferences = await SkateHiveFarcasterService.getUserPreferences(hiveUsername);
        
        return NextResponse.json({
            success: true,
            data: preferences
        });

    } catch (error) {
        console.error('Failed to get user preferences:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to get user preferences' },
            { status: 500 }
        );
    }
}
