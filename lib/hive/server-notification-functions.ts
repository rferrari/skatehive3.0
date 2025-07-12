import HiveClient from "./hiveclient";
import { Notifications } from "@hiveio/dhive";

export async function getLastReadNotificationDateServer(username: string): Promise<string> {
    try {
        const params = {
            account: username,
            start: -1,
            limit: 1000,
            include_reversible: true,
            operation_filter_low: 262144,
        };
        const transactions = await HiveClient.call('account_history_api', 'get_account_history', params);
        const history = transactions.history.reverse();
        for (const item of history) {
            if (item[1].op.value.id === 'notify') {
                const json = JSON.parse(item[1].op.value.json);
                return json[1].date;
            }
        }
        return '1970-01-01T00:00:00Z';
    } catch (error) {
        console.log(error);
        return '1970-01-01T00:00:00Z';
    }
}

export async function fetchNewNotificationsServer(username: string) {
    try {
        const notifications: Notifications[] = await HiveClient.call('bridge', 'account_notifications', { account: username, limit: 100 });
        return notifications;
    } catch (error) {
        console.log('Error:', error);
        return [];
    }
}
