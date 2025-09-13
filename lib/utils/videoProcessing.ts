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
 * Process non-MP4 video on server
 */
export async function processVideoOnServer(
  file: File,
  username: string = 'anonymous',
  enhancedOptions?: EnhancedProcessingOptions
): Promise<ProcessingResult> {

  console.log('🔄 Server processing started:', file.name);

  // Try Raspberry Pi (primary) server first
  const primaryResult = await tryServer(
    'https://raspberrypi.tail83ea3e.ts.net/transcode/transcode',
    file,
    username,
    'Raspberry Pi (Primary)',
    enhancedOptions
  );

  if (primaryResult.success) {
    return primaryResult;
  }

  // Try Render (fallback) server
  const fallbackResult = await tryServer(
    'https://skatehive-transcoder.onrender.com/transcode',
    file,
    username,
    'Render (Fallback)',
    enhancedOptions
  );

  return fallbackResult;
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
