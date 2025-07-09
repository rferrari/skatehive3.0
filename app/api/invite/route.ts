import { NextRequest, NextResponse } from 'next/server';
import serverMailer from '@/lib/invite/route';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { to, subject, createdby, desiredUsername, masterPassword, keys, language } = body;
        const success = await serverMailer(to, subject, createdby, desiredUsername, masterPassword, keys, language);
        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: 'Failed to send email.' }, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error?.message || 'Unknown error.' }, { status: 500 });
    }
}
