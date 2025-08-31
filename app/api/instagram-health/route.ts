import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 5000); // 5 seconds timeout for health check

    try {
      // Use the correct health endpoint
      const response = await fetch('https://raspberrypi.tail83ea3e.ts.net/health', {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Check if the response indicates the server is ok
        const isHealthy = data.status === 'ok';
        
        return NextResponse.json({
          healthy: isHealthy,
          status: response.status,
          timestamp: new Date().toISOString()
        });
      } else {
        return NextResponse.json({
          healthy: false,
          status: response.status,
          error: 'Server returned error status',
          timestamp: new Date().toISOString()
        });
      }

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json({
          healthy: false,
          error: 'Server timeout',
          timestamp: new Date().toISOString()
        });
      }
      
      return NextResponse.json({
        healthy: false,
        error: 'Server unreachable',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Instagram server health check error:', error);
    return NextResponse.json({
      healthy: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
}
