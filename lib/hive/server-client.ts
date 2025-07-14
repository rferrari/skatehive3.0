import { Client, Notifications } from '@hiveio/dhive';

// Server-side Hive client for fetching notifications
class ServerHiveClient {
    private client: Client;

    constructor() {
        this.client = new Client([
            'https://api.hive.blog',
            'https://api.hivekings.com',
            'https://anyx.io',
            'https://api.openhive.network'
        ]);
    }

    /**
     * Fetch notifications for a user (server-side version)
     */
    async fetchNotifications(username: string, limit: number = 100): Promise<Notifications[]> {
        try {
            const notifications: Notifications[] = await this.client.call('bridge', 'account_notifications', {
                account: username,
                limit
            });
            return notifications;
        } catch (error) {
            console.error('Error fetching notifications for', username, ':', error);
            return [];
        }
    }

    /**
     * Get the last read notification date for a user
     */
    async getLastReadNotificationDate(username: string): Promise<string> {
        try {
            const params = {
                account: username,
                start: -1,
                limit: 1000,
                include_reversible: true,
                operation_filter_low: 262144,
            };

            const transactions = await this.client.call('account_history_api', 'get_account_history', params);
            const history = transactions.history.reverse();

            for (const item of history) {
                if (item[1].op.value.id === 'notify') {
                    const json = JSON.parse(item[1].op.value.json);
                    return json[1].date;
                }
            }

            return '1970-01-01T00:00:00Z';
        } catch (error) {
            console.error('Error getting last read notification date for', username, ':', error);
            return '1970-01-01T00:00:00Z';
        }
    }

    /**
     * Fetch post/comment content by author and permlink
     */
    async fetchContent(author: string, permlink: string): Promise<any> {
        try {
            const content = await this.client.database.call('get_content', [author, permlink]);
            return content;
        } catch (error) {
            console.error(`Error fetching content for ${author}/${permlink}:`, error);
            return null;
        }
    }
}

// Singleton instance
const serverHiveClient = new ServerHiveClient();

export { serverHiveClient };
export default serverHiveClient;
