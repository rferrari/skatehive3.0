import { NextApiRequest, NextApiResponse } from 'next';
import { Notifications } from '@hiveio/dhive';
import { getLastReadNotificationDate, fetchNewNotifications } from '@/lib/hive/client-functions';

// Returns unread notifications for a given hiveUsername
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const hiveUsername = req.query.hiveUsername as string;
    if (!hiveUsername) {
        return res.status(400).json({ success: false, message: 'Missing hiveUsername' });
    }

    try {
        // Get all notifications and last read date
        const notifications: Notifications[] = await fetchNewNotifications(hiveUsername);
        const lastReadDate: string = await getLastReadNotificationDate(hiveUsername);
        const lastReadTimestamp = new Date(lastReadDate).getTime();

        // Filter unread notifications
        const unread = notifications.filter(n => {
            const notifDate = new Date(n.date).getTime();
            return notifDate > lastReadTimestamp;
        });

        // Map to simple format for frontend
        const mapped = unread.map(n => ({
            type: n.type,
            message: n.msg,
            timestamp: n.date,
            url: n.url || '',
        }));

        return res.status(200).json({ success: true, notifications: mapped });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching notifications', error: String(error) });
    }
}
