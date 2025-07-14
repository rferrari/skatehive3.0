import { NextResponse } from 'next/server';
import { AutomatedNotificationService } from '@/lib/farcaster/automated-notifications';

export async function GET() {
    try {
        const result = await AutomatedNotificationService.processUnreadNotifications();
        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
}
