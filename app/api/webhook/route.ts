import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the webhook event for debugging
    console.log('Webhook received:', body);
    
    // Handle different webhook events
    switch (body.event) {
      case 'frame_added':
        // User added the Mini App
        console.log('User added Mini App:', body);
        break;
        
      case 'frame_removed':
        // User removed the Mini App
        console.log('User removed Mini App:', body);
        break;
        
      case 'notifications_enabled':
        // User enabled notifications
        console.log('Notifications enabled:', body);
        break;
        
      case 'notifications_disabled':
        // User disabled notifications
        console.log('Notifications disabled:', body);
        break;
        
      default:
        console.log('Unknown webhook event:', body.event);
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
