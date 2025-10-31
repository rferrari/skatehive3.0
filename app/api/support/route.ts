import { NextRequest, NextResponse } from 'next/server';
import supportMailer from '@/lib/support/route';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, message, subject, userAgent, timestamp } = body;
        
        // Basic validation
        if (!email || !message) {
            return NextResponse.json(
                { success: false, error: 'Email and message are required.' }, 
                { status: 400 }
            );
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Please enter a valid email address.' }, 
                { status: 400 }
            );
        }

        // Message length validation (Apple requires reasonable limits)
        if (message.length < 10 || message.length > 2000) {
            return NextResponse.json(
                { success: false, error: 'Message must be between 10 and 2000 characters.' }, 
                { status: 400 }
            );
        }

        const success = await supportMailer({
            email,
            message,
            subject: subject || 'Support Request from SkateHive App',
            userAgent,
            timestamp
        });

        if (success) {
            return NextResponse.json({ success: true, message: 'Support request sent successfully.' });
        } else {
            return NextResponse.json(
                { success: false, error: 'Failed to send support request. Please try again.' }, 
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Support API Error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Internal server error.' }, 
            { status: 500 }
        );
    }
}