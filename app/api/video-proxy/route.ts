import { NextRequest, NextResponse } from 'next/server';

// Proxy endpoint to bypass CORS for video API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const targetUrl = searchParams.get('url');
    
    if (!endpoint && !targetUrl) {
      return NextResponse.json({ error: 'Missing endpoint or url parameter' }, { status: 400 });
    }

    // Support both endpoint-based and full URL proxying
    const apiUrl = targetUrl || `https://skatehive-transcoder.onrender.com${endpoint}`;
    
    console.log(`🔗 Proxying request to: ${apiUrl}`);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏰ Proxy request timeout for: ${apiUrl}`);
      controller.abort();
    }, 10000); // 10 second timeout

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Proxy request failed';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const targetUrl = searchParams.get('url');
    
    if (!endpoint && !targetUrl) {
      return NextResponse.json({ error: 'Missing endpoint or url parameter' }, { status: 400 });
    }

    const formData = await request.formData();
    
    // Support both endpoint-based and full URL proxying
    const apiUrl = targetUrl || `https://skatehive-transcoder.onrender.com${endpoint}`;
    
    console.log(`🔗 Proxying POST request to: ${apiUrl}`);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏰ Proxy POST request timeout for: ${apiUrl}`);
      controller.abort();
    }, 300000); // 5 minute timeout for file uploads

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error) {
    console.error('Proxy POST error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Proxy request failed';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
