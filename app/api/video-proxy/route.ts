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
    const apiUrl = targetUrl || `https://video-worker-e7s1.onrender.com${endpoint}`;
    
    console.log(`🔗 Proxying request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 500 });
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
    const apiUrl = targetUrl || `https://video-worker-e7s1.onrender.com${endpoint}`;
    
    console.log(`🔗 Proxying POST request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

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
    console.error('POST Proxy error:', error);
    return NextResponse.json({ error: 'POST Proxy request failed' }, { status: 500 });
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
