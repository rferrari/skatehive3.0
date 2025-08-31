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

    const rawData = await response.json();

    // Try different ways to extract tokens
    const addressLower = address.toLowerCase();
    let rawTokens = [];
    
    if (Array.isArray(rawData.tokens)) {
      rawTokens = rawData.tokens;
    } else if (rawData.tokens && typeof rawData.tokens === 'object') {
      rawTokens = rawData.tokens[addressLower] || 
                  rawData.tokens[address] || 
                  rawData.tokens[address.toUpperCase()] || [];
    }
    
    if (rawTokens.length === 0 && rawData.balances) {
      if (rawData.balances[addressLower]) {
        rawTokens = rawData.balances[addressLower];
      }
    }
    
    if (rawTokens.length === 0) {
      if (rawData.data && rawData.data.tokens) {
        rawTokens = rawData.data.tokens;
      } else if (rawData.result && rawData.result.tokens) {
        rawTokens = rawData.result.tokens;
      }
    }
    
    const apps = rawData.apps || [];
    const nftNetWorth = rawData.nftNetWorth?.[addressLower] || 0;

    // Calculate totals from the nested token data
    const totalBalanceUsdTokens = rawTokens.reduce((sum: number, token: any) => {
      const tokenData = token.token || token;
      const balanceUSD = parseFloat(tokenData.balanceUSD || token.balanceUSD || 0);
      return sum + balanceUSD;
    }, 0);

    const totalBalanceUSDApp = apps.reduce((sum: number, app: any) => {
      return sum + (app.balanceUSD || 0);
    }, 0);

    const totalNetWorth = totalBalanceUsdTokens + totalBalanceUSDApp + nftNetWorth;

    // Transform to our expected format
    const transformedData = {
      totalNetWorth,
      totalBalanceUsdTokens,
      totalBalanceUSDApp,
      nftUsdNetWorth: { [addressLower]: nftNetWorth.toString() },
      tokens: rawTokens.map((token: any) => {
        // The external API has nested token structure: token.token contains the actual token data
        const tokenData = token.token || token;
        
        // Extract actual token address (not the wallet address)
        const tokenAddress = tokenData.address || token.address || '';
        
        // Use the key as fallback identifier if available
        const tokenId = token.key || tokenData.id || tokenAddress;
        
        return {
          address: tokenAddress,
          assetCaip: token.assetCaip || '',
          key: tokenId,
          network: token.network || tokenData.network || 'ethereum',
          token: {
            address: tokenAddress,
            balance: parseFloat(tokenData.balance || 0),
            balanceRaw: tokenData.balanceRaw || '0',
            balanceUSD: parseFloat(tokenData.balanceUSD || 0),
            canExchange: tokenData.canExchange || false,
            coingeckoId: tokenData.coingeckoId || '',
            createdAt: tokenData.createdAt || new Date().toISOString(),
            decimals: parseInt(tokenData.decimals || 18),
            externallyVerified: tokenData.externallyVerified || false,
            hide: tokenData.hide || false,
            holdersEnabled: tokenData.holdersEnabled || false,
            id: tokenId,
            label: tokenData.label || null,
            name: tokenData.name || tokenData.symbol || 'Unknown Token',
            networkId: parseInt(tokenData.networkId || 1),
            price: parseFloat(tokenData.price || 0),
            priceUpdatedAt: tokenData.priceUpdatedAt || new Date().toISOString(),
            status: tokenData.status || 'active',
            symbol: tokenData.symbol || 'UNKNOWN',
            totalSupply: tokenData.totalSupply || '0',
            updatedAt: tokenData.updatedAt || new Date().toISOString(),
            verified: tokenData.verified || false,
          },
          updatedAt: token.updatedAt || new Date().toISOString(),
        };
      }),
      nfts: [],
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error fetching portfolio:', error);

    // Return properly formatted mock data for development purposes
    const mockData = {
      totalNetWorth: 0,
      totalBalanceUsdTokens: 0,
      totalBalanceUSDApp: 0,
      nftUsdNetWorth: {},
      tokens: [],
      nfts: [],
    };
    
    return NextResponse.json(mockData);
  }
}
