import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const headers = Object.fromEntries(request.headers.entries());
    let body;
    try {
      body = await request.json();
    } catch (err) {
      console.warn('[FARCASTER WEBHOOK] Invalid JSON:', err);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Validate Farcaster payload structure
    if (!body || typeof body.payload !== 'string') {
      console.warn('[FARCASTER WEBHOOK] Invalid Farcaster payload:', body);
      return NextResponse.json({ error: 'Invalid Farcaster webhook format' }, { status: 400 });
    }

    // Decode base64 payload
    let decodedPayload;
    try {
      const jsonStr = Buffer.from(body.payload, 'base64').toString('utf8');
      decodedPayload = JSON.parse(jsonStr);
    } catch (err) {
      console.warn('[FARCASTER WEBHOOK] Failed to decode payload:', err, body.payload);
      return NextResponse.json({ error: 'Failed to decode Farcaster payload' }, { status: 400 });
    }

    // Validate event
    if (!decodedPayload || typeof decodedPayload.event !== 'string') {
      console.warn('[FARCASTER WEBHOOK] Invalid decoded payload:', decodedPayload);
      return NextResponse.json({ error: 'Invalid event in Farcaster payload' }, { status: 400 });
    }

    // Detailed logging for debugging webhook delivery
    console.log('[FARCASTER WEBHOOK] Received event:', {
      event: decodedPayload.event,
      payload: decodedPayload,
      headers,
      raw: body
    });

    // Handle different webhook events
    switch (decodedPayload.event) {
      case 'frame_added':
      case 'notifications_enabled': {
        // Store Farcaster token and notification URL in DB
        const notificationDetails = decodedPayload.notificationDetails;
        if (notificationDetails && notificationDetails.token && notificationDetails.url) {
          // Try to extract FID and username from header if available
          let fid = null;
          let username = null;
          try {
            const headerJson = JSON.parse(Buffer.from(body.header, 'base64').toString('utf8'));
            fid = headerJson.fid || null;
            username = headerJson.username || null;
          } catch (err) {
            console.warn('[FARCASTER WEBHOOK] Failed to decode header for FID/username:', err);
          }
          // Import token store factory
          const { getTokenStore } = await import('@/lib/farcaster/token-store-factory');
          const tokenStore = getTokenStore();
          await tokenStore.addToken(
            fid || '',
            username || '',
            notificationDetails.token,
            notificationDetails.url
          );
          console.log('[FARCASTER WEBHOOK] Stored token for user:', { fid, username, notificationDetails });
        } else {
          console.warn('[FARCASTER WEBHOOK] Missing notificationDetails for event:', decodedPayload);
        }
        break;
      }
      case 'frame_removed':
        console.log('[FARCASTER WEBHOOK] User removed Mini App:', decodedPayload);
        break;
      case 'notifications_disabled':
        console.log('[FARCASTER WEBHOOK] Notifications disabled:', decodedPayload);
        break;
      default:
        console.log('[FARCASTER WEBHOOK] Unknown event:', decodedPayload.event, decodedPayload);
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Webhook endpoint is active' },
    { status: 200 }
  );
}
