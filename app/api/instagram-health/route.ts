import { NextRequest, NextResponse } from 'next/server';

const INSTAGRAM_SERVERS = [
  'https://raspberrypi.tail83ea3e.ts.net',
  'https://skate-insta.onrender.com'
];

async function checkServerHealth(serverUrl: string): Promise<{ healthy: boolean; status?: number; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 5000); // 5 seconds timeout per server

  try {
    // Try health endpoint first
    let response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    });

    // If health endpoint doesn't exist, try root endpoint
    if (!response.ok && response.status === 404) {
      response = await fetch(serverUrl, {
        method: 'GET',
        signal: controller.signal
      });
    }

    clearTimeout(timeoutId);

    if (response.ok) {
      try {
        const data = await response.json();
        // Check if the response indicates the server is ok
        const isHealthy = data.status === 'ok' || response.status === 200;
        return { healthy: isHealthy, status: response.status };
      } catch {
        // If JSON parsing fails but response is ok, consider it healthy
        return { healthy: true, status: response.status };
      }
    } else {
      return { healthy: false, status: response.status, error: 'Server returned error status' };
    }

  } catch (fetchError) {
    clearTimeout(timeoutId);
    
    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
      return { healthy: false, error: 'Server timeout' };
    }
    
    return { healthy: false, error: 'Server unreachable' };
  }
}

export async function GET() {
  try {
    // Check all servers in parallel
    const healthChecks = await Promise.allSettled(
      INSTAGRAM_SERVERS.map(server => checkServerHealth(server))
    );

    const results = healthChecks.map((result, index) => ({
      server: INSTAGRAM_SERVERS[index],
      ...(result.status === 'fulfilled' ? result.value : { healthy: false, error: 'Check failed' })
    }));

    // At least one server should be healthy
    const hasHealthyServer = results.some(result => result.healthy);
    const healthyServers = results.filter(result => result.healthy);

    return NextResponse.json({
      healthy: hasHealthyServer,
      servers: results,
      healthyCount: healthyServers.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      healthy: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
}
