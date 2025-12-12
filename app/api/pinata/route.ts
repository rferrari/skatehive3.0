import { NextRequest, NextResponse } from 'next/server';
import { uploadLimiter, getClientIP } from '@/lib/utils/rate-limiter';

export async function POST(request: NextRequest) {
    // Rate limiting check
    const ip = getClientIP(request);
    const { allowed, remaining, resetIn } = uploadLimiter.check(ip);

    if (!allowed) {
        console.warn('Rate limit exceeded for IP:', ip);
        return NextResponse.json(
            {
                error: 'Upload rate limit exceeded. Please try again later.',
                retryAfter: Math.ceil(resetIn / 1000)
            },
            {
                status: 429,
                headers: {
                    'Retry-After': Math.ceil(resetIn / 1000).toString(),
                    'X-RateLimit-Remaining': remaining.toString(),
                }
            }
        );
    }

    const pinataJwt = process.env.PINATA_JWT;

    // Log request info for debugging
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    console.log('📱 Pinata API request:', {
        userAgent,
        isMobile,
        timestamp: new Date().toISOString(),
        contentType: request.headers.get('content-type'),
        contentLength: request.headers.get('content-length')
    });

    if (!pinataJwt) {
        console.error('PINATA_JWT is missing from environment');
        return NextResponse.json({ error: 'Pinata credentials not configured' }, { status: 500 });
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
                'Authorization': `Bearer ${pinataJwt}`,
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