import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ hash: string }> }
) {
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretApiKey) {
        return NextResponse.json({ error: 'Pinata API credentials are missing' }, { status: 500 });
    }

    try {
        const { hash } = await params;

        // Use legacy API to get pin information
        const response = await fetch(`https://api.pinata.cloud/data/pinList?hashContains=${hash}`, {
            method: 'GET',
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch metadata from Pinata' }, { status: response.status });
        }

        const data = await response.json();

        // Find the file with the exact hash match
        const file = data.rows.find((f: any) => f.ipfs_pin_hash === hash);

        if (!file) {
            return NextResponse.json({ error: 'Hash not found' }, { status: 404 });
        }

        // Return the metadata 
        return NextResponse.json({
            name: file.metadata?.name || 'Unknown',
            keyvalues: file.metadata?.keyvalues || {},
            id: file.id,
            cid: file.ipfs_pin_hash,
            size: file.size,
            createdAt: file.date_pinned,
        });

    } catch (error) {
        console.error('Failed to fetch metadata:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
