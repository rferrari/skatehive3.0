import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;


  if (!address) {
    return NextResponse.json(
      { message: 'Address is required' },
      { status: 400 }
    );
  }

  try {
    const apiUrl = `https://pioneers.dev/api/v1/portfolio/${address}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; SkateHive/1.0)'
      }
    });
    

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      throw new Error('API did not return JSON data');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching portfolio:', error);

    // Return mock data for development purposes
    const mockData = {
      address,
      totalValue: 0,
      tokens: [],
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json(mockData);
  }
}
