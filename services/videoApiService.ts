interface VideoUploadResult {
  cid: string;
  gatewayUrl: string;
}

interface VideoUploadOptions {
  creator: string;
  thumbnailUrl?: string;
}

interface VideoConversionResponse {
  success: boolean;
  ipfsUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  processingTime?: number;
  cid?: string;
  gatewayUrl?: string;
}

interface VideoConversionRequest {
  video: File;
  creator: string;
  thumbnailUrl?: string;
}

class VideoApiService {
  private readonly primaryApiUrl = 'https://raspberrypi.tail83ea3e.ts.net';
  private readonly fallbackApiUrl = 'https://video-worker-e7s1.onrender.com';
  
  // Conversion timeout (5 minutes)
  private readonly CONVERSION_TIMEOUT = 300000;
  
  // Request retry configuration
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 1000;

  /**
   * Upload video to the transcoding API (simplified approach like mobile app)
   * @param video - Video file to upload
   * @param options - Upload options including creator
   * @returns Promise with CID and gateway URL
   */
  async uploadVideoToWorker(
    video: File,
    options: VideoUploadOptions
  ): Promise<VideoUploadResult> {
    const WORKER_API_URL = `${this.fallbackApiUrl}/transcode`;

    try {
      console.log('🎬 Starting video upload to worker...');
      
  // Create FormData for the upload
  // IMPORTANT: Do NOT manually set the "Content-Type" header when sending
  // FormData. The browser/XHR will set the correct multipart boundary. If you
  // set Content-Type yourself (for example to 'multipart/form-data') the
  // boundary is omitted and the server will reject the request.
  // Reference: MDN - Using FormData objects
  const formData = new FormData();
      formData.append('video', video);
      
      // Add creator info if provided
      if (options.creator) {
        formData.append('creator', options.creator);
      }
      
      // Add thumbnail URL if provided
      if (options.thumbnailUrl) {
        formData.append('thumbnailUrl', options.thumbnailUrl);
      }

      const uploadResponse = await fetch(WORKER_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Video worker upload failed:', uploadResponse.status, errorText);
        throw new Error(`Video upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const result = await uploadResponse.json();

      if (!result.cid || !result.gatewayUrl) {
        throw new Error('Invalid response from video upload service');
      }

      console.log('✅ Video upload successful:', result);
      return {
        cid: result.cid,
        gatewayUrl: result.gatewayUrl,
      };
    } catch (error) {
      console.error('Failed to upload video to worker:', error);
      throw new Error(`Video upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload video using direct API calls only
   * @param video - Video file to upload
   * @param options - Upload options including creator
   * @returns Promise with CID and gateway URL
   */
  async uploadVideo(
    video: File,
    options: VideoUploadOptions
  ): Promise<VideoUploadResult> {
    console.log('🎬 Starting video upload process...');
    console.log('📁 File info:', {
      name: video.name,
      size: `${(video.size / 1024 / 1024).toFixed(2)}MB`,
      type: video.type
    });
    
    console.log('🚀 Using direct API calls (no proxy needed)');
    return this.uploadVideoDirectly(video, options);
  }

  /**
   * Upload video directly to APIs (for production to avoid Vercel size limits)
   * @param video - Video file to upload
   * @param options - Upload options including creator
   * @returns Promise with CID and gateway URL
   */
  async uploadVideoDirectly(
    video: File,
    options: VideoUploadOptions
  ): Promise<VideoUploadResult> {
    // Try Raspberry Pi first, then fallback to Render API
    const apiUrls = [
      { name: 'Raspberry Pi', url: `${this.primaryApiUrl}/transcode` },
      { name: 'Render', url: `${this.fallbackApiUrl}/transcode` }
    ];

    for (const api of apiUrls) {
      try {
        console.log(`🔄 Uploading video directly to ${api.name} API...`);
        
  // Create FormData for the upload
  // IMPORTANT: Do NOT manually set the "Content-Type" header when sending
  // FormData. The browser/XHR will set the correct multipart boundary. If you
  // set Content-Type yourself (for example to 'multipart/form-data') the
  // boundary is omitted and the server will reject the request.
  // Reference: MDN - Using FormData objects
  const formData = new FormData();
        formData.append('video', video);
        
        // Add creator info if provided
        if (options.creator) {
          formData.append('creator', options.creator);
        }
        
        // Add thumbnail URL if provided
        if (options.thumbnailUrl) {
          formData.append('thumbnailUrl', options.thumbnailUrl);
        }

        const uploadResponse = await fetch(api.url, {
          method: 'POST',
          body: formData,
          // Include credentials for CORS if needed
          mode: 'cors',
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.warn(`${api.name} direct upload failed:`, uploadResponse.status, errorText);
          continue; // Try next API
        }

        const result = await uploadResponse.json();

        if (!result.cid || !result.gatewayUrl) {
          console.warn(`${api.name} returned invalid response:`, result);
          continue; // Try next API
        }

        console.log(`✅ ${api.name} direct video upload successful:`, result);
        return {
          cid: result.cid,
          gatewayUrl: result.gatewayUrl,
        };
      } catch (error) {
        console.warn(`${api.name} direct upload error:`, error);
        continue; // Try next API
      }
    }

    // If we get here, all APIs failed
    throw new Error('All video upload APIs failed. Please try again later.');
  }

  /**
   * Upload video with proxy fallback (for development CORS issues)
   * @param video - Video file to upload
   * @param options - Upload options including creator
   * @returns Promise with CID and gateway URL
   */
  async uploadVideoWithProxy(
    video: File,
    options: VideoUploadOptions
  ): Promise<VideoUploadResult> {
    // Try Render API via proxy (Raspberry Pi doesn't work via proxy)
    const proxyUrl = '/api/video-proxy?url=' + encodeURIComponent(`${this.fallbackApiUrl}/transcode`);

    try {
      console.log('🔄 Uploading video via proxy to Render API...');
      
  // Create FormData for the upload
  // IMPORTANT: Do NOT manually set the "Content-Type" header when sending
  // FormData. The browser/XHR will set the correct multipart boundary. If you
  // set Content-Type yourself (for example to 'multipart/form-data') the
  // boundary is omitted and the server will reject the request.
  // Reference: MDN - Using FormData objects
  const formData = new FormData();
      formData.append('video', video);
      
      // Add creator info if provided
      if (options.creator) {
        formData.append('creator', options.creator);
      }
      
      // Add thumbnail URL if provided
      if (options.thumbnailUrl) {
        formData.append('thumbnailUrl', options.thumbnailUrl);
      }

      const uploadResponse = await fetch(proxyUrl, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Proxy video upload failed:', uploadResponse.status, errorText);
        throw new Error(`Proxy upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const result = await uploadResponse.json();

      if (!result.cid || !result.gatewayUrl) {
        throw new Error('Invalid response from proxy upload service');
      }

      console.log('✅ Proxy video upload successful:', result);
      return {
        cid: result.cid,
        gatewayUrl: result.gatewayUrl,
      };
    } catch (error) {
      console.error('Failed to upload video via proxy:', error);
      throw new Error(`Proxy upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create video iframe markup for Hive post
   * @param gatewayUrl - Gateway URL returned from upload
   * @param title - Optional title for the video
   * @returns HTML iframe string
   */
  createVideoIframe(gatewayUrl: string, title?: string): string {
    return `<iframe src="${gatewayUrl}" width="100%" height="400" frameborder="0" allowfullscreen title="${title || 'Video'}"></iframe>`;
  }

  /**
   * Simple API availability check (just returns true - no complex health checking)
   * @returns API status information
   */
  async getApiStatus(): Promise<{
    primaryAPI: boolean;
    primaryURL: string;
    fallbackAPI: boolean; 
    fallbackURL: string;
    checkDuration: string;
    timestamp: string;
  }> {
    const startTime = Date.now();
    
    console.log('📊 Simplified API status check - assuming services are available...');
    
    // Simplified approach: assume APIs are available
    // Real availability will be tested during actual upload attempts
    const duration = Date.now() - startTime;
    
    return {
      primaryAPI: true,  // Assume available, will fail gracefully if not
      primaryURL: this.primaryApiUrl,
      fallbackAPI: true, // Assume available, will fail gracefully if not
      fallbackURL: this.fallbackApiUrl,
      checkDuration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
  }

  // Legacy method for backward compatibility
  async convertVideo(request: VideoConversionRequest): Promise<VideoConversionResponse> {
    try {
      const result = await this.uploadVideo(request.video, {
        creator: request.creator,
        thumbnailUrl: request.thumbnailUrl,
      });

      return {
        success: true,
        ipfsUrl: result.gatewayUrl,
        cid: result.cid,
        gatewayUrl: result.gatewayUrl,
      };
    } catch (error) {
      console.error('Video conversion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Utility method for delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const videoApiService = new VideoApiService();
export default videoApiService;
