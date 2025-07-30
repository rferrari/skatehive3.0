import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

    if (!pinataApiKey || !pinataSecretApiKey) {
        console.error('Pinata API credentials are missing');
        return NextResponse.json({ error: 'Pinata API credentials are missing' }, { status: 500 });
    }

    try {
        const requestFormData = await request.formData();
        const file = requestFormData.get('file') as File;
        const creator = requestFormData.get('creator') as string;
        const thumbnailUrl = requestFormData.get('thumbnailUrl') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Upload file using Pinata API
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        // Add pinataMetadata with keyvalues
        const pinataMetadata = JSON.stringify({
            name: file.name,
            keyvalues: {
                creator: creator || 'anonymous',
                fileType: file.type,
                uploadDate: new Date().toISOString(),
                ...(thumbnailUrl && { thumbnailUrl: thumbnailUrl }),
            }
        });

        uploadFormData.append('pinataMetadata', pinataMetadata);

        // Add pinataOptions for making it public
        const pinataOptions = JSON.stringify({
            cidVersion: 1,
        });
        uploadFormData.append('pinataOptions', pinataOptions);

        const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            },
            body: uploadFormData,
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('Pinata upload failed:', uploadResponse.status, errorText);
            throw new Error(`Pinata upload failed: ${uploadResponse.status} - ${errorText}`);
        }

        const upload = await uploadResponse.json();

        // Return the result in the same format for compatibility
        const result = {
            IpfsHash: upload.IpfsHash,
            PinSize: upload.PinSize,
            Timestamp: upload.Timestamp || new Date().toISOString(),
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to process upload:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}