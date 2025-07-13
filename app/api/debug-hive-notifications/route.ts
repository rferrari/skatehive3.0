import { NextResponse } from 'next/server';
import { serverHiveClient } from '@/lib/hive/server-client';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || 'xvlad';
    try {
        const notifications = await serverHiveClient.fetchNotifications(username);
        return NextResponse.json({ success: true, username, notifications });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
}
