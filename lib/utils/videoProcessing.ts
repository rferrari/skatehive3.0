/**
 * Clean video processing service - Step 2
 */

export interface ProcessingResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Process non-MP4 video on server
 */
export async function processVideoOnServer(
  file: File, 
  username: string = 'anonymous'
): Promise<ProcessingResult> {
  
  // Try primary server first
  const primaryResult = await tryServer(
    'https://146-235-239-243.sslip.io/transcode',
    file,
    username,
    'Primary Server'
  );
  
  if (primaryResult.success) {
    return primaryResult;
  }
  
  // Try fallback server
  const fallbackResult = await tryServer(
    'https://raspberrypi.tail83ea3e.ts.net/transcode',
    file,
    username,
    'Fallback Server'
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
  serverName: string
): Promise<ProcessingResult> {
  
  try {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('creator', username);

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
        throw new Error(`${serverName} responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // Check if we have a valid IPFS response (cid or gatewayUrl indicates success)
      if (!result.cid && !result.gatewayUrl && !result.ipfsUrl) {
        throw new Error(result.error || `${serverName} processing failed - no valid URL returned`);
      }

      return {
        success: true,
        url: result.gatewayUrl || result.ipfsUrl || `https://ipfs.skatehive.app/ipfs/${result.cid}`
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
