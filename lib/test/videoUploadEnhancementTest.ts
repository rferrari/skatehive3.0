/**
 * Test file to verify enhanced video upload functionality
 * This file demonstrates how the enhanced logging will work
 */

import { videoApiService } from '@/services/videoApiService';

// Example of how the enhanced upload options work
export async function testEnhancedVideoUpload() {
  // Mock file for testing
  const mockFile = new File(['test'], 'test-video.mp4', { type: 'video/mp4' });
  
  // Enhanced options that will be auto-detected in real usage
  const enhancedOptions = {
    creator: 'test_user',
    platform: 'web',
    deviceInfo: 'web/MacIntel/desktop',
    browserInfo: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    userHP: 150,
    viewport: '1920x1080',
    connectionType: '4g'
  };

  try {
    console.log('🎬 Starting enhanced video upload test...');
    
    // This will now send comprehensive device and user information
    const result = await videoApiService.uploadVideo(mockFile, enhancedOptions);
    
    console.log('✅ Upload successful with enhanced logging:', {
      cid: result.cid,
      gatewayUrl: result.gatewayUrl
    });
    
    return result;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}

// Example of device information that will be automatically collected
export function getDeviceInfoExample() {
  return {
    platform: 'web',
    deviceInfo: `web/${navigator.platform}/${navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'}`,
    browserInfo: navigator.userAgent.substring(0, 128),
    viewport: `${window.screen.width}x${window.screen.height}`,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    timestamp: new Date().toISOString()
  };
}

// Expected data that will be sent to video-worker API
export interface ExpectedVideoWorkerData {
  // Core video data
  video: File;
  creator: string;
  
  // Enhanced tracking fields (NEW)
  platform: string;           // 'web', 'mobile', 'desktop'
  deviceInfo: string;         // 'web/MacIntel/desktop'
  browserInfo: string;        // Browser user agent (truncated)
  userHP: string;            // '150'
  viewport: string;          // '1920x1080'
  connectionType: string;    // '4g', 'wifi', 'unknown'
  correlationId: string;     // '1693920000000-abc123def'
  
  // Optional fields
  thumbnailUrl?: string;
  sessionId?: string;
}

export default testEnhancedVideoUpload;
