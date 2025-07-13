import { NextResponse } from 'next/server';
import { ScheduledNotificationService } from '@/lib/farcaster/scheduled-notifications';

export async function GET() {
    try {
        const result = await ScheduledNotificationService.processScheduledNotifications();
        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
}
