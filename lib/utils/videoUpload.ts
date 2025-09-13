/**
 * Clean video upload utilities - Step 1
 */

export interface UploadResult {
  success: boolean;
  url?: string;
  hash?: string;
  error?: string;
}

/**
 * Check if file is MP4
 */
export function isMP4(file: File): boolean {
  return file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
}

/**
 * Validate video file
 */
export function validateVideo(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith('video/')) {
    return { valid: false, error: 'File must be a video' };
  }
  
  // Basic size check (150MB limit for now)
  const maxSize = 150 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large (max 150MB)' };
  }
  
  // Warn about large files that may process slowly
  const slowProcessingSize = 20 * 1024 * 1024; // 20MB
  if (file.size > slowProcessingSize) {
    console.warn(`⚠️ Large video file (${(file.size / 1024 / 1024).toFixed(1)}MB) - processing may take 2-3 minutes`);
  }
  
  return { valid: true };
}

/**
 * Enhanced upload options interface
 */
export interface EnhancedUploadOptions {
  userHP?: number;
  platform?: string;
  deviceInfo?: string;
  browserInfo?: string;
  viewport?: string;
  connectionType?: string;
}

/**
 * Get detailed device information for better logging
 */
export function getDetailedDeviceInfo(): {
  platform: string;
  deviceInfo: string;
  browserInfo: string;
  viewport: string;
  connectionType: string;
} {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  
  // Detect device type
  let deviceType = 'desktop';
  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = 'mobile';
    if (/iPad/i.test(ua)) deviceType = 'tablet';
  }
  
  // Detect OS
  let os = 'unknown';
  if (/Mac/i.test(platform)) os = 'macOS';
  else if (/Win/i.test(platform)) os = 'Windows';
  else if (/Linux/i.test(platform)) os = 'Linux';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  
  // Detect browser
  let browser = 'unknown';
  if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edge|Edg/i.test(ua)) browser = 'Edge';
  
  return {
    platform: deviceType,
    deviceInfo: `${deviceType}/${os}/${browser}`,
    browserInfo: `${browser} on ${os}`,
    viewport: `${window.screen.width}x${window.screen.height}`,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown'
  };
}

/**
 * Upload video directly to IPFS (for MP4 files)
 */
export async function uploadToIPFS(
  file: File, 
  username: string = 'anonymous',
  enhancedOptions?: EnhancedUploadOptions
): Promise<UploadResult> {
  try {
    // Auto-detect device info if not provided
    const deviceData = enhancedOptions ? {
      platform: enhancedOptions.platform || 'web',
      deviceInfo: enhancedOptions.deviceInfo || 'unknown',
      browserInfo: enhancedOptions.browserInfo || 'unknown',
      viewport: enhancedOptions.viewport || `${window.screen.width}x${window.screen.height}`,
      connectionType: enhancedOptions.connectionType || 'unknown'
    } : getDetailedDeviceInfo();

    console.log('📤 IPFS upload started:', file.name);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('creator', username);

    // Add enhanced tracking information
    formData.append('platform', deviceData.platform);
    formData.append('deviceInfo', deviceData.deviceInfo);
    formData.append('browserInfo', deviceData.browserInfo);
    formData.append('viewport', deviceData.viewport);
    
    if (enhancedOptions?.userHP !== undefined) {
      formData.append('userHP', enhancedOptions.userHP.toString());
    }
    
    if (deviceData.connectionType !== 'unknown') {
      formData.append('connectionType', deviceData.connectionType);
    }
    
    // Generate correlation ID for tracking if not provided
    const correlationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    formData.append('correlationId', correlationId);

    const response = await fetch('/api/pinata', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.IpfsHash) {
      throw new Error('No IPFS hash returned');
    }

    console.log('✅ IPFS upload successful');

    const ipfsUrl = `https://ipfs.skatehive.app/ipfs/${result.IpfsHash}`;

    return {
      success: true,
      url: ipfsUrl,
      hash: result.IpfsHash
    };

  } catch (error) {
    console.error('❌ IPFS upload failed:', {
      creator: username,
      deviceInfo: enhancedOptions ? (enhancedOptions.deviceInfo || getDetailedDeviceInfo().deviceInfo) : getDetailedDeviceInfo().deviceInfo,
      error: error instanceof Error ? error.message : 'Upload failed'
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}
