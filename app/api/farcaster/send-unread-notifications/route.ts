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

    // Fetch Farcaster user info from preferences table
    let prefs;
    try {
        const { SkateHiveFarcasterService } = await import('@/lib/farcaster/skatehive-integration');
        prefs = await SkateHiveFarcasterService.getUserPreferences(hiveUsername);
        if (!prefs || !prefs.farcasterUsername || !prefs.fid) {
            return NextResponse.json({ success: false, message: 'No Farcaster user linked to this Hive username.' }, { status: 404 });
        }
    } catch (err) {
        return NextResponse.json({ success: false, message: 'Error fetching Farcaster user info', error: String(err) }, { status: 500 });
    }

    try {
        // Fetch unread notifications (reuse queue logic)
        const { fetchNewNotificationsServer, getLastReadNotificationDateServer } = await import('@/lib/hive/server-notification-functions');
        const lastReadDate = await getLastReadNotificationDateServer(hiveUsername);
        const allNotifications = await fetchNewNotificationsServer(hiveUsername);
        const unread = allNotifications.filter(n => {
            const notifDate = new Date(n.date).getTime();
            const lastReadTimestamp = new Date(lastReadDate).getTime();
            return notifDate > lastReadTimestamp;
        });
        // Only send the last unread notification for testing
        const lastUnread = unread.length > 0 ? [unread[unread.length - 1]] : [];
        console.log(`[send-unread-notifications] Hive: ${hiveUsername} → Farcaster: ${prefs.farcasterUsername} (FID: ${prefs.fid})`);
        console.log(`[send-unread-notifications] Sending ${lastUnread.length} notification(s):`, lastUnread);
        // Actually send notification(s)
        let notificationsSent = 0;
        if (lastUnread.length > 0) {
            const { farcasterNotificationService } = await import('@/lib/farcaster/notification-service');
            const result = await farcasterNotificationService.sendHiveNotifications(lastUnread, [prefs.fid]);
            notificationsSent = result.results?.length || 0;
        }
        return NextResponse.json({ success: true, notificationsSent, sentTo: prefs.farcasterUsername, hiveUsername, targetFid: prefs.fid });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Error sending unread notifications', error: String(error) }, { status: 500 });
    }
}
