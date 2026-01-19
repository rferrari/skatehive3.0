import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// JWT secret for signing tokens
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
};

// Create JWT token for authenticated user
const createJWT = async (username: string) => {
  const secret = getJwtSecret();
  
  const jwt = await new SignJWT({
    username,
    type: 'hive_signup',
    iat: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  return jwt;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ott = searchParams.get('ott');

    if (!ott) {
      return NextResponse.json(
        { error: 'Missing one-time token (ott) parameter' },
        { status: 400 }
      );
    }

    // Lookup and validate OTT
    const { data: ottData, error: ottError } = await supabase
      .from('auth_ott')
      .select('*')
      .eq('token', ott)
      .is('consumed_at', null)
      .single();

    if (ottError || !ottData) {
      return NextResponse.json(
        { error: 'Invalid or expired one-time token' },
        { status: 401 }
      );
    }

    // Check if token has expired
    if (new Date(ottData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'One-time token has expired' },
        { status: 401 }
      );
    }

    // Consume the OTT (mark as used)
    const { error: consumeError } = await supabase
      .from('auth_ott')
      .update({
        consumed_at: new Date().toISOString(),
      })
      .eq('token', ott);

    if (consumeError) {
      console.error('Error consuming OTT:', consumeError);
      return NextResponse.json(
        { error: 'Failed to consume one-time token' },
        { status: 500 }
      );
    }

    // Create JWT for the authenticated user
    try {
      const jwt = await createJWT(ottData.username);
      
      // Create response with success and JWT
      const response = NextResponse.json({
        success: true,
        username: ottData.username,
        jwt,
        message: `Welcome to Skatehive, @${ottData.username}!`,
      });

      // Set JWT as httpOnly cookie for automatic authentication
      response.cookies.set('skatehive-auth', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours in seconds
        path: '/',
      });

      // Also set a client-readable cookie for the frontend to know user is logged in
      response.cookies.set('skatehive-user', ottData.username, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours in seconds
        path: '/',
      });

      return response;

    } catch (jwtError) {
      console.error('Error creating JWT:', jwtError);
      return NextResponse.json(
        { error: 'Failed to create authentication token' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('OTT authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}

// Also support POST method for consistency
export async function POST(request: NextRequest) {
  try {
    const { ott } = await request.json();
    
    if (!ott) {
      return NextResponse.json(
        { error: 'Missing one-time token (ott) in request body' },
        { status: 400 }
      );
    }

    // Create a new URL with the ott as a search parameter and call GET method
    const url = new URL(request.url);
    url.searchParams.set('ott', ott);
    
    const newRequest = new NextRequest(url, {
      method: 'GET',
      headers: request.headers,
    });

    return GET(newRequest);
    
  } catch (error) {
    console.error('OTT POST error:', error);
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }
}