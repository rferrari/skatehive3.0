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

  // Try Oracle first (highest priority)
  console.log('🔮 Attempting Oracle (PRIMARY) - https://146-235-239-243.sslip.io/transcode');
  const primaryResult = await tryServer(
    'https://146-235-239-243.sslip.io/transcode',
    file,
    username,
    'Oracle (Primary)',
    enhancedOptions
  );

  if (primaryResult.success) {
    console.log('✅ Oracle succeeded - no need to try other servers');
    return primaryResult;
  }

  // If Oracle fails, try Mac Mini M4 as secondary
  console.log('🍎 Oracle failed, trying Mac Mini M4 (SECONDARY) - https://minivlad.tail9656d3.ts.net/video/transcode');
  const secondaryResult = await tryServer(
    'https://minivlad.tail9656d3.ts.net/video/transcode',
    file,
    username,
    'Mac Mini M4 (Secondary)',
    enhancedOptions
  );

  if (secondaryResult.success) {
    console.log('✅ Mac Mini M4 succeeded');
    return secondaryResult;
  }

  // If both fail, try Raspberry Pi as tertiary
  console.log('🫐 Mac Mini failed, trying Raspberry Pi (TERTIARY) - https://vladsberry.tail83ea3e.ts.net/video/transcode');
  const tertiaryResult = await tryServer(
    'https://vladsberry.tail83ea3e.ts.net/video/transcode',
    file,
    username,
    'Raspberry Pi (Tertiary)',
    enhancedOptions
  );

  if (tertiaryResult.success) {
    console.log('✅ Raspberry Pi succeeded');
    return tertiaryResult;
  }

  // Return the most informative error (try tertiary result first, then secondary, then primary)
  return tertiaryResult.error ? tertiaryResult : (secondaryResult.error ? secondaryResult : primaryResult);
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
