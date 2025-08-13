import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

    // Log request info for mobile debugging
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    console.log('📱 Pinata API request:', {
        userAgent,
        isMobile,
        timestamp: new Date().toISOString(),
        contentType: request.headers.get('content-type'),
        contentLength: request.headers.get('content-length')
    });

    if (!pinataApiKey || !pinataSecretApiKey) {
        console.error('Pinata API credentials are missing');
        return NextResponse.json({ error: 'Pinata API credentials are missing' }, { status: 500 });
    }

    try {
        console.log('📱 Parsing FormData...');
        const requestFormData = await request.formData();
        const file = requestFormData.get('file') as File;
        const creator = requestFormData.get('creator') as string;
        const thumbnailUrl = requestFormData.get('thumbnailUrl') as string;

        console.log('📱 FormData parsed:', {
            hasFile: !!file,
            fileName: file?.name,
            fileSize: file?.size,
            fileType: file?.type,
            creator,
            hasThumbnail: !!thumbnailUrl,
            isMobile
        });

        if (!file) {
            console.error('📱 No file provided in request');
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
                isMobile: isMobile.toString(),
                userAgent: userAgent.substring(0, 100), // Truncate for storage
                ...(thumbnailUrl && { thumbnailUrl: thumbnailUrl }),
            }
        });

        uploadFormData.append('pinataMetadata', pinataMetadata);

        // Add pinataOptions for making it public
        const pinataOptions = JSON.stringify({
            cidVersion: 1,
        });
        uploadFormData.append('pinataOptions', pinataOptions);

        console.log('📱 Sending to Pinata...', {
            fileSize: file.size,
            fileName: file.name,
            isMobile
        });

        const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            },
            body: uploadFormData,
        });

        console.log('📱 Pinata response status:', uploadResponse.status, 'isMobile:', isMobile);

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('📱 Pinata upload failed:', {
                status: uploadResponse.status,
                statusText: uploadResponse.statusText,
                errorText,
                isMobile,
                fileSize: file.size
            });
            throw new Error(`Pinata upload failed: ${uploadResponse.status} - ${errorText}`);
        }

        const upload = await uploadResponse.json();
        console.log('📱 Pinata upload successful:', {
            hash: upload.IpfsHash,
            size: upload.PinSize,
            isMobile
        });

        // Return the result in the same format for compatibility
        const result = {
            IpfsHash: upload.IpfsHash,
            PinSize: upload.PinSize,
            Timestamp: upload.Timestamp || new Date().toISOString(),
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('📱 Failed to process upload:', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            isMobile,
            timestamp: new Date().toISOString()
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}