import { NextRequest, NextResponse } from 'next/server';
import { validateHiveUsernameFormat } from '@/lib/utils/hiveAccountUtils';

// In-memory storage for development/testing
let joinRequests: any[] = [];
let nextId = 1;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, username_1 } = body;

        // Validate email
        if (!email || !email.includes('@')) {
            return NextResponse.json({ 
                success: false, 
                error: 'Valid email is required' 
            }, { status: 400 });
        }

        // Validate username
        if (!username_1) {
            return NextResponse.json({ 
                success: false, 
                error: 'Username is required' 
            }, { status: 400 });
        }

        // Validate username format
        const validation = validateHiveUsernameFormat(username_1);
        if (!validation.isValid) {
            return NextResponse.json({ 
                success: false, 
                error: `Invalid username "${username_1}": ${validation.error}` 
            }, { status: 400 });
        }

        // Allow multiple requests per email (removed restriction)

        // Add the join request
        const newRequest = {
            id: nextId++,
            email,
            username_1,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        joinRequests.push(newRequest);

        return NextResponse.json({ 
            success: true, 
            requestId: newRequest.id,
            message: 'Join request submitted successfully! We\'ll review it and get back to you soon.' 
        });

    } catch (error: any) {
        console.error('Error creating join request:', error);
        return NextResponse.json({ 
            success: false, 
            error: error?.message || 'Failed to submit join request' 
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'pending';

        const filteredRequests = joinRequests.filter(req => req.status === status);

        return NextResponse.json({ 
            success: true, 
            requests: filteredRequests 
        });

    } catch (error: any) {
        console.error('Error fetching join requests:', error);
        return NextResponse.json({ 
            success: false, 
            error: error?.message || 'Failed to fetch join requests' 
        }, { status: 500 });
    }
}
