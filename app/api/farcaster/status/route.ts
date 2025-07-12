import { NextRequest, NextResponse } from 'next/server';
import { farcasterTokenStore } from '@/lib/farcaster/token-store';

export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://skatehive.app';

    // Check if manifest is accessible
    let manifestStatus = 'Unknown';
    try {
        const manifestResponse = await fetch(`${baseUrl}/.well-known/farcaster.json`);
        if (manifestResponse.ok) {
            const manifest = await manifestResponse.json();
            manifestStatus = manifest.miniapp?.name === 'SkateHive' ? 'Valid' : 'Invalid structure';
        } else {
            manifestStatus = `HTTP ${manifestResponse.status}`;
        }
    } catch (error) {
        manifestStatus = 'Error fetching';
    }

    // Check webhook endpoint
    let webhookStatus = 'Unknown';
    try {
        const webhookResponse = await fetch(`${baseUrl}/api/farcaster/webhook`);
        webhookStatus = webhookResponse.ok ? 'Accessible' : `HTTP ${webhookResponse.status}`;
    } catch (error) {
        webhookStatus = 'Error accessing';
    }

    // Get current token store state
    const activeTokens = farcasterTokenStore.getActiveTokens();
    const allTokens = farcasterTokenStore.getAllTokens();

  const status = {
    timestamp: new Date().toISOString(),
    baseUrl,
    storage: {
      type: process.env.DATABASE_URL ? 'database' : 'in-memory',
      persistent: !!process.env.DATABASE_URL,
      warning: !process.env.DATABASE_URL ? 'IN-MEMORY STORAGE: All tokens will be lost on restart!' : undefined,
    },
    manifest: {
      url: `${baseUrl}/.well-known/farcaster.json`,
      status: manifestStatus,
    },
    webhook: {
      url: `${baseUrl}/api/farcaster/webhook`,
      status: webhookStatus,
    },
    tokenStore: {
      totalTokens: allTokens.length,
      activeTokens: activeTokens.length,
      linkedUsers: activeTokens.filter(t => t.hiveUsername).length,
    },
    endpoints: {
      link: `${baseUrl}/api/farcaster/link`,
      notify: `${baseUrl}/api/farcaster/notify`,
      status: `${baseUrl}/api/farcaster/status`,
      testWebhook: `${baseUrl}/api/farcaster/test-webhook`,
    },
    setup: {
      manifestAccessible: manifestStatus === 'Valid',
      webhookAccessible: webhookStatus === 'Accessible',
      hasTokens: activeTokens.length > 0,
      hasLinkedUsers: activeTokens.filter(t => t.hiveUsername).length > 0,
      databaseRequired: !process.env.DATABASE_URL,
    }
  };

  const allGood = Object.values(status.setup).every(Boolean) && !status.setup.databaseRequired;

  return NextResponse.json({
    ready: allGood,
    status,
    nextSteps: allGood ? [
      'System is ready for production!',
      'Users can add SkateHive as a Farcaster miniapp',
      'Use /api/farcaster/link to link Hive users to Farcaster FIDs',
      'Test notifications with /api/farcaster/notify'
    ] : [
      !status.setup.manifestAccessible && 'Fix Farcaster manifest accessibility',
      !status.setup.webhookAccessible && 'Fix webhook endpoint accessibility',
      status.setup.databaseRequired && '🚨 CRITICAL: Set up database storage before production (see docs/DATABASE_SETUP.md)',
      !status.setup.hasTokens && 'No Farcaster tokens yet (expected for new setup)',
      !status.setup.hasLinkedUsers && 'No linked users yet (expected for new setup)',
    ].filter(Boolean),
        testCommands: {
            linkUser: `curl -X POST ${baseUrl}/api/farcaster/link -H "Content-Type: application/json" -d '{"fid": "YOUR_FID", "hiveUsername": "YOUR_HIVE_USERNAME"}'`,
            sendTest: `curl -X POST ${baseUrl}/api/farcaster/notify -H "Content-Type: application/json" -d '{"title": "Test", "body": "Test notification", "targetUsers": ["YOUR_HIVE_USERNAME"]}'`,
            checkStatus: `curl ${baseUrl}/api/farcaster/status`,
        }
    });
}
