import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'Instagram URL is required' },
        { status: 400 }
      );
    }

    // Validate Instagram URL format
    const instagramRegex = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?(\?.*)?$/;
    if (!instagramRegex.test(url)) {
      return NextResponse.json(
        { error: 'Invalid Instagram URL format' },
        { status: 400 }
      );
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 120000); // 2 minutes timeout (same as video processing)

    try {
      const response = await fetch('https://raspberrypi.tail83ea3e.ts.net/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: `Download failed: ${response.status} - ${errorText}` },
          { status: response.status }
        );
      }

      const result = await response.json();

      if (result.status !== 'ok' || !result.cid) {
        return NextResponse.json(
          { error: result.error || 'Download failed - no media found' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        cid: result.cid,
        url: result.pinata_gateway || `https://ipfs.skatehive.app/ipfs/${result.cid}`,
        filename: result.filename,
        bytes: result.bytes
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Download request timed out' },
          { status: 408 }
        );
      }
      
      throw fetchError;
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
