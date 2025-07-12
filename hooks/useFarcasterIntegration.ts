import { useState, useCallback } from 'react';

interface FarcasterLinkStatus {
    isLinked: boolean;
    fid?: string;
    farcasterUsername?: string;
    notificationsEnabled: boolean;
}

export function useFarcasterIntegration(hiveUsername?: string) {
    const [status, setStatus] = useState<FarcasterLinkStatus>({
        isLinked: false,
        notificationsEnabled: false
    });
    const [loading, setLoading] = useState(false);

    // Check if user has linked their Farcaster account
    const checkLinkStatus = useCallback(async () => {
        if (!hiveUsername) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/farcaster/user-status?hiveUsername=${hiveUsername}`);
            const data = await response.json();
            
            setStatus({
                isLinked: data.isLinked,
                fid: data.fid,
                farcasterUsername: data.farcasterUsername,
                notificationsEnabled: data.notificationsEnabled
            });
        } catch (error) {
            console.error('Failed to check Farcaster link status:', error);
        } finally {
            setLoading(false);
        }
    }, [hiveUsername]);

    // Link Farcaster account (call this when user connects via miniapp)
    const linkFarcasterAccount = useCallback(async (fid: string) => {
        if (!hiveUsername) return { success: false, message: 'No Hive username provided' };
        
        setLoading(true);
        try {
            const response = await fetch('/api/farcaster/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fid: fid,
                    hiveUsername: hiveUsername
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                await checkLinkStatus(); // Refresh status
            }
            
            return data;
        } catch (error) {
            console.error('Failed to link Farcaster account:', error);
            return { success: false, message: 'Failed to link account' };
        } finally {
            setLoading(false);
        }
    }, [hiveUsername, checkLinkStatus]);

    // Toggle notifications
    const toggleNotifications = useCallback(async (enabled: boolean) => {
        if (!status.fid) return { success: false, message: 'No Farcaster account linked' };
        
        setLoading(true);
        try {
            const endpoint = enabled ? '/api/farcaster/enable' : '/api/farcaster/disable';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fid: status.fid })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setStatus(prev => ({ ...prev, notificationsEnabled: enabled }));
            }
            
            return data;
        } catch (error) {
            console.error('Failed to toggle notifications:', error);
            return { success: false, message: 'Failed to update notifications' };
        } finally {
            setLoading(false);
        }
    }, [status.fid]);

    return {
        status,
        loading,
        checkLinkStatus,
        linkFarcasterAccount,
        toggleNotifications
    };
}
