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

    const rawData = await response.json();

    // Return the raw data structure for debugging
    return NextResponse.json({
      rawDataKeys: Object.keys(rawData),
      rawData: rawData,
      tokensStructure: rawData.tokens ? {
        type: Array.isArray(rawData.tokens) ? 'array' : typeof rawData.tokens,
        keys: typeof rawData.tokens === 'object' && !Array.isArray(rawData.tokens) ? Object.keys(rawData.tokens) : null,
        length: Array.isArray(rawData.tokens) ? rawData.tokens.length : null,
        sample: Array.isArray(rawData.tokens) ? rawData.tokens[0] : 
               typeof rawData.tokens === 'object' ? Object.values(rawData.tokens)[0] : null
      } : null
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
