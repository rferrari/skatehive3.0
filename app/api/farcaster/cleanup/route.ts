import { NextRequest, NextResponse } from 'next/server';
import { AutomatedNotificationService } from '@/lib/farcaster/automated-notifications';

export async function POST(request: NextRequest) {
    try {
        // Simple auth check
        const authHeader = request.headers.get('authorization');
        if (authHeader !== 'Bearer cron-secret-key') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action } = body;

        if (action === 'cleanup') {
            const results = await AutomatedNotificationService.cleanupNotificationLogs();

            return NextResponse.json({
                success: true,
                action: 'cleanup',
                results,
                message: `Cleanup completed. Deleted ${results.deduplicationLogsDeleted} deduplication logs and ${results.analyticsLogsDeleted} analytics logs`
            });
        } else if (action === 'stats') {
            const stats = await AutomatedNotificationService.getDatabaseStats();

            return NextResponse.json({
                success: true,
                action: 'stats',
                stats,
                message: 'Database statistics retrieved'
            });
        } else {
            return NextResponse.json({
                error: 'Invalid action',
                validActions: ['cleanup', 'stats']
            }, { status: 400 });
        }

    } catch (error) {
        console.error('[Cleanup API] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'SkateHive Farcaster Database Cleanup API',
        usage: {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer cron-secret-key',
                'Content-Type': 'application/json'
            },
            body: {
                action: 'cleanup | stats'
            }
        },
        examples: {
            cleanup: {
                action: 'cleanup',
                description: 'Clean up old notification logs (30+ days for deduplication, 90+ days for analytics)'
            },
            stats: {
                action: 'stats',
                description: 'Get database statistics and table sizes'
            }
        }
    });
}
