import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { validateHiveUsernameFormat } from '@/lib/utils/hiveAccountUtils';

// Configure the database connection
if (process.env.STORAGE_POSTGRES_URL && !process.env.POSTGRES_URL) {
    process.env.POSTGRES_URL = process.env.STORAGE_POSTGRES_URL;
}

export async function POST(req: NextRequest) {
    try {
        // Debug: Check if database connection is available
        if (!process.env.STORAGE_POSTGRES_URL && !process.env.POSTGRES_URL) {
            console.error('No database connection string found. STORAGE_POSTGRES_URL:', !!process.env.STORAGE_POSTGRES_URL, 'POSTGRES_URL:', !!process.env.POSTGRES_URL);
            return NextResponse.json({ 
                success: false, 
                error: 'Database not configured. Please set STORAGE_POSTGRES_URL environment variable.' 
            }, { status: 500 });
        }

        const body = await req.json();
        const { email, username_1, username_2, username_3 } = body;

        // Validate email
        if (!email || !email.includes('@')) {
            return NextResponse.json({ 
                success: false, 
                error: 'Valid email is required' 
            }, { status: 400 });
        }

        // Validate at least one username
        if (!username_1) {
            return NextResponse.json({ 
                success: false, 
                error: 'At least one username is required' 
            }, { status: 400 });
        }

        // Validate username formats
        const usernames = [username_1, username_2, username_3].filter(Boolean);
        for (const username of usernames) {
            const validation = validateHiveUsernameFormat(username);
            if (!validation.isValid) {
                return NextResponse.json({ 
                    success: false, 
                    error: `Invalid username "${username}": ${validation.error}` 
                }, { status: 400 });
            }
        }

        // Check if email already has a pending request
        const existingRequest = await sql`
            SELECT id FROM join_requests 
            WHERE email = ${email} AND status = 'pending'
        `;

        if (existingRequest.rows.length > 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'You already have a pending join request' 
            }, { status: 400 });
        }

        // Insert the join request
        const result = await sql`
            INSERT INTO join_requests (email, username_1, username_2, username_3)
            VALUES (${email}, ${username_1}, ${username_2 || null}, ${username_3 || null})
            RETURNING id
        `;

        return NextResponse.json({ 
            success: true, 
            requestId: result.rows[0].id,
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
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const result = await sql`
            SELECT id, email, username_1, username_2, username_3, status, 
                   created_by, created_at, updated_at, notes
            FROM join_requests 
            WHERE status = ${status}
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        return NextResponse.json({ 
            success: true, 
            requests: result.rows 
        });

    } catch (error: any) {
        console.error('Error fetching join requests:', error);
        return NextResponse.json({ 
            success: false, 
            error: error?.message || 'Failed to fetch join requests' 
        }, { status: 500 });
    }
}
