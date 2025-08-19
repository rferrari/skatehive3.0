interface VideoConversionResponse {
  success: boolean;
  ipfsUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  processingTime?: number;
}

interface VideoConversionRequest {
  video: File;
  creator: string;
  thumbnailUrl?: string;
}

class VideoApiService {
  private primaryApiUrl = 'https://raspberrypi.tail83ea3e.ts.net';
  private fallbackApiUrl = 'https://video-worker-e7s1.onrender.com';
  
  // Check if API is available
  async checkApiAvailability(apiUrl: string): Promise<boolean> {
    const startTime = Date.now();
    console.log(`🔍 Starting health check for: ${apiUrl}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ Health check timeout (10s) for ${apiUrl}`);
        controller.abort();
      }, 10000);
      
      const healthEndpoint = `${apiUrl}/healthz`;
      
      console.log(`📡 Making request to: ${healthEndpoint}`);
      
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SkateHive-VideoUploader/1.0',
        },
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Health check response for ${apiUrl}:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        duration: `${duration}ms`,
        url: response.url,
        type: response.type,
        redirected: response.redirected,
      });

      if (response.ok) {
        try {
          const responseText = await response.text();
          console.log(`📄 Response body:`, responseText);
          const data = responseText ? JSON.parse(responseText) : null;
          console.log(`📊 Parsed response:`, data);
        } catch (parseError) {
          console.warn(`⚠️ Could not parse response as JSON:`, parseError);
        }
      }
      
      return response.ok;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Health check failed for ${apiUrl} after ${duration}ms:`, {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`🔄 Trying fallback health check without timeout for ${apiUrl}`);
        try {
          const fallbackHealthEndpoint = `${apiUrl}/healthz`;
            
          console.log(`📡 Fallback request to: ${fallbackHealthEndpoint}`);
          const fallbackResponse = await fetch(fallbackHealthEndpoint, {
            method: 'GET',
            headers: { 
              'Accept': 'application/json',
              'User-Agent': 'SkateHive-VideoUploader/1.0-Fallback',
            },
          });
          
          console.log(`✅ Fallback health check result:`, {
            status: fallbackResponse.status,
            ok: fallbackResponse.ok,
            statusText: fallbackResponse.statusText,
          });
          
          return fallbackResponse.ok;
        } catch (fallbackError) {
          console.error(`❌ Fallback health check also failed:`, fallbackError);
          return false;
        }
      }
      return false;
    }
  }

  // Convert and upload video using API
  async convertAndUploadVideo(
    apiUrl: string,
    request: VideoConversionRequest,
    onProgress?: (progress: number) => void
  ): Promise<VideoConversionResponse> {
    const startTime = Date.now();
    console.log(`🎬 Starting video conversion with API: ${apiUrl}`);
    console.log(`📋 Request details:`, {
      creator: request.creator,
      thumbnailUrl: request.thumbnailUrl,
      videoFile: {
        name: request.video.name,
        size: request.video.size,
        type: request.video.type,
        lastModified: new Date(request.video.lastModified).toISOString(),
      }
    });

    try {
      const formData = new FormData();
      formData.append('video', request.video);
      formData.append('creator', request.creator);
      
      if (request.thumbnailUrl) {
        formData.append('thumbnailUrl', request.thumbnailUrl);
      }

      const transcodeEndpoint = `${apiUrl}/transcode`;

      console.log(`📡 Sending POST request to: ${transcodeEndpoint}`);
      console.log(`📦 FormData contents:`, {
        creator: request.creator,
        thumbnailUrl: request.thumbnailUrl || 'not provided',
        videoFileName: request.video.name,
        videoSize: `${(request.video.size / 1024 / 1024).toFixed(2)} MB`,
      });

      const response = await fetch(transcodeEndpoint, {
        method: 'POST',
        body: formData,
      });

      const duration = Date.now() - startTime;
      console.log(`📨 Video conversion response:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        duration: `${duration}ms`,
        url: response.url,
        type: response.type,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API error response:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`API responded with status: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log(`📄 Raw response body:`, responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log(`📊 Parsed response:`, result);
      } catch (parseError) {
        console.error(`❌ Failed to parse response as JSON:`, parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      const finalResponse = {
        success: result.success || result.cid || result.ipfsUrl || result.gatewayUrl ? true : false,
        ipfsUrl: result.ipfsUrl || result.gatewayUrl,
        thumbnailUrl: result.thumbnailUrl || request.thumbnailUrl,
        processingTime: result.processingTime || duration,
      };

      console.log(`✅ Final processed response:`, finalResponse);
      return finalResponse;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Video conversion failed with API ${apiUrl} after ${duration}ms:`, {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during video conversion',
      };
    }
  }

  // Try primary API, then fallback, then return null for native processing
  async processVideo(
    request: VideoConversionRequest,
    onProgress?: (progress: number) => void
  ): Promise<VideoConversionResponse | null> {
    console.log(`🚀 Starting video processing pipeline`);
    console.log(`📋 Request summary:`, {
      creator: request.creator,
      hasVideo: !!request.video,
      videoName: request.video?.name,
      videoSize: request.video ? `${(request.video.size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
      hasThumbnail: !!request.thumbnailUrl,
    });

    // Check primary API availability
    console.log(`🔍 Checking primary API availability...`);
    const primaryAvailable = await this.checkApiAvailability(this.primaryApiUrl);
    console.log(`🔌 Primary API (${this.primaryApiUrl}) available: ${primaryAvailable}`);
    
    if (primaryAvailable) {
      console.log(`✅ Using primary API for video processing`);
      const result = await this.convertAndUploadVideo(this.primaryApiUrl, request, onProgress);
      if (result.success) {
        console.log(`🎉 Primary API processing successful!`);
        return result;
      } else {
        console.warn(`⚠️ Primary API processing failed, trying fallback...`);
      }
    } else {
      console.warn(`❌ Primary API unavailable, trying fallback...`);
    }

    // Check fallback API availability
    console.log(`🔍 Checking fallback API availability...`);
    const fallbackAvailable = await this.checkApiAvailability(this.fallbackApiUrl);
    console.log(`🔌 Fallback API (${this.fallbackApiUrl}) available: ${fallbackAvailable}`);
    
    if (fallbackAvailable) {
      console.log(`✅ Using fallback API for video processing`);
      const result = await this.convertAndUploadVideo(this.fallbackApiUrl, request, onProgress);
      if (result.success) {
        console.log(`🎉 Fallback API processing successful!`);
        return result;
      } else {
        console.warn(`⚠️ Fallback API processing also failed`);
      }
    } else {
      console.warn(`❌ Fallback API also unavailable`);
    }

    // Both APIs failed or unavailable, return null to trigger native processing
    console.log(`🔄 Both APIs unavailable or failed, will use native processing`);
    return null;
  }

  // Get API status for debugging
  async getApiStatus() {
    console.log(`🔍 Checking status of all APIs...`);
    const startTime = Date.now();
    
    const [primaryAvailable, fallbackAvailable] = await Promise.all([
      this.checkApiAvailability(this.primaryApiUrl),
      this.checkApiAvailability(this.fallbackApiUrl),
    ]);

    const duration = Date.now() - startTime;
    const status = {
      primaryApi: {
        url: this.primaryApiUrl,
        available: primaryAvailable,
      },
      fallbackApi: {
        url: this.fallbackApiUrl,
        available: fallbackAvailable,
      },
      checkDuration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    console.log(`📊 Complete API status check results:`, status);
    return status;
  }

  // Test method to bypass proxy and test direct API (for debugging CORS)
  async testDirectApi() {
    console.log(`🧪 Testing direct API connection (bypassing proxy)...`);
    const startTime = Date.now();
    
    try {
      console.log(`📡 Making direct request to: https://video-worker-e7s1.onrender.com/healthz`);
      const response = await fetch('https://video-worker-e7s1.onrender.com/healthz', {
        method: 'GET',
        mode: 'no-cors', // This will bypass CORS but limit response access
      });
      
      const duration = Date.now() - startTime;
      const result = { 
        success: true, 
        type: response.type, 
        status: response.status,
        duration: `${duration}ms`,
      };
      
      console.log(`✅ Direct API test (no-cors mode) results:`, result);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = { 
        success: false, 
        error,
        duration: `${duration}ms`,
      };
      
      console.error(`❌ Direct API test failed:`, result);
      return result;
    }
  }

  // Test method with CORS to see exact error
  async testDirectApiWithCors() {
    console.log(`🧪 Testing direct API with CORS (to see exact error)...`);
    const startTime = Date.now();
    
    try {
      console.log(`📡 Making CORS request to: https://video-worker-e7s1.onrender.com/healthz`);
      const response = await fetch('https://video-worker-e7s1.onrender.com/healthz', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const duration = Date.now() - startTime;
      const responseText = await response.text();
      
      const result = { 
        success: response.ok, 
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
        duration: `${duration}ms`,
      };
      
      console.log(`✅ Direct API CORS test results:`, result);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = { 
        success: false, 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
        duration: `${duration}ms`,
      };
      
      console.error(`❌ Direct API CORS test failed:`, result);
      return result;
    }
  }
}

// Export singleton instance
export const videoApiService = new VideoApiService();
export type { VideoConversionResponse, VideoConversionRequest };
