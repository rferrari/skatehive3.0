import { NextRequest, NextResponse } from "next/server";
import { uploadLimiter, getClientIP } from '@/lib/utils/rate-limiter';

export async function POST(request: NextRequest) {
    // Rate limiting check
    const ip = getClientIP(request);
    const { allowed, remaining, resetIn } = uploadLimiter.check(ip);

    if (!allowed) {
        console.warn('📱 Mobile upload rate limit exceeded for IP:', ip);
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

    // Mobile-specific logging
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    console.log('📱 Mobile Pinata API request:', {
        userAgent: userAgent.substring(0, 50),
        isMobile,
        timestamp: new Date().toISOString(),
        contentLength: request.headers.get('content-length')
    });

    if (!pinataJwt) {
        console.error('PINATA_JWT is missing from environment');
        return NextResponse.json({ error: 'Pinata credentials not configured' }, { status: 500 });
    }

    try {
        const requestFormData = await request.formData();
        const file = requestFormData.get('file') as File;
        const creator = requestFormData.get('creator') as string;
        const thumbnailUrl = requestFormData.get('thumbnailUrl') as string;

        if (!file) {
            console.error('📱 No file provided in mobile request');
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const fileSizeMB = Math.round(file.size / 1024 / 1024 * 100) / 100;

        // Mobile file size check before processing
        if (file.size > 135 * 1024 * 1024) { // 135MB limit for mobile
            console.error('📱 Mobile file too large:', fileSizeMB, 'MB');
            return NextResponse.json({
                error: `File too large for mobile upload. Size: ${fileSizeMB}MB, Maximum: 135MB`
            }, { status: 413 });
        }

        console.log('📱 Mobile file details:', {
            fileName: file.name,
            fileSize: file.size,
            fileSizeMB,
            fileType: file.type
        });

        // Create upload FormData
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        // Mobile-optimized metadata
        const pinataMetadata = JSON.stringify({
            name: `mobile_${file.name}`,
            keyvalues: {
                creator: creator || 'anonymous',
                fileType: file.type,
                uploadDate: new Date().toISOString(),
                platform: 'mobile',
                userAgent: userAgent.substring(0, 100),
                fileSize: file.size.toString(),
                ...(thumbnailUrl && { thumbnailUrl: thumbnailUrl }),
            }
        });

        uploadFormData.append('pinataMetadata', pinataMetadata);

        const pinataOptions = JSON.stringify({
            cidVersion: 1,
        });
        uploadFormData.append('pinataOptions', pinataOptions);

        console.log('📱 Sending mobile upload to Pinata...');

        // Use fetch with longer timeout for mobile (increased for larger files)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes for mobile

        const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pinataJwt}`,
            },
            body: uploadFormData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('📱 Mobile Pinata response:', uploadResponse.status, uploadResponse.statusText);

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('📱 Mobile Pinata upload failed:', {
                status: uploadResponse.status,
                statusText: uploadResponse.statusText,
                errorText,
                fileSize: file.size
            });

            // Return more specific error for mobile
            return NextResponse.json({
                error: `Mobile upload failed: ${uploadResponse.status} - ${errorText}`,
                status: uploadResponse.status
            }, { status: uploadResponse.status });
        }

        const upload = await uploadResponse.json();
        console.log('📱 Mobile upload successful:', upload.IpfsHash);

        const result = {
            IpfsHash: upload.IpfsHash,
            PinSize: upload.PinSize,
            Timestamp: upload.Timestamp || new Date().toISOString(),
            platform: 'mobile'
        };

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.error('📱 Mobile upload timeout');
            return NextResponse.json({ error: 'Mobile upload timeout' }, { status: 408 });
        }

        console.error('📱 Mobile upload error:', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });
        return NextResponse.json({ error: 'Mobile upload failed' }, { status: 500 });
    }
}
