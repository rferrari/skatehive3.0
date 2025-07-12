import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const headers = Object.fromEntries(request.headers.entries());
    const body = await request.json();

    // Detailed logging for debugging webhook delivery
    console.log('[FARCASTER WEBHOOK] Received event:', {
      event: body.event,
      payload: body,
      headers
    });

    // Handle different webhook events
    switch (body.event) {
      case 'frame_added':
        console.log('[FARCASTER WEBHOOK] User added Mini App:', body);
        break;
      case 'frame_removed':
        console.log('[FARCASTER WEBHOOK] User removed Mini App:', body);
        break;
      case 'notifications_enabled':
        console.log('[FARCASTER WEBHOOK] Notifications enabled:', body);
        break;
      case 'notifications_disabled':
        console.log('[FARCASTER WEBHOOK] Notifications disabled:', body);
        break;
      default:
        console.log('[FARCASTER WEBHOOK] Unknown event:', body.event, body);
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
