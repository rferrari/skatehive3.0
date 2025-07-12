import { NextRequest, NextResponse } from 'next/server';
import { ScheduledNotificationService } from '@/lib/farcaster/scheduled-notifications';

// POST /api/farcaster/send-unread-notifications?hiveUsername=xvlad

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const hiveUsername = searchParams.get('hiveUsername');

    if (!hiveUsername) {
        return NextResponse.json({ success: false, message: 'Missing hiveUsername' }, { status: 400 });
    }

    try {
        // This triggers sending unread notifications for the user
        const result = await ScheduledNotificationService.triggerUserNotifications(hiveUsername);
        return NextResponse.json({ success: true, notificationsSent: result.notificationsSent || 0 });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error sending unread notifications', error: String(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    let hiveUsername;
    try {
        const body = await request.json();
        hiveUsername = body.hiveUsername;
    } catch {
        hiveUsername = undefined;
    }
    if (!hiveUsername) {
        return NextResponse.json({ success: false, message: 'Missing hiveUsername' }, { status: 400 });
    }
    try {
        const result = await ScheduledNotificationService.triggerUserNotifications(hiveUsername);
        return NextResponse.json({ success: true, notificationsSent: result.notificationsSent || 0 });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error sending unread notifications', error: String(error) }, { status: 500 });
    }
}
