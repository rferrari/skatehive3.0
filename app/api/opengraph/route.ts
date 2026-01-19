import { NextRequest, NextResponse } from 'next/server';
import { APP_CONFIG } from '@/config/app.config';

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  siteName?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid URL protocol');
    }

    // Fetch the HTML content with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': `Mozilla/5.0 (compatible; SkateHive/1.0; +${APP_CONFIG.BASE_URL})`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Extract OpenGraph data
    const ogData: OpenGraphData = {
      url: url,
    };

    // Extract title
    const titleMatch = html.match(/<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i) ||
                      html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) {
      ogData.title = titleMatch[1].trim();
    }

    // Extract description
    const descMatch = html.match(/<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i) ||
                      html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i);
    if (descMatch) {
      ogData.description = descMatch[1].trim();
    }

    // Extract image
    const imageMatch = html.match(/<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i);
    if (imageMatch) {
      let imageUrl = imageMatch[1].trim();
      // Handle relative URLs
      if (imageUrl.startsWith('/')) {
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      } else if (imageUrl.startsWith('//')) {
        imageUrl = `${urlObj.protocol}${imageUrl}`;
      }
      ogData.image = imageUrl;
    }

    // Extract site name
    const siteNameMatch = html.match(/<meta[^>]*property=["\']og:site_name["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i);
    if (siteNameMatch) {
      ogData.siteName = siteNameMatch[1].trim();
    } else {
      ogData.siteName = urlObj.hostname.replace('www.', '');
    }

    return NextResponse.json(ogData);
  } catch (error) {
    console.error('Error fetching OpenGraph data:', error);
    
    // Return fallback data
    try {
      const urlObj = new URL(url);
      const fallbackData: OpenGraphData = {
        title: urlObj.hostname.replace('www.', ''),
        description: url,
        url: url,
        siteName: urlObj.hostname.replace('www.', ''),
      };
      return NextResponse.json(fallbackData);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
  }
}
