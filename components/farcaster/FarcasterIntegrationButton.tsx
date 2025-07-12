'use client';

import React, { useEffect } from 'react';
import { useFarcasterIntegration } from '@/hooks/useFarcasterIntegration';

interface FarcasterIntegrationButtonProps {
    hiveUsername: string;
}

export function FarcasterIntegrationButton({ hiveUsername }: FarcasterIntegrationButtonProps) {
    const { status, loading, checkLinkStatus, toggleNotifications } = useFarcasterIntegration(hiveUsername);

    // Check status on mount
    useEffect(() => {
        checkLinkStatus();
    }, [checkLinkStatus]);

    if (loading) {
        return <div className="animate-pulse bg-gray-700 h-10 w-48 rounded"></div>;
    }

    if (!status.isLinked) {
        return (
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">📱</span>
                    <div>
                        <h3 className="font-semibold">Connect Farcaster</h3>
                        <p className="text-sm text-gray-400">
                            Add SkateHive as a miniapp in your Farcaster client to get notifications
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => window.open('https://warpcast.com/~/add-miniapp', '_blank')}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                >
                    Add Miniapp
                </button>
            </div>
        );
    }

    return (
        <div className="bg-green-900 border border-green-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">✅</span>
                    <div>
                        <h3 className="font-semibold">Farcaster Connected</h3>
                        <p className="text-sm text-gray-400">
                            @{status.farcasterUsername} (FID: {status.fid})
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => toggleNotifications(!status.notificationsEnabled)}
                    disabled={loading}
                    className={`px-4 py-2 rounded text-sm ${
                        status.notificationsEnabled
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                    } disabled:opacity-50`}
                >
                    {status.notificationsEnabled ? 'Disable' : 'Enable'} Notifications
                </button>
            </div>
        </div>
    );
}
