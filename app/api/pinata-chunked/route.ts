import { NextResponse } from 'next/server';

// Chunked upload handler for large files
export async function POST(request: Request) {
    const pinataJwt = process.env.PINATA_JWT;

    if (!pinataJwt) {
        console.error('PINATA_JWT is missing from environment');
        return NextResponse.json({ error: 'Pinata credentials not configured' }, { status: 500 });
    }

    try {
        // For chunked uploads, we receive metadata and chunk info
        const body = await request.json();
        const { fileName, fileType, creator, thumbnailUrl, totalSize, chunk, chunkIndex, totalChunks } = body;

        console.log('📱 Chunked upload received:', {
            fileName,
            fileType,
            chunkIndex,
            totalChunks,
            chunkSize: chunk ? chunk.length : 0,
            totalSize
        });

        // Store chunks in a temporary location (you might want to use a proper storage)
        // For now, we'll handle single chunk uploads directly
        if (totalChunks === 1) {
            // Single chunk - upload directly
            const buffer = Buffer.from(chunk, 'base64');
            const file = new File([buffer], fileName, { type: fileType });

            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            const pinataMetadata = JSON.stringify({
                name: fileName,
                keyvalues: {
                    creator: creator || 'anonymous',
                    fileType: fileType,
                    uploadDate: new Date().toISOString(),
                    platform: 'mobile-chunked',
                    ...(thumbnailUrl && { thumbnailUrl: thumbnailUrl }),
                }
            });

            uploadFormData.append('pinataMetadata', pinataMetadata);

            const pinataOptions = JSON.stringify({
                cidVersion: 1,
            });
            uploadFormData.append('pinataOptions', pinataOptions);

            const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${pinataJwt}`,
                },
                body: uploadFormData,
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('📱 Chunked upload failed:', uploadResponse.status, errorText);
                throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
            }

            const upload = await uploadResponse.json();
            console.log('📱 Chunked upload successful:', upload.IpfsHash);

            return NextResponse.json({
                IpfsHash: upload.IpfsHash,
                PinSize: upload.PinSize,
                Timestamp: upload.Timestamp || new Date().toISOString(),
            });
        } else {
            // Multi-chunk handling would go here
            // For now, return error for multi-chunk
            return NextResponse.json({
                error: 'Multi-chunk uploads not yet implemented'
            }, { status: 501 });
        }

    } catch (error) {
        console.error('📱 Chunked upload error:', error);
        return NextResponse.json({ error: 'Chunked upload failed' }, { status: 500 });
    }
}
