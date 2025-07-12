import { NextRequest, NextResponse } from 'next/server';
import { ScheduledNotificationService } from '@/lib/farcaster/scheduled-notifications';

export async function POST(request: NextRequest) {
    try {
        // Verify this is a legitimate cron request
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('Processing scheduled notifications cron job...');

        const results = await ScheduledNotificationService.processScheduledNotifications();

        return NextResponse.json({
            success: true,
            message: 'Scheduled notifications processed successfully',
            results
        });

    } catch (error) {
        console.error('Scheduled notifications cron job failed:', error);
        return NextResponse.json(
            {
                success: false,
                message: `Cron job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                results: {
                    processedUsers: 0,
                    totalNotificationsSent: 0,
                    errors: [error instanceof Error ? error.message : 'Unknown error']
                }
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Scheduled Notifications Cron Job Endpoint',
        description: 'This endpoint should be called every minute by a cron service like Vercel Cron or GitHub Actions',
        usage: {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer YOUR_CRON_SECRET (optional, set CRON_SECRET env var)',
                'Content-Type': 'application/json'
            },
            schedule: 'Every minute: * * * * *',
            examples: {
                vercelCron: {
                    file: 'vercel.json',
                    config: {
                        crons: [
                            {
                                path: '/api/farcaster/cron/scheduled-notifications',
                                schedule: '* * * * *'
                            }
                        ]
                    }
                },
                githubActions: {
                    file: '.github/workflows/scheduled-notifications.yml',
                    schedule: '*/1 * * * *',
                    url: 'https://your-domain.com/api/farcaster/cron/scheduled-notifications'
                }
            }
        },
        setup: [
            '1. Add CRON_SECRET environment variable for security',
            '2. Set up cron job to call this endpoint every minute',
            '3. Monitor logs for processing results',
            '4. Users configure their preferred notification times in settings'
        ]
    });
}
