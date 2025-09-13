#!/usr/bin/env node
/**
 * Test script to verify Mac Mini M4 is configured as primary for video processing
 * Run with: node test-video-priority.js
 */

const fs = require('fs');
const path = require('path');

// Read the videoProcessing.ts file
const videoProcessingPath = path.join(__dirname, 'lib/utils/videoProcessing.ts');
const content = fs.readFileSync(videoProcessingPath, 'utf8');

console.log('🧪 Testing Video Processing Priority Configuration...\n');

// Check for Mac Mini first
const macMiniFirst = content.includes('Mac Mini M4 (PRIMARY)') && 
                     content.indexOf('minivlad.tail9656d3.ts.net') < content.indexOf('raspberrypi.tail83ea3e.ts.net');

// Check for console logs
const hasDebugLogs = content.includes('🍎 Attempting Mac Mini M4 (PRIMARY)');

// Check for correct URL
const hasCorrectURL = content.includes('minivlad.tail9656d3.ts.net/video/transcode');

console.log('📋 Configuration Check Results:');
console.log(`✅ Mac Mini M4 listed as PRIMARY: ${macMiniFirst ? '✅ YES' : '❌ NO'}`);
console.log(`🍎 Debug logs present: ${hasDebugLogs ? '✅ YES' : '❌ NO'}`);
console.log(`🔗 Correct URL configured: ${hasCorrectURL ? '✅ YES' : '❌ NO'}`);

if (macMiniFirst && hasDebugLogs && hasCorrectURL) {
    console.log('\n🎉 Configuration is CORRECT - Mac Mini M4 should be primary!');
    console.log('\n💡 If you\'re still seeing Raspberry Pi first, check:');
    console.log('   1. Are you testing on the deployed app? Push changes to deploy.');
    console.log('   2. Clear browser cache (Cmd+Shift+R)');
    console.log('   3. Check browser console for the 🍎 log when uploading videos');
    console.log('   4. Restart your development server if testing locally');
} else {
    console.log('\n❌ Configuration needs fixes!');
}

// Extract the first server URL to confirm
const lines = content.split('\n');
const firstServerLine = lines.find(line => line.includes('minivlad.tail9656d3.ts.net/video/transcode'));
if (firstServerLine) {
    console.log(`\n🔍 First server configured: ${firstServerLine.trim()}`);
}