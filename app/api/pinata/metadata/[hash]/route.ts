import { NextResponse } from 'next/server';

// Simple in-memory cache for metadata (consider Redis for production)
const metadataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function GET(
    request: Request,
    { params }: { params: Promise<{ hash: string }> }
) {
    const pinataJwt = process.env.PINATA_JWT;

    if (!pinataJwt) {
        return NextResponse.json({ error: 'Pinata credentials not configured' }, { status: 500 });
    }

    try {
        const { hash } = await params;

        // Input validation
        if (!hash || typeof hash !== 'string' || hash.length < 10) {
            return NextResponse.json({ error: 'Invalid hash format' }, { status: 400 });
        }

        // Check cache first
        const cached = metadataCache.get(hash);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            const response = NextResponse.json(cached.data);
            // Add cache headers
            response.headers.set('Cache-Control', 'public, max-age=900'); // 15 minutes
            response.headers.set('X-Cache', 'HIT');
            return response;
        }

        // Use legacy API to get pin information with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`https://api.pinata.cloud/data/pinList?hashContains=${hash}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${pinataJwt}`,
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 404) {
                // Cache 404 responses to avoid repeated requests
                const notFoundData = { error: 'Hash not found' };
                metadataCache.set(hash, { data: notFoundData, timestamp: Date.now() });
                return NextResponse.json(notFoundData, { status: 404 });
            }
            return NextResponse.json({ error: 'Failed to fetch metadata from Pinata' }, { status: response.status });
        }

        const data = await response.json();

        // Find the file with the exact hash match
        const file = data.rows?.find((f: any) => f.ipfs_pin_hash === hash);

        if (!file) {
            const notFoundData = { error: 'Hash not found' };
            // Cache negative results
            metadataCache.set(hash, { data: notFoundData, timestamp: Date.now() });
            return NextResponse.json(notFoundData, { status: 404 });
        }

        // Prepare response data
        const responseData = {
            name: file.metadata?.name || 'Unknown',
            keyvalues: file.metadata?.keyvalues || {},
            id: file.id,
            cid: file.ipfs_pin_hash,
            size: file.size,
            createdAt: file.date_pinned,
        };

        // Cache the successful result
        metadataCache.set(hash, { data: responseData, timestamp: Date.now() });

        // Create response with caching headers
        const nextResponse = NextResponse.json(responseData);
        nextResponse.headers.set('Cache-Control', 'public, max-age=900'); // 15 minutes
        nextResponse.headers.set('X-Cache', 'MISS');

        // Add CORS headers if needed
        nextResponse.headers.set('Access-Control-Allow-Origin', '*');
        nextResponse.headers.set('Access-Control-Allow-Methods', 'GET');
        nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');

        return nextResponse;

    } catch (error) {
        console.error('Failed to fetch metadata:', error);

        if (error instanceof Error && error.name === 'AbortError') {
            return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Clean up old cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of metadataCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            metadataCache.delete(key);
        }
    }
}, 60000); // Clean every minute
