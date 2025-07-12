import React, { useState } from 'react';
import { useFarcasterNotifications } from '@/hooks/useFarcasterNotifications';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAioha } from '@aioha/react-ui';

interface FarcasterNotificationDemoProps {
    className?: string;
}

export const FarcasterNotificationDemo: React.FC<FarcasterNotificationDemoProps> = ({
    className = ''
}) => {
    const { user } = useAioha();
    const { farcasterEnabled, enableFarcasterNotifications, disableFarcasterNotifications } = useNotifications();
    const { status, linkToFarcaster, sendNotification, syncNotifications, getDebugInfo } = useFarcasterNotifications();

    const [fid, setFid] = useState('');
    const [testTitle, setTestTitle] = useState('🛹 New Skate Video!');
    const [testBody, setTestBody] = useState('Check out this awesome trick!');
    const [isLinking, setIsLinking] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    const handleLinkToFarcaster = async () => {
        if (!fid.trim()) {
            alert('Please enter a Farcaster FID');
            return;
        }

        setIsLinking(true);
        try {
            const success = await linkToFarcaster(fid.trim());
            if (success) {
                alert(`Successfully linked to Farcaster FID ${fid}`);
                enableFarcasterNotifications();
            } else {
                alert('Failed to link to Farcaster. Make sure the FID exists and has SkateHive added as a miniapp.');
            }
        } catch (error) {
            alert('Error linking to Farcaster');
        } finally {
            setIsLinking(false);
        }
    };

    const handleSendTestNotification = async () => {
        if (!status.isConnected) {
            alert('Please link to Farcaster first');
            return;
        }

        setIsSending(true);
        try {
            const result = await sendNotification({
                type: 'vote',
                title: testTitle,
                body: testBody,
                hiveUsername: user || 'skatehive',
                sourceUrl: 'https://skatehive.app/test'
            });

            if (result.success) {
                alert('Test notification sent successfully!');
            } else {
                alert('Failed to send test notification');
            }
        } catch (error) {
            alert('Error sending test notification');
        } finally {
            setIsSending(false);
        }
    };

    const debugInfo = getDebugInfo();

    return (
        <div className={`p-6 bg-gray-900 text-white rounded-lg ${className}`}>
            <h2 className="text-2xl font-bold mb-4">🚀 Farcaster Notifications</h2>

            {/* Status Display */}
            <div className="mb-6 p-4 bg-gray-800 rounded">
                <h3 className="text-lg font-semibold mb-2">Status</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-400">Hive User:</span>
                        <span className="ml-2">{user || 'Not logged in'}</span>
                    </div>
                    <div>
                        <span className="text-gray-400">Farcaster Enabled:</span>
                        <span className={`ml-2 ${farcasterEnabled ? 'text-green-400' : 'text-red-400'}`}>
                            {farcasterEnabled ? 'Yes' : 'No'}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400">Connected:</span>
                        <span className={`ml-2 ${status.isConnected ? 'text-green-400' : 'text-red-400'}`}>
                            {status.isConnected ? 'Yes' : 'No'}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400">Active Tokens:</span>
                        <span className="ml-2">{status.tokenCount}</span>
                    </div>
                    <div>
                        <span className="text-gray-400">Processing:</span>
                        <span className={`ml-2 ${status.isProcessing ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {status.isProcessing ? 'Yes' : 'No'}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400">Last Sync:</span>
                        <span className="ml-2">
                            {status.lastSyncTime ? status.lastSyncTime.toLocaleTimeString() : 'Never'}
                        </span>
                    </div>
                </div>
                {status.error && (
                    <div className="mt-2 text-red-400 text-sm">
                        Error: {status.error}
                    </div>
                )}
            </div>

            {/* Link to Farcaster */}
            <div className="mb-6 p-4 bg-gray-800 rounded">
                <h3 className="text-lg font-semibold mb-2">Link to Farcaster</h3>
                <p className="text-sm text-gray-400 mb-3">
                    Enter your Farcaster FID to receive SkateHive notifications in Farcaster clients.
                </p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Enter Farcaster FID"
                        value={fid}
                        onChange={(e) => setFid(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                        disabled={isLinking}
                    />
                    <button
                        onClick={handleLinkToFarcaster}
                        disabled={isLinking || !user}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
                    >
                        {isLinking ? 'Linking...' : 'Link'}
                    </button>
                </div>
            </div>

            {/* Test Notification */}
            <div className="mb-6 p-4 bg-gray-800 rounded">
                <h3 className="text-lg font-semibold mb-2">Send Test Notification</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Title (max 32 chars)</label>
                        <input
                            type="text"
                            value={testTitle}
                            onChange={(e) => setTestTitle(e.target.value.substring(0, 32))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                            disabled={isSending}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Body (max 128 chars)</label>
                        <textarea
                            value={testBody}
                            onChange={(e) => setTestBody(e.target.value.substring(0, 128))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                            rows={3}
                            disabled={isSending}
                        />
                    </div>
                    <button
                        onClick={handleSendTestNotification}
                        disabled={isSending || !status.isConnected}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded"
                    >
                        {isSending ? 'Sending...' : 'Send Test Notification'}
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="mb-6 p-4 bg-gray-800 rounded">
                <h3 className="text-lg font-semibold mb-2">Controls</h3>
                <div className="flex gap-2">
                    <button
                        onClick={enableFarcasterNotifications}
                        disabled={farcasterEnabled}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded"
                    >
                        Enable Farcaster
                    </button>
                    <button
                        onClick={disableFarcasterNotifications}
                        disabled={!farcasterEnabled}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded"
                    >
                        Disable Farcaster
                    </button>
                    <button
                        onClick={syncNotifications}
                        disabled={status.isProcessing}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
                    >
                        Manual Sync
                    </button>
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                    >
                        {showDebug ? 'Hide' : 'Show'} Debug
                    </button>
                </div>
            </div>

            {/* Debug Information */}
            {showDebug && (
                <div className="p-4 bg-gray-800 rounded">
                    <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
                    <pre className="text-xs bg-black p-3 rounded overflow-auto max-h-96">
                        {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};
