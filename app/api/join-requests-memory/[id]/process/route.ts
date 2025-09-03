import { NextRequest, NextResponse } from 'next/server';
import { 
    generatePassword, 
    getPrivateKeys, 
    validateAccountName, 
    checkAccountExists 
} from '@/lib/invite/helpers';
import * as dhive from '@hiveio/dhive';

// In-memory storage (same as the main route)
let joinRequests: any[] = [];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { action, username, createdBy, useAccountToken, language = 'EN' } = body;
        const requestId = parseInt(params.id);

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid action. Must be "approve" or "reject"' 
            }, { status: 400 });
        }

        // Find the join request
        const requestIndex = joinRequests.findIndex(req => req.id === requestId);
        if (requestIndex === -1) {
            return NextResponse.json({ 
                success: false, 
                error: 'Join request not found' 
            }, { status: 404 });
        }

        const joinRequest = joinRequests[requestIndex];

        if (action === 'reject') {
            // Update status to rejected
            joinRequests[requestIndex] = {
                ...joinRequest,
                status: 'rejected',
                updated_at: new Date().toISOString()
            };

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

        // Update the join request
        joinRequests[requestIndex] = {
            ...joinRequest,
            status: 'completed',
            created_by: createdBy,
            updated_at: new Date().toISOString(),
            notes: `Account created: @${username}`
        };

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
