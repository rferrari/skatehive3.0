import { NextRequest, NextResponse } from 'next/server';
import { SkateHiveFarcasterService } from '@/lib/farcaster/skatehive-integration';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const hiveUsername = searchParams.get('hiveUsername');

    try {
        const stats = await SkateHiveFarcasterService.getNotificationStats(hiveUsername || undefined);
        
        return NextResponse.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Failed to get notification stats:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to get notification stats' },
            { status: 500 }
        );
    }
}
