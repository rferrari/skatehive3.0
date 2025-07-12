'use client';

import { useState } from 'react';

export default function TestFarcasterPage() {
    const [fid, setFid] = useState('20721'); // Your FID
    const [hiveUsername, setHiveUsername] = useState('');
    const [title, setTitle] = useState('SkateHive Test');
    const [body, setBody] = useState('Testing Farcaster notifications!');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const linkUser = async () => {
        if (!fid || !hiveUsername) {
            alert('Please enter both FID and Hive username');
            return;
        }

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
            setResult({ type: 'link', data });
        } catch (error) {
            setResult({ type: 'error', data: error });
        } finally {
            setLoading(false);
        }
    };

    const sendNotification = async () => {
        if (!hiveUsername) {
            alert('Please enter a Hive username');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/farcaster/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    body: body,
                    targetUsers: [hiveUsername]
                })
            });

            const data = await response.json();
            setResult({ type: 'notify', data });
        } catch (error) {
            setResult({ type: 'error', data: error });
        } finally {
            setLoading(false);
        }
    };

    const checkStatus = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/farcaster/status');
            const data = await response.json();
            setResult({ type: 'status', data });
        } catch (error) {
            setResult({ type: 'error', data: error });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">🛹 Farcaster Notifications Test</h1>

                {/* Link User Section */}
                <div className="bg-gray-800 p-6 rounded-lg mb-6">
                    <h2 className="text-xl font-semibold mb-4">1. Link Farcaster to Hive User</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Farcaster FID</label>
                            <input
                                type="text"
                                value={fid}
                                onChange={(e) => setFid(e.target.value)}
                                className="w-full p-3 bg-gray-700 rounded-lg"
                                placeholder="20721"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Hive Username</label>
                            <input
                                type="text"
                                value={hiveUsername}
                                onChange={(e) => setHiveUsername(e.target.value)}
                                className="w-full p-3 bg-gray-700 rounded-lg"
                                placeholder="your-hive-username"
                            />
                        </div>
                        <button
                            onClick={linkUser}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg disabled:opacity-50"
                        >
                            {loading ? 'Linking...' : 'Link User'}
                        </button>
                    </div>
                </div>

                {/* Send Notification Section */}
                <div className="bg-gray-800 p-6 rounded-lg mb-6">
                    <h2 className="text-xl font-semibold mb-4">2. Send Test Notification</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Title (max 32 chars)</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value.slice(0, 32))}
                                className="w-full p-3 bg-gray-700 rounded-lg"
                                maxLength={32}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Body (max 128 chars)</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value.slice(0, 128))}
                                className="w-full p-3 bg-gray-700 rounded-lg h-20"
                                maxLength={128}
                            />
                        </div>
                        <button
                            onClick={sendNotification}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send Notification'}
                        </button>
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-gray-800 p-6 rounded-lg mb-6">
                    <h2 className="text-xl font-semibold mb-4">3. Check System Status</h2>
                    <button
                        onClick={checkStatus}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg disabled:opacity-50"
                    >
                        {loading ? 'Checking...' : 'Check Status'}
                    </button>
                </div>

                {/* Results */}
                {result && (
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">Results</h2>
                        <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
