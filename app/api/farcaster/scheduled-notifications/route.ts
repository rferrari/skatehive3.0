import { NextRequest, NextResponse } from 'next/server';
import { ScheduledNotificationService } from '@/lib/farcaster/scheduled-notifications';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { hiveUsername, preferences } = body;

        if (!hiveUsername) {
            return NextResponse.json(
                { success: false, message: 'Hive username is required' },
                { status: 400 }
            );
        }

        const result = await ScheduledNotificationService.updateScheduledPreferences(
            hiveUsername,
            preferences
        );

        return NextResponse.json(result);

    } catch (error) {
        console.error('Failed to update scheduled preferences:', error);
        return NextResponse.json(
            {
                success: false,
                message: `Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const hiveUsername = searchParams.get('hiveUsername');

    try {
        if (action === 'trigger' && hiveUsername) {
            // Manually trigger notifications for a user (for testing)
            const result = await ScheduledNotificationService.triggerUserNotifications(hiveUsername);
            return NextResponse.json(result);
        }

        if (action === 'users-for-time') {
            const hour = parseInt(searchParams.get('hour') || '9');
            const minute = parseInt(searchParams.get('minute') || '0');

            const users = await ScheduledNotificationService.getUsersForTime(hour, minute);
            return NextResponse.json({
                success: true,
                users,
                time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            });
        }

        // Default: return documentation
        return NextResponse.json({
            success: true,
            endpoints: {
                'POST /api/farcaster/scheduled-notifications': {
                    description: 'Update scheduled notification preferences',
                    body: {
                        hiveUsername: 'string (required)',
                        preferences: {
                            scheduledNotificationsEnabled: 'boolean (optional)',
                            scheduledTimeHour: 'number 0-23 (optional)',
                            scheduledTimeMinute: 'number 0-59 (optional)',
                            timezone: 'string (optional)',
                            maxNotificationsPerBatch: 'number 1-20 (optional)'
                        }
                    }
                },
                'GET /api/farcaster/scheduled-notifications?action=trigger&hiveUsername={username}': {
                    description: 'Manually trigger scheduled notifications for a user (testing)'
                },
                'GET /api/farcaster/scheduled-notifications?action=users-for-time&hour={hour}&minute={minute}': {
                    description: 'Get users scheduled for notifications at specific time'
                }
            },
            examples: {
                updatePreferences: {
                    method: 'POST',
                    body: {
                        hiveUsername: 'xvlad',
                        preferences: {
                            scheduledNotificationsEnabled: true,
                            scheduledTimeHour: 9,
                            scheduledTimeMinute: 0,
                            timezone: 'UTC',
                            maxNotificationsPerBatch: 5
                        }
                    }
                },
                triggerNotifications: {
                    method: 'GET',
                    url: '/api/farcaster/scheduled-notifications?action=trigger&hiveUsername=xvlad'
                }
            }
        });

    } catch (error) {
        console.error('Failed to process scheduled notifications request:', error);
        return NextResponse.json(
            {
                success: false,
                message: `Failed to process request: ${error instanceof Error ? error.message : 'Unknown error'}`
            },
            { status: 500 }
        );
    }
}
