import React, { createContext, useContext, useEffect, useState } from 'react';
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

    const refreshNotifications = async () => {
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
    };

    const markNotificationsAsRead = async () => {
        if (!user) return;

        // Update the last read date to now
        const now = new Date().toISOString();
        setLastReadDate(now);

        // Here you could also make an API call to persist this on the server
        // For now, this will just update the local state
    };

    // Calculate new notification count
    const newNotificationCount = notifications.filter(
        (n) =>
            new Date(n.date.endsWith("Z") ? n.date : n.date + "Z") >
            new Date(lastReadDate)
    ).length;

    // Load notifications when user changes
    useEffect(() => {
        refreshNotifications();
    }, [user]);

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
