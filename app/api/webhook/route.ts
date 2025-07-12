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
        console.log('[FARCASTER WEBHOOK] User added Mini App:', decodedPayload);
        break;
      case 'frame_removed':
        console.log('[FARCASTER WEBHOOK] User removed Mini App:', decodedPayload);
        break;
      case 'notifications_enabled':
        console.log('[FARCASTER WEBHOOK] Notifications enabled:', decodedPayload);
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
