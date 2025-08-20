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

interface ApiHealthStatus {
  available: boolean;
  responseTime: number;
  lastChecked: number;
  error?: string;
}

interface CachedHealthCheck {
  [url: string]: ApiHealthStatus;
}

class VideoApiService {
  private readonly primaryApiUrl = 'https://raspberrypi.tail83ea3e.ts.net';
  private readonly fallbackApiUrl = 'https://video-worker-e7s1.onrender.com';
  
  // Cache health checks for 30 seconds to avoid excessive requests
  private readonly HEALTH_CACHE_TTL = 30000;
  private healthCache: CachedHealthCheck = {};
  
  // Configurable timeouts
  private readonly HEALTH_CHECK_TIMEOUT = 5000;
  private readonly CONVERSION_TIMEOUT = 300000; // 5 minutes
  
  // Request retry configuration
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 1000;
  // Optimized health check with caching and smart retry
  async checkHealth(apiUrl: string, useCache: boolean = true): Promise<boolean> {
    const now = Date.now();
    
    // Check cache first if enabled
    if (useCache && this.healthCache[apiUrl]) {
      const cached = this.healthCache[apiUrl];
      const isExpired = (now - cached.lastChecked) > this.HEALTH_CACHE_TTL;
      
      if (!isExpired) {
        console.log(`💾 Using cached health status for ${apiUrl}: ${cached.available} (${cached.responseTime}ms)`);
        return cached.available;
      }
    }

    const healthUrl = `${apiUrl}/healthz`;
    console.log(`🏥 Health check for: ${healthUrl}`);

    // Try direct request with timeout
    const result = await this.attemptHealthCheck(healthUrl, apiUrl);
    
    // Cache the result
    this.healthCache[apiUrl] = {
      available: result.success,
      responseTime: result.duration,
      lastChecked: now,
      error: result.error
    };

    return result.success;
  }

  // Private method for actual health check attempt
  private async attemptHealthCheck(healthUrl: string, apiUrl: string): Promise<{
    success: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = Date.now();

    // Try direct request first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.HEALTH_CHECK_TIMEOUT);

      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (response.ok) {
        const data = await this.parseHealthResponse(response);
        const isHealthy = this.validateHealthResponse(data);
        
        console.log(`✅ Direct health check success for ${apiUrl}: ${isHealthy} (${duration}ms)`);
        return { success: isHealthy, duration };
      }
      
      return { success: false, duration, error: `HTTP ${response.status}` };
      
    } catch (directError) {
      const errorMsg = directError instanceof Error ? directError.message : String(directError);
      console.warn(`⚠️ Direct fetch failed, trying proxy: ${errorMsg}`);
      
      // Fallback to proxy
      return await this.attemptProxyHealthCheck(healthUrl, startTime);
    }
  }

  // Private method for proxy health check
  private async attemptProxyHealthCheck(healthUrl: string, startTime: number): Promise<{
    success: boolean;
    duration: number;
    error?: string;
  }> {
    try {
      const proxyUrl = `/api/video-proxy?url=${encodeURIComponent(healthUrl)}`;
      
      const proxyResponse = await fetch(proxyUrl, {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(this.HEALTH_CHECK_TIMEOUT + 2000),
      });

      const duration = Date.now() - startTime;

      if (proxyResponse.ok) {
        const data = await this.parseHealthResponse(proxyResponse);
        const isHealthy = this.validateHealthResponse(data);
        
        console.log(`🔄 Proxy health check success: ${isHealthy} (${duration}ms)`);
        return { success: isHealthy, duration };
      }
      
      return { success: false, duration, error: `Proxy HTTP ${proxyResponse.status}` };
      
    } catch (proxyError) {
      const duration = Date.now() - startTime;
      const errorMsg = proxyError instanceof Error ? proxyError.message : String(proxyError);
      
      console.error(`❌ Both direct and proxy health checks failed (${duration}ms): ${errorMsg}`);
      return { success: false, duration, error: errorMsg };
    }
  }

  // Helper to safely parse health response
  private async parseHealthResponse(response: Response): Promise<any> {
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.warn('Failed to parse health response as JSON, treating as text');
      return null;
    }
  }

  // Helper to validate health response data
  private validateHealthResponse(data: any): boolean {
    if (!data) return false;
    return data.ok === true || data.status === 'ok' || data.healthy === true;
  }

  // Optimized video conversion with retry logic and better error handling
  async convertAndUploadVideo(
    apiUrl: string,
    request: VideoConversionRequest,
    onProgress?: (progress: number) => void
  ): Promise<VideoConversionResponse> {
    const startTime = Date.now();
    
    console.log(`🎬 Starting video conversion:`, {
      api: apiUrl,
      creator: request.creator,
      videoFile: {
        name: request.video.name,
        size: `${(request.video.size / 1024 / 1024).toFixed(2)} MB`,
        type: request.video.type
      },
      hasThumbnail: !!request.thumbnailUrl
    });

    // Retry with exponential backoff
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await this.attemptVideoConversion(apiUrl, request, onProgress, attempt);
        
        if (result.success) {
          const totalTime = Date.now() - startTime;
          console.log(`✅ Video conversion successful on attempt ${attempt} (${totalTime}ms)`);
          return { ...result, processingTime: totalTime };
        }
        
        // If not successful and not the last attempt, retry
        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying conversion in ${delay}ms (attempt ${attempt + 1}/${this.MAX_RETRIES})`);
          await this.delay(delay);
        } else {
          return result; // Return the last attempt's result
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ Conversion attempt ${attempt} failed: ${errorMsg}`);
        
        if (attempt === this.MAX_RETRIES) {
          const totalTime = Date.now() - startTime;
          return {
            success: false,
            error: `All ${this.MAX_RETRIES} attempts failed. Last error: ${errorMsg}`,
            processingTime: totalTime
          };
        }
        
        // Wait before retry
        const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
        await this.delay(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    return {
      success: false,
      error: 'Unexpected error in retry logic',
      processingTime: Date.now() - startTime
    };
  }

  // Private method for single conversion attempt
  private async attemptVideoConversion(
    apiUrl: string,
    request: VideoConversionRequest,
    onProgress?: (progress: number) => void,
    attempt: number = 1
  ): Promise<VideoConversionResponse> {
    const startTime = Date.now();
    
    try {
      const formData = this.createFormData(request);
      const transcodeEndpoint = `${apiUrl}/transcode`;

      console.log(`📡 Conversion attempt ${attempt} to: ${transcodeEndpoint}`);

      // Create controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`⏰ Conversion timeout after ${this.CONVERSION_TIMEOUT}ms`);
      }, this.CONVERSION_TIMEOUT);

      const response = await fetch(transcodeEndpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type for FormData - let browser set it with boundary
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      console.log(`📨 Conversion response:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${duration}ms`,
        attempt
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error response');
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}. ${errorText}`,
          processingTime: duration
        };
      }

      const result = await this.parseConversionResponse(response);
      
      // Validate the response structure
      if (this.isValidConversionResponse(result)) {
        onProgress?.(100); // Signal completion
        return {
          success: true,
          ipfsUrl: result.ipfsUrl,
          thumbnailUrl: result.thumbnailUrl,
          processingTime: duration
        };
      } else {
        return {
          success: false,
          error: 'Invalid response format from API',
          processingTime: duration
        };
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      console.error(`❌ Conversion attempt ${attempt} error:`, {
        error: errorMsg,
        duration: `${duration}ms`,
        api: apiUrl
      });

      return {
        success: false,
        error: errorMsg,
        processingTime: duration
      };
    }
  }

  // Helper methods
  private createFormData(request: VideoConversionRequest): FormData {
    const formData = new FormData();
    formData.append('video', request.video);
    formData.append('creator', request.creator);
    
    if (request.thumbnailUrl) {
      formData.append('thumbnailUrl', request.thumbnailUrl);
    }
    
    return formData;
  }

  private async parseConversionResponse(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch (error) {
      console.warn('Failed to parse conversion response as JSON');
      const text = await response.text();
      return { error: `Invalid JSON response: ${text}` };
    }
  }

  private isValidConversionResponse(result: any): boolean {
    return result && 
           typeof result === 'object' && 
           typeof result.ipfsUrl === 'string' && 
           result.ipfsUrl.length > 0;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Main processing pipeline with smart API selection
  async processVideo(
    request: VideoConversionRequest,
    onProgress?: (progress: number) => void
  ): Promise<VideoConversionResponse | null> {
    console.log(`🚀 Starting optimized video processing pipeline`);
    
    // Check both APIs concurrently
    const [primaryAvailable, fallbackAvailable] = await Promise.all([
      this.checkHealth(this.primaryApiUrl),
      this.checkHealth(this.fallbackApiUrl)
    ]);

    console.log(`📊 API availability: Primary=${primaryAvailable}, Fallback=${fallbackAvailable}`);

    // Try primary API first if available
    if (primaryAvailable) {
      console.log(`🔧 Attempting primary API conversion...`);
      const result = await this.convertAndUploadVideo(
        this.primaryApiUrl,
        request,
        onProgress
      );
      
      if (result.success) {
        console.log(`✅ Primary API conversion successful`);
        return result;
      }
      
      console.log(`⚠️ Primary API failed, trying fallback...`);
    }

    // Try fallback API if available
    if (fallbackAvailable) {
      console.log(`� Attempting fallback API conversion...`);
      const result = await this.convertAndUploadVideo(
        this.fallbackApiUrl,
        request,
        onProgress
      );
      
      if (result.success) {
        console.log(`✅ Fallback API conversion successful`);
        return result;
      }
      
      console.log(`❌ Fallback API also failed`);
    }

    console.log(`❌ All APIs failed or unavailable`);
    return null;
  }

  // Optimized status check with concurrent health checks
  async getApiStatus() {
    const startTime = Date.now();
    console.log(`📊 Starting concurrent API status check...`);

    // Run health checks concurrently for better performance
    const [primaryResult, fallbackResult] = await Promise.allSettled([
      this.checkHealth(this.primaryApiUrl),
      this.checkHealth(this.fallbackApiUrl)
    ]);

    const primaryAvailable = primaryResult.status === 'fulfilled' ? primaryResult.value : false;
    const fallbackAvailable = fallbackResult.status === 'fulfilled' ? fallbackResult.value : false;

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

    console.log(`📊 Optimized API status check complete (${duration}ms):`, status);
    return status;
  }

  // Clear health cache (useful for testing or forced refresh)
  clearHealthCache(): void {
    this.healthCache = {};
    console.log(`🧹 Health cache cleared`);
  }

  // Get cache status for debugging
  getCacheStatus(): CachedHealthCheck {
    return { ...this.healthCache };
  }
}

// Export singleton instance
export const videoApiService = new VideoApiService();
export type { VideoConversionResponse, VideoConversionRequest };
