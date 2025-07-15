import { NextRequest, NextResponse } from 'next/server';
import { isServerSideAdmin, logSecurityAttempt } from '@/lib/server/adminUtils';

export async function POST(request: NextRequest) {
    try {
        const { username } = await request.json();

        if (!username || typeof username !== 'string') {
            return NextResponse.json({ isAdmin: false }, { status: 400 });
        }

        const isAdmin = isServerSideAdmin(username);
        logSecurityAttempt(username, 'admin check', request, isAdmin);

        return NextResponse.json({ isAdmin });
    } catch (error) {
        console.error('Admin check error:', error);
        return NextResponse.json({ isAdmin: false }, { status: 500 });
    }
}
