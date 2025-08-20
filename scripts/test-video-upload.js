#!/usr/bin/env node

/**
 * Test script to verify video upload APIs work
 * Usage: node scripts/test-video-upload.js
 */

const fs = require('fs');
const path = require('path');

// Import fetch for Node.js < 18 compatibility
let fetch;
(async () => {
  if (typeof globalThis.fetch === 'undefined') {
    const { default: nodeFetch } = await import('node-fetch');
    fetch = nodeFetch;
  } else {
    fetch = globalThis.fetch;
  }
  
  await main();
})().catch(console.error);

async function testDirectAPICall() {
  console.log('🧪 Testing direct API calls...');
  
  // Test Raspberry Pi API
  try {
    const response = await fetch('https://raspberrypi.tail83ea3e.ts.net/health');
    const data = await response.json();
    console.log('✅ Raspberry Pi API:', response.status, data);
  } catch (error) {
    console.log('❌ Raspberry Pi API error:', error.message);
  }
  
  // Test Render API
  try {
    const response = await fetch('https://video-worker-e7s1.onrender.com/health');
    const data = await response.json();
    console.log('✅ Render API:', response.status, data);
  } catch (error) {
    console.log('❌ Render API error:', error.message);
  }
}

async function testCORSHeaders() {
  console.log('🔗 Testing CORS headers...');
  
  const apis = [
    'https://raspberrypi.tail83ea3e.ts.net/transcode',
    'https://video-worker-e7s1.onrender.com/transcode'
  ];
  
  for (const api of apis) {
    try {
      const response = await fetch(api, { method: 'OPTIONS' });
      console.log(`📡 ${api}:`, {
        status: response.status,
        cors: response.headers.get('Access-Control-Allow-Origin'),
        methods: response.headers.get('Access-Control-Allow-Methods')
      });
    } catch (error) {
      console.log(`❌ ${api} CORS test failed:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Video Upload API Test Suite\n');
  
  await testDirectAPICall();
  console.log('');
  await testCORSHeaders();
  
  console.log('\n✨ Test completed!');
  console.log('📝 If both APIs show green checkmarks, production uploads should work.');
  console.log('🔧 If you see red X marks, check your API server configuration.');
}
