'use client';


import { useUserContext } from '@/contexts/UserContext';
import FarcasterSettingsPage from './FarcasterSettingsPage';

const user = useUserContext();

if (!user?.hiveUser?.name) {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-2">🔐 Login Required</h2>
                    <p className="text-gray-300">
                        Please log in to your SkateHive account to manage Farcaster notifications.
                    </p>
                </div>
            </div>
        </div>
    );
}

return (
    <FarcasterSettingsPage
        hiveUsername={user.hiveUser.name}
        postingKey={user.hiveUser.posting_key}
    />
);
}
