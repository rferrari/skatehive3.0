import { NextRequest, NextResponse } from 'next/server';
import { AutomatedNotificationService } from '@/lib/farcaster/automated-notifications';

/**
 * API endpoint to manually test automated notification processing
 * POST /api/farcaster/test-notifications
 */
export async function POST(req: NextRequest) {
    try {
        console.log('[test-notifications] Starting manual test of automated notification service');

        // Process all unread notifications
        const results = await AutomatedNotificationService.processUnreadNotifications();

        console.log('[test-notifications] Test completed:', results);

        return NextResponse.json({
            success: true,
            message: 'Automated notification test completed',
            results
        });

    } catch (error) {
        console.error('[test-notifications] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
