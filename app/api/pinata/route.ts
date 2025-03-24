import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretApiKey) {
        return NextResponse.json({ error: 'Pinata API keys are missing' }, { status: 500 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Don't restrict to only video files to keep the API route more flexible
        console.log('File received:', file.name, 'Type:', file.type);

        const pinataUrl = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
        const data = new FormData();
        data.append('file', file);

        const response = await fetch(pinataUrl, {
            method: 'POST',
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            },
            body: data,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error from Pinata:', errorText);
            return NextResponse.json({ error: 'Failed to upload file to Pinata', details: errorText }, { status: response.status });
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to process upload:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}