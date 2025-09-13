/**
 * Video Conversion API Service
 * Handles video conversion using external APIs with fallback mechanisms
 */

export interface VideoConversionResult {
  success: boolean;
  url?: string;
  error?: string;
  method?: 'primary_api' | 'secondary_api' | 'fallback_api' | 'native';
  duration?: number;
  fileSize?: number;
}

export interface VideoConversionOptions {
  creator?: string;
  thumbnailUrl?: string;
  onProgress?: (progress: number) => void;
  maxRetries?: number;
}

// Primary API configuration - Mac Mini M4 (fastest)
const PRIMARY_API_ENDPOINT = "https://macmini.tail83ea3e.ts.net:8081/transcode";

// Secondary API configuration - Raspberry Pi (reliable)
const SECONDARY_API_ENDPOINT = "https://raspberrypi.tail83ea3e.ts.net/video/transcode";

// Fallback API configuration - Render (cloud backup)
const FALLBACK_API_ENDPOINT = "https://skatehive-transcoder.onrender.com/transcode";

/**
 * Attempts to upload and convert video using the primary API
 */
async function uploadToPrimaryAPI(
  file: File,
  options: VideoConversionOptions
): Promise<VideoConversionResult> {
  try {
    console.log("🚀 Attempting upload to primary API...");

    const formData = new FormData();
    formData.append("video", file);

    if (options.creator) {
      formData.append("creator", options.creator);
    }

    if (options.thumbnailUrl) {
      formData.append("thumbnailUrl", options.thumbnailUrl);
    }

    const response = await fetch(PRIMARY_API_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Primary API failed: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();

    console.log("🔍 Primary API Response Debug:");
    console.log("Full result:", JSON.stringify(result, null, 2));
    console.log("result.url:", result.url, typeof result.url);
    console.log("result.ipfsUrl:", result.ipfsUrl, typeof result.ipfsUrl);
    console.log("result.videoUrl:", result.videoUrl, typeof result.videoUrl);

    // Assuming the API returns a JSON with a URL field
    if (result.url || result.ipfsUrl || result.videoUrl) {
      const videoUrl = result.url || result.ipfsUrl || result.videoUrl;

      console.log("✅ Primary API upload successful!");
      console.log("Selected videoUrl:", videoUrl, typeof videoUrl);

      return {
        success: true,
        url: videoUrl,
        method: 'primary_api',
        duration: result.duration,
        fileSize: result.fileSize || file.size,
      };
    } else {
      throw new Error("Primary API returned invalid response - no URL found");
    }
  } catch (error) {
    console.error("❌ Primary API failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      method: 'primary_api',
    };
  }
}

/**
 * Attempts to upload and convert video using the secondary API (Raspberry Pi)
 */
async function uploadToSecondaryAPI(
  file: File,
  options: VideoConversionOptions
): Promise<VideoConversionResult> {
  try {
    console.log("🔄 Attempting upload to secondary API (Raspberry Pi)...");

    const formData = new FormData();
    formData.append("video", file);

    if (options.creator) {
      formData.append("creator", options.creator);
    }

    if (options.thumbnailUrl) {
      formData.append("thumbnailUrl", options.thumbnailUrl);
    }

    const response = await fetch(SECONDARY_API_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Secondary API failed: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();

    if (result.url || result.ipfsUrl || result.videoUrl) {
      const videoUrl = result.url || result.ipfsUrl || result.videoUrl;

      console.log("✅ Secondary API upload successful!");
      return {
        success: true,
        url: videoUrl,
        method: 'secondary_api',
        duration: result.duration,
        fileSize: result.fileSize || file.size,
      };
    } else {
      throw new Error("Secondary API returned invalid response - no URL found");
    }
  } catch (error) {
    console.error("❌ Secondary API failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      method: 'secondary_api',
    };
  }
}

/**
 * Attempts to upload and convert video using the fallback API
 */
async function uploadToFallbackAPI(
  file: File,
  options: VideoConversionOptions
): Promise<VideoConversionResult> {
  try {
    console.log("🔄 Attempting upload to fallback API (Render)...");

    const formData = new FormData();
    formData.append("video", file);

    if (options.creator) {
      formData.append("creator", options.creator);
    }

    if (options.thumbnailUrl) {
      formData.append("thumbnailUrl", options.thumbnailUrl);
    }

    const response = await fetch(FALLBACK_API_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Fallback API failed: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();

    if (result.url || result.ipfsUrl || result.videoUrl) {
      const videoUrl = result.url || result.ipfsUrl || result.videoUrl;

      console.log("✅ Fallback API upload successful!");
      return {
        success: true,
        url: videoUrl,
        method: 'fallback_api',
        duration: result.duration,
        fileSize: result.fileSize || file.size,
      };
    } else {
      throw new Error("Fallback API returned invalid response - no URL found");
    }
  } catch (error) {
    console.error("❌ Fallback API failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      method: 'fallback_api',
    };
  }
}

/**
 * Main function to upload video with API fallback chain
 * Tries: Mac Mini M4 -> Raspberry Pi -> Render -> Native processing
 */
export async function uploadVideoWithAPIFallback(
  file: File,
  options: VideoConversionOptions = {}
): Promise<VideoConversionResult> {
  const { maxRetries = 1 } = options;

  console.log("🎬 Starting video upload with 3-tier API fallback chain...", {
    fileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    creator: options.creator,
    hasThumbnail: !!options.thumbnailUrl,
    chain: "Mac Mini M4 → Raspberry Pi → Render → Native"
  });

  // Try primary API first (Mac Mini M4)
  let result = await uploadToPrimaryAPI(file, options);
  if (result.success) {
    console.log("✅ Mac Mini M4 upload successful!");
    return result;
  }

  console.log("⚠️ Mac Mini M4 failed, trying Raspberry Pi...");

  // Try secondary API (Raspberry Pi)
  result = await uploadToSecondaryAPI(file, options);
  if (result.success) {
    console.log("✅ Raspberry Pi upload successful!");
    return result;
  }

  console.log("⚠️ Raspberry Pi failed, trying Render fallback...");

  // Try fallback API (Render)
  result = await uploadToFallbackAPI(file, options);
  if (result.success) {
    console.log("✅ Render API upload successful!");
    return result;
  }

  console.log("❌ All APIs failed, will fallback to native processing");

  // Return failure - the calling code will handle native fallback
  return {
    success: false,
    error: "All APIs failed (Mac Mini M4, Raspberry Pi, Render) - falling back to native processing",
    method: 'native',
  };
}

/**
 * Check if APIs are available
 */
export async function checkAPIAvailability(): Promise<{
  primaryAPI: boolean;
  fallbackAPI: boolean;
}> {
  const checkAPI = async (endpoint: string): Promise<boolean> => {
    try {
      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const [primaryAPI, fallbackAPI] = await Promise.allSettled([
    checkAPI(PRIMARY_API_ENDPOINT),
    checkAPI(FALLBACK_API_ENDPOINT),
  ]);

  return {
    primaryAPI: primaryAPI.status === 'fulfilled' && primaryAPI.value,
    fallbackAPI: fallbackAPI.status === 'fulfilled' && fallbackAPI.value,
  };
}
