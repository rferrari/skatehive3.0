import { NextRequest, NextResponse } from 'next/server';
import { HIVE_CONFIG } from '@/config/app.config';
import { uploadLimiter, getClientIP } from '@/lib/utils/rate-limiter';

/**
 * API route to proxy image uploads to images.hive.blog
 * Solves CORS issues when uploading from client-side
 */
export async function POST(request: NextRequest) {
  console.log('[Image Upload Proxy] Request received');
  
  // Rate limiting check
  const ip = getClientIP(request);
  const { allowed, remaining, resetIn } = uploadLimiter.check(ip);

  if (!allowed) {
    console.warn('[Image Upload Proxy] Rate limit exceeded for IP:', ip);
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
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const signature = formData.get('signature') as string;
    
    if (!file || !signature) {
      console.error('[Image Upload Proxy] Missing file or signature');
      return NextResponse.json(
        { error: 'Missing file or signature' },
        { status: 400 }
      );
    }

    // Validate file size (max 15MB)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('[Image Upload Proxy] File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large. Maximum size: 15MB' },
        { status: 413 }
      );
    }

    console.log('[Image Upload Proxy] Uploading to images.hive.blog:', {
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      signatureUser: HIVE_CONFIG.APP_ACCOUNT,
      ip
    });

    // Create new FormData for Hive upload
    const hiveFormData = new FormData();
    hiveFormData.append('file', file, file.name);

    // Upload to images.hive.blog via server-side (no CORS)
    const uploadUrl = `https://images.hive.blog/${HIVE_CONFIG.APP_ACCOUNT}/${signature}`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: hiveFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[Image Upload Proxy] Hive upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        errorText
      });
      throw new Error(`Hive upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const result = await uploadResponse.json();
    console.log('[Image Upload Proxy] Upload successful:', result.url);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Image Upload Proxy] Error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
