import { NextRequest, NextResponse } from 'next/server';
import { fetchNewNotificationsServer, getLastReadNotificationDateServer } from '@/lib/hive/server-notification-functions';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const hiveUsername = searchParams.get('hiveUsername');

    if (!hiveUsername) {
        return NextResponse.json({ success: false, message: 'Missing hiveUsername' }, { status: 400 });
    }

    try {
        // Get last read notification date
        let lastReadDate;
        try {
            lastReadDate = await getLastReadNotificationDateServer(hiveUsername);
        } catch (err) {
            console.error(`[notifications-queue] Error in getLastReadNotificationDateServer:`, err);
            return NextResponse.json({ success: false, message: 'getLastReadNotificationDateServer failed', error: String(err) }, { status: 500 });
        }

        // Fetch all notifications
        let allNotifications;
        try {
            allNotifications = await fetchNewNotificationsServer(hiveUsername);
        } catch (err) {
            console.error(`[notifications-queue] Error in fetchNewNotificationsServer:`, err);
            throw new Error('fetchNewNotificationsServer failed');
        }
        if (allNotifications.length > 0) {
        }

        // Filter unread notifications
        const unread = allNotifications.filter(n => {
            const notifDate = new Date(n.date).getTime();
            const lastReadTimestamp = new Date(lastReadDate).getTime();
            return notifDate > lastReadTimestamp;
        });
        if (unread.length > 0) {
        }

        // Map to simple format for frontend
        const mapped = unread.map(n => ({
            type: n.type,
            message: n.msg,
            timestamp: n.date,
            url: n.url || '',
        }));

        return NextResponse.json({ success: true, notifications: mapped });
    } catch (error) {
        console.error('Failed to get notifications queue:', error);
        return NextResponse.json({ success: false, message: 'Failed to get notifications queue', error: String(error) }, { status: 500 });
    }
}
