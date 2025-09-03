import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { 
    generatePassword, 
    getPrivateKeys, 
    validateAccountName, 
    checkAccountExists 
} from '@/lib/invite/helpers';
import * as dhive from '@hiveio/dhive';

// Configure the database connection
if (process.env.STORAGE_POSTGRES_URL && !process.env.POSTGRES_URL) {
    process.env.POSTGRES_URL = process.env.STORAGE_POSTGRES_URL;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
        const { action, username, createdBy, useAccountToken, language = 'EN' } = body;
        const requestId = params.id;

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid action. Must be "approve" or "reject"' 
            }, { status: 400 });
        }

        // Get the join request
        const requestResult = await sql`
            SELECT * FROM join_requests WHERE id = ${requestId}
        `;

        if (requestResult.rows.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'Join request not found' 
            }, { status: 404 });
        }

        const joinRequest = requestResult.rows[0];

        if (action === 'reject') {
            // Update status to rejected
            await sql`
                UPDATE join_requests 
                SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
                WHERE id = ${requestId}
            `;

            return NextResponse.json({ 
                success: true, 
                message: 'Join request rejected' 
            });
        }

        // Action is 'approve' - create the account
        if (!username || !createdBy) {
            return NextResponse.json({ 
                success: false, 
                error: 'Username and createdBy are required for approval' 
            }, { status: 400 });
        }

        // Validate the chosen username
        const validation = validateAccountName(username);
        if (validation !== null) {
            return NextResponse.json({ 
                success: false, 
                error: `Invalid username: ${validation}` 
            }, { status: 400 });
        }

        // Check if account is available
        const isAvailable = await checkAccountExists(username);
        if (!isAvailable) {
            return NextResponse.json({ 
                success: false, 
                error: 'Username is not available' 
            }, { status: 400 });
        }

        // Generate keys
        const password = generatePassword();
        const keys = getPrivateKeys(username, password);

        // Create the account operation
        let createAccountOperation: dhive.Operation;
        if (useAccountToken) {
            createAccountOperation = [
                "create_claimed_account",
                {
                    creator: createdBy,
                    new_account_name: username,
                    owner: dhive.Authority.from(keys.ownerPubkey),
                    active: dhive.Authority.from(keys.activePubkey),
                    posting: dhive.Authority.from(keys.postingPubkey),
                    memo_key: keys.memoPubkey,
                    json_metadata: "",
                    extensions: [],
                },
            ];
        } else {
            createAccountOperation = [
                "account_create",
                {
                    fee: "3.000 HIVE",
                    creator: createdBy,
                    new_account_name: username,
                    owner: dhive.Authority.from(keys.ownerPubkey),
                    active: dhive.Authority.from(keys.activePubkey),
                    posting: dhive.Authority.from(keys.postingPubkey),
                    memo_key: keys.memoPubkey,
                    json_metadata: "",
                    extensions: [],
                },
            ];
        }

        // Update the join request with the created account info
        await sql`
            UPDATE join_requests 
            SET status = 'completed', created_by = ${createdBy}, 
                updated_at = CURRENT_TIMESTAMP,
                notes = ${`Account created: @${username}`}
            WHERE id = ${requestId}
        `;

        // Send the invite email
        const payload = {
            to: joinRequest.email,
            subject: `Welcome to Skatehive @${username}`,
            createdby: createdBy,
            desiredUsername: username,
            masterPassword: password,
            keys,
            language,
        };

        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        return NextResponse.json({ 
            success: true, 
            message: 'Account created and invite sent!',
            accountCreated: true,
            emailSent: data.success,
            operation: createAccountOperation
        });

    } catch (error: any) {
        console.error('Error processing join request:', error);
        return NextResponse.json({ 
            success: false, 
            error: error?.message || 'Failed to process join request' 
        }, { status: 500 });
    }
}
