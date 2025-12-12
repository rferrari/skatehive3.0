/**
 * Clean video processing service - Step 2
 */

export interface ProcessingResult {
  success: boolean;
  url?: string;
  hash?: string;
  error?: string;
  /** Which server(s) failed: 'oracle' | 'macmini' | 'pi' | 'all' */
  failedServer?: 'oracle' | 'macmini' | 'pi' | 'all';
  /** HTTP status code if applicable */
  statusCode?: number;
  /** Error type: 'connection' | 'timeout' | 'server_error' | 'upload_rejected' | 'file_too_large' | 'unknown' */
  errorType?: 'connection' | 'timeout' | 'server_error' | 'upload_rejected' | 'file_too_large' | 'unknown';
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
  onProgress?: (progress: number, stage: string) => void;
}

/**
 * Process non-MP4 video on server - try Mac Mini first (has SSE progress), fallback to Oracle, then Pi
 */
export async function processVideoOnServer(
  file: File,
  username: string = 'anonymous',
  enhancedOptions?: EnhancedProcessingOptions
): Promise<ProcessingResult> {

  console.log('🔄 Server processing started:', file.name);

  // PRIMARY: Mac Mini M4 (has real-time SSE progress streaming)
  console.log('🍎 Attempting Mac Mini M4 (PRIMARY) - https://minivlad.tail9656d3.ts.net/video/transcode');
  const primaryResult = await tryServer(
    'https://minivlad.tail9656d3.ts.net/video',
    file,
    username,
    'Mac Mini M4 (Primary)',
    enhancedOptions
  );

  if (primaryResult.success) {
    console.log('✅ Mac Mini succeeded - no need to try other servers');
    return primaryResult;
  }

  // SECONDARY: Oracle Cloud (needs SSE update)
  console.log('🔮 Mac Mini failed, trying Oracle (SECONDARY) - https://146-235-239-243.sslip.io/transcode');
  const secondaryResult = await tryServer(
    'https://146-235-239-243.sslip.io',
    file,
    username,
    'Oracle (Secondary)',
    enhancedOptions
  );

  if (secondaryResult.success) {
    console.log('✅ Oracle succeeded');
    return secondaryResult;
  }

  // TERTIARY: Raspberry Pi (backup)
  console.log('🫐 Oracle failed, trying Raspberry Pi (TERTIARY) - https://vladsberry.tail83ea3e.ts.net/video/transcode');
  const tertiaryResult = await tryServer(
    'https://vladsberry.tail83ea3e.ts.net/video',
    file,
    username,
    'Raspberry Pi (Tertiary)',
    enhancedOptions
  );

  if (tertiaryResult.success) {
    console.log('✅ Raspberry Pi succeeded');
    return tertiaryResult;
  }

  // All servers failed - return the most informative error with 'all' indicator
  console.error('❌ All transcoding servers failed!');
  const bestError = tertiaryResult.error ? tertiaryResult : (secondaryResult.error ? secondaryResult : primaryResult);
  return {
    ...bestError,
    failedServer: 'all' // Override to indicate complete failure
  };
}

/**
 * Try processing on a specific server with SSE progress streaming
 */
async function tryServer(
  serverBaseUrl: string,
  file: File,
  username: string,
  serverName: string,
  enhancedOptions?: EnhancedProcessingOptions
): Promise<ProcessingResult> {
  // Extract server identifier from serverName
  const serverKey = serverName.toLowerCase().includes('oracle') ? 'oracle' :
                    serverName.toLowerCase().includes('mac') ? 'macmini' : 'pi';

  // Determine endpoint paths based on server
  const transcodeUrl = serverBaseUrl.includes('sslip.io') 
    ? `${serverBaseUrl}/transcode`  // Oracle uses /transcode
    : `${serverBaseUrl}/transcode`; // Others use /video/transcode but we changed base URL

  let eventSource: EventSource | null = null;

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

    // Generate correlation ID for tracking AND for SSE progress
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
    formData.append('correlationId', requestId);

    // Start SSE listener for progress updates BEFORE sending request
    if (enhancedOptions?.onProgress) {
      const progressUrl = serverBaseUrl.includes('sslip.io')
        ? `${serverBaseUrl}/progress/${requestId}`
        : `${serverBaseUrl}/progress/${requestId}`;
      
      try {
        eventSource = new EventSource(progressUrl);
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log(`📊 [${serverName}] Progress: ${data.progress}% - ${data.stage}`);
            enhancedOptions.onProgress?.(data.progress, data.stage);
          } catch {
            // Ignore parse errors
          }
        };
        eventSource.onerror = () => {
          // SSE errors are non-fatal, just log
          console.log(`⚠️ SSE connection issue for ${serverName}`);
        };
      } catch {
        // SSE not supported or failed to connect - continue without progress
        console.log(`⚠️ SSE not available for ${serverName}, continuing without progress`);
      }
    }

    // Create abort controller for manual timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 300000); // 5 minute timeout for video processing (increased for large files)

    try {
      const response = await fetch(transcodeUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`${serverName} failed:`, {
          status: response.status,
          error: errorText,
          creator: username
        });
        
        let errorType: ProcessingResult['errorType'] = 'server_error';
        if (response.status === 403) {
          errorType = 'upload_rejected';
        } else if (response.status === 413) {
          errorType = 'file_too_large';
        } else if (response.status >= 500) {
          errorType = 'server_error';
        }
        
        throw {
          message: `${serverName} responded with ${response.status}: ${errorText}`,
          statusCode: response.status,
          errorType,
          failedServer: serverKey
        };
      }

      const result = await response.json();

      if (!result.cid && !result.gatewayUrl && !result.ipfsUrl) {
        throw new Error(result.error || `${serverName} processing failed - no valid URL returned`);
      }

      const hash = result.cid;
      const skateHiveUrl = `https://ipfs.skatehive.app/ipfs/${hash}`;

      console.log(`✅ ${serverName} processing successful`);
      
      // Final progress update
      enhancedOptions?.onProgress?.(100, 'complete');

      return {
        success: true,
        url: skateHiveUrl,
        hash
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw {
          message: `${serverName} request timed out`,
          errorType: 'timeout' as const,
          failedServer: serverKey
        };
      }

      throw error;
    }
  } catch (error) {
    // Handle custom error objects with extended info
    if (error && typeof error === 'object' && 'message' in error) {
      const customError = error as { message: string; statusCode?: number; errorType?: ProcessingResult['errorType']; failedServer?: string };
      return {
        success: false,
        error: customError.message,
        statusCode: customError.statusCode,
        errorType: customError.errorType || 'unknown',
        failedServer: serverKey
      };
    }
    
    // Handle connection errors
    if (error instanceof Error) {
      const isConnectionError = error.message.includes('Failed to fetch') || 
                                error.message.includes('NetworkError') ||
                                error.message.includes('net::ERR');
      return {
        success: false,
        error: error.message,
        errorType: isConnectionError ? 'connection' : 'unknown',
        failedServer: serverKey
      };
    }
    
    return {
      success: false,
      error: `${serverName} failed`,
      errorType: 'unknown',
      failedServer: serverKey
    };
  } finally {
    // Clean up SSE connection
    if (eventSource) {
      eventSource.close();
    }
  }
}
