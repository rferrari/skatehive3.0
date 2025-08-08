import { useCallback, useEffect, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { farcasterNotificationService } from '@/lib/farcaster/notification-service';
import { farcasterTokenStore, linkHiveToFarcaster } from '@/lib/farcaster/token-store';
import { HiveToFarcasterNotification, FarcasterNotificationResponse } from '@/types/farcaster';
import { useAioha } from '@aioha/react-ui';

interface UseFarcasterNotificationsProps {
    enableAutoSync?: boolean;
    syncInterval?: number; // in milliseconds
}

interface FarcasterNotificationStatus {
    isConnected: boolean;
    hasActiveTokens: boolean;
    tokenCount: number;
    lastSyncTime?: Date;
    isProcessing: boolean;
    error?: string;
}

export function useFarcasterNotifications({
    enableAutoSync = true,
    syncInterval = 30000, // 30 seconds
}: UseFarcasterNotificationsProps = {}) {
    const { user } = useAioha();
    const { notifications, newNotificationCount, refreshNotifications } = useNotifications();
    const [status, setStatus] = useState<FarcasterNotificationStatus>({
        isConnected: false,
        hasActiveTokens: false,
        tokenCount: 0,
        isProcessing: false,
    });
    const [lastProcessedId, setLastProcessedId] = useState<number>(0);

    // Update status based on current token store state
    const updateStatus = useCallback(() => {
        const activeTokens = farcasterTokenStore.getActiveTokens();
        const userTokens = user
            ? farcasterTokenStore.getTokensForHiveUsers([user])
            : [];

        setStatus(prev => ({
            ...prev,
            isConnected: userTokens.length > 0,
            hasActiveTokens: activeTokens.length > 0,
            tokenCount: activeTokens.length,
        }));
    }, [user]);

    // Link current Hive user to a Farcaster FID
    const linkToFarcaster = useCallback(async (fid: string): Promise<boolean> => {
        if (!user) {
            setStatus(prev => ({ ...prev, error: 'No Hive user logged in' }));
            return false;
        }

        try {
            const success = linkHiveToFarcaster(fid, user);
            if (success) {
                updateStatus();
                setStatus(prev => ({ ...prev, error: undefined }));
            }
            return success;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to link accounts';
            setStatus(prev => ({ ...prev, error: errorMessage }));
            return false;
        }
    }, [user, updateStatus]);

    // Send a custom notification to Farcaster
    const sendNotification = useCallback(async (
        notification: HiveToFarcasterNotification,
        targetUsers?: string[]
    ): Promise<{ success: boolean; results: FarcasterNotificationResponse[] }> => {
        if (!status.hasActiveTokens) {
            return { success: false, results: [] };
        }

        setStatus(prev => ({ ...prev, isProcessing: true }));

        try {
            const result = await farcasterNotificationService.sendNotification(
                notification,
                targetUsers
            );

            setStatus(prev => ({
                ...prev,
                isProcessing: false,
                lastSyncTime: new Date(),
                error: undefined
            }));

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
            setStatus(prev => ({
                ...prev,
                isProcessing: false,
                error: errorMessage
            }));

            return { success: false, results: [] };
        }
    }, [status.hasActiveTokens]);

    // Process new Hive notifications and send to Farcaster
    const processNewHiveNotifications = useCallback(async (): Promise<void> => {
        if (!status.hasActiveTokens || !user) {
            return;
        }

        // Find notifications newer than the last processed one
        const newNotifications = notifications.filter(notification =>
            notification.id > lastProcessedId
        );

        if (newNotifications.length === 0) {
            return;
        }

        setStatus(prev => ({ ...prev, isProcessing: true }));

        try {
            // Send new notifications to Farcaster
            const result = await farcasterNotificationService.sendHiveNotifications(
                newNotifications,
                [user] // Only send to current user's Farcaster accounts
            );

            // Update the last processed notification ID
            const highestId = Math.max(...newNotifications.map(n => n.id));
            setLastProcessedId(highestId);

            setStatus(prev => ({
                ...prev,
                isProcessing: false,
                lastSyncTime: new Date(),
                error: undefined
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process notifications';
            setStatus(prev => ({
                ...prev,
                isProcessing: false,
                error: errorMessage
            }));
            console.error('Failed to process Hive notifications for Farcaster:', error);
        }
    }, [status.hasActiveTokens, user, notifications, lastProcessedId]);

    // Manually trigger sync
    const syncNotifications = useCallback(async (): Promise<void> => {
        await refreshNotifications();
        await processNewHiveNotifications();
    }, [refreshNotifications, processNewHiveNotifications]);

    // Get debug information
    const getDebugInfo = useCallback(() => {
        return {
            status,
            lastProcessedId,
            allTokens: farcasterTokenStore.getAllTokens(),
            activeTokens: farcasterTokenStore.getActiveTokens(),
            userTokens: user ? farcasterTokenStore.getTokensForHiveUsers([user]) : [],
            recentNotifications: notifications.slice(0, 5),
        };
    }, [status, lastProcessedId, user, notifications]);

    // Auto-sync effect
    useEffect(() => {
        if (!enableAutoSync || !status.hasActiveTokens) {
            return;
        }

        const interval = setInterval(() => {
            processNewHiveNotifications();
        }, syncInterval);

        return () => clearInterval(interval);
    }, [enableAutoSync, status.hasActiveTokens, syncInterval, processNewHiveNotifications]);

    // Process notifications when new ones arrive
    useEffect(() => {
        if (newNotificationCount > 0 && status.hasActiveTokens) {
            processNewHiveNotifications();
        }
    }, [newNotificationCount, status.hasActiveTokens, processNewHiveNotifications]);

    // Update status when dependencies change
    useEffect(() => {
        updateStatus();
    }, [updateStatus]);

    // Initialize last processed ID from the latest notification
    useEffect(() => {
        if (notifications.length > 0 && lastProcessedId === 0) {
            const latestId = Math.max(...notifications.map(n => n.id));
            setLastProcessedId(latestId);
        }
    }, [notifications, lastProcessedId]);

    return {
        // Status
        status,

        // Actions
        linkToFarcaster,
        sendNotification,
        syncNotifications,

        // Debug
        getDebugInfo,
    };
}
