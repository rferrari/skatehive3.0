import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretApiKey) {
        console.error('Pinata API credentials are missing');
        return NextResponse.json({ error: 'Pinata API credentials are missing' }, { status: 500 });
    }

    try {
        const metadata = await request.json();

        if (!metadata || typeof metadata !== 'object') {
            return NextResponse.json({ error: 'Invalid metadata provided' }, { status: 400 });
        }

        // Validate required fields
        if (!metadata.name) {
            return NextResponse.json({ error: 'Metadata must include a name field' }, { status: 400 });
        }

        // Upload JSON metadata using Pinata API
        const pinataMetadata = {
            name: `coin-metadata-${metadata.name.replace(/[^a-zA-Z0-9]/g, '-')}.json`,
            keyvalues: {
                type: 'coin-metadata',
                coinName: metadata.name,
                uploadDate: new Date().toISOString(),
            }
        };

        const pinataOptions = {
            cidVersion: 1,
        };

        const data = {
            pinataContent: metadata,
            pinataMetadata,
            pinataOptions,
        };

        const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            },
            body: JSON.stringify(data),
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Pinata metadata upload failed:', uploadResponse.status, errorText);
            throw new Error(`Pinata metadata upload failed: ${uploadResponse.status} - ${errorText}`);
        }

        const upload = await uploadResponse.json();

        // Return the result
        const result = {
            ipfsHash: upload.IpfsHash,
            pinSize: upload.PinSize,
            timestamp: upload.Timestamp || new Date().toISOString(),
            uri: `ipfs://${upload.IpfsHash}`,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to upload metadata:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
}
