import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAioha } from '@aioha/react-ui';
import { Notifications } from '@hiveio/dhive';
import {
    fetchNewNotifications,
    getLastReadNotificationDate,
} from '@/lib/hive/client-functions';

interface NotificationContextProps {
    notifications: Notifications[];
    newNotificationCount: number;
    lastReadDate: string;
    refreshNotifications: () => Promise<void>;
    markNotificationsAsRead: () => Promise<void>;
    isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
    undefined
);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAioha();
    const [notifications, setNotifications] = useState<Notifications[]>([]);
    const [lastReadDate, setLastReadDate] = useState("1970-01-01T00:00:00Z");
    const [isLoading, setIsLoading] = useState(false);

    const refreshNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            setLastReadDate("1970-01-01T00:00:00Z");
            return;
        }

        setIsLoading(true);
        try {
            const [notifs, lastRead] = await Promise.all([
                fetchNewNotifications(user),
                getLastReadNotificationDate(user),
            ]);
            setNotifications(notifs);
            setLastReadDate(lastRead);
        } catch (error) {
            console.error('Error refreshing notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const markNotificationsAsRead = useCallback(async () => {
        if (!user) return;

        // Update the last read date to now
        const now = new Date().toISOString();
        setLastReadDate(now);

        // Here you could also make an API call to persist this on the server
        // For now, this will just update the local state
    }, [user]);

    // Helper function to safely parse dates
    const parseNotificationDate = useCallback((dateString: string): Date => {
        // Handle various date formats more robustly
        try {
            // If the date already has timezone info, use it as-is
            if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('-')) {
                return new Date(dateString);
            }
            // If no timezone info, assume it's UTC (common for blockchain timestamps)
            return new Date(dateString + 'Z');
        } catch (error) {
            console.warn('Failed to parse notification date:', dateString, error);
            return new Date(0); // Return epoch as fallback
        }
    }, []);

    // Memoize the notification count calculation to avoid recalculating on every render
    const newNotificationCount = useMemo(() => {
        if (notifications.length === 0) return 0;

        const lastReadTimestamp = new Date(lastReadDate).getTime();

        return notifications.filter((notification) => {
            const notificationTimestamp = parseNotificationDate(notification.date).getTime();
            return notificationTimestamp > lastReadTimestamp;
        }).length;
    }, [notifications, lastReadDate, parseNotificationDate]);

    // Load notifications when user changes
    useEffect(() => {
        refreshNotifications();
    }, [refreshNotifications]);

    const value: NotificationContextProps = {
        notifications,
        newNotificationCount,
        lastReadDate,
        refreshNotifications,
        markNotificationsAsRead,
        isLoading,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = (): NotificationContextProps => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
