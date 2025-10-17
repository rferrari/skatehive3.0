/**
 * Clean video processing service - Step 2
 */

export interface ProcessingResult {
  success: boolean;
  url?: string;
  hash?: string;
  error?: string;
}

/**
 * Enhanced processing options interface
 */
export interface EnhancedProcessingOptions {
  userHP?: number;
  platform?: string;
  deviceInfo?: string;
  browserInfo?: string;
  viewport?: string;
  connectionType?: string;
}

/**
 * Process non-MP4 video on server - try Raspberry Pi first, fallback to proxy for smaller files
 */
export async function processVideoOnServer(
  file: File,
  username: string = 'anonymous',
  enhancedOptions?: EnhancedProcessingOptions
): Promise<ProcessingResult> {

  console.log('🔄 Server processing started:', file.name);

  // Try Mac Mini M4 first (fastest processing with M4 chip)
  console.log('🍎 Attempting Mac Mini M4 (PRIMARY) - https://minivlad.tail9656d3.ts.net/video/transcode');
  const primaryResult = await tryServer(
    'https://minivlad.tail9656d3.ts.net/video/transcode',
    file,
    username,
    'Mac Mini M4 (Primary)',
    enhancedOptions
  );

  if (primaryResult.success) {
    console.log('✅ Mac Mini M4 succeeded - no need to try other servers');
    return primaryResult;
  }

  // If Mac Mini fails, try Raspberry Pi as secondary
  console.log('🫐 Mac Mini failed, trying Raspberry Pi (SECONDARY) - https://raspberrypi.tail83ea3e.ts.net/video/transcode');
  const secondaryResult = await tryServer(
    'https://raspberrypi.tail83ea3e.ts.net/video/transcode',
    file,
    username,
    'Raspberry Pi (Secondary)',
    enhancedOptions
  );

  if (secondaryResult.success) {
    console.log('✅ Raspberry Pi succeeded');
    return secondaryResult;
  }

  // If both fail and file is small enough, try Render via proxy
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB <= 4) { // Only use proxy for files 4MB or smaller
    console.log(`🔄 Primary failed, trying Render via proxy (file size: ${fileSizeMB.toFixed(1)}MB)`);

    const proxyUrl = '/api/video-proxy?url=' + encodeURIComponent('https://146-235-239-243.sslip.io/transcode');

    const proxyResult = await tryServer(
      proxyUrl,
      file,
      username,
      'Render (via Proxy)',
      enhancedOptions
    );

    if (proxyResult.success) {
      return proxyResult;
    }
  } else {
    console.log(`⚠️ File too large for proxy (${fileSizeMB.toFixed(1)}MB), skipping proxy fallback`);
  }

  // Return the most informative error (try secondary result first, then primary)
  return secondaryResult.error ? secondaryResult : primaryResult;
}

/**
 * Try processing on a specific server
 */
async function tryServer(
  serverUrl: string,
  file: File,
  username: string,
  serverName: string,
  enhancedOptions?: EnhancedProcessingOptions
): Promise<ProcessingResult> {

  try {
    console.log(`🔄 Trying ${serverName}...`);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('creator', username);

    // Add enhanced tracking information if provided
    if (enhancedOptions?.platform) {
      formData.append('platform', enhancedOptions.platform);
    }
    if (enhancedOptions?.userHP !== undefined) {
      formData.append('userHP', enhancedOptions.userHP.toString());
    }
    if (enhancedOptions?.deviceInfo) {
      formData.append('deviceInfo', enhancedOptions.deviceInfo);
    }
    if (enhancedOptions?.browserInfo) {
      formData.append('browserInfo', enhancedOptions.browserInfo);
    }
    if (enhancedOptions?.viewport) {
      formData.append('viewport', enhancedOptions.viewport);
    }
    if (enhancedOptions?.connectionType) {
      formData.append('connectionType', enhancedOptions.connectionType);
    }

    // Generate correlation ID for tracking
    const correlationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    formData.append('correlationId', correlationId);

    // Create abort controller for manual timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 120000); // 2 minute timeout for video processing

    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId); // Clear timeout if request completes

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`${serverName} failed:`, {
          status: response.status,
          error: errorText,
          creator: username
        });
        throw new Error(`${serverName} responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // Check if we have a valid IPFS response (cid or gatewayUrl indicates success)
      if (!result.cid && !result.gatewayUrl && !result.ipfsUrl) {
        throw new Error(result.error || `${serverName} processing failed - no valid URL returned`);
      }

      // Use Skatehive IPFS gateway for iframe embedding to avoid X-Frame-Options issues
      const hash = result.cid;
      const skateHiveUrl = `https://ipfs.skatehive.app/ipfs/${hash}`;

      console.log(`✅ ${serverName} processing successful`);

      return {
        success: true,
        url: skateHiveUrl,
        hash
      };
    } catch (error) {
      clearTimeout(timeoutId); // Clean up timeout in case of error

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`${serverName} request timed out`);
      }

      throw error; // Re-throw other errors
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `${serverName} failed`
    };
  }
}
