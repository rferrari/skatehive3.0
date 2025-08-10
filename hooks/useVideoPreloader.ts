import { useEffect, useRef, useState, useCallback } from 'react';

interface PreloadedVideo {
  src: string;
  element: HTMLVideoElement;
  isLoaded: boolean;
}

interface UseVideoPreloaderOptions {
  enabled?: boolean;
  maxConcurrent?: number;
  lookahead?: number;
  debugMode?: boolean;
}

export const useVideoPreloader = (
  videoSources: string[], 
  currentIndex: number,
  options: UseVideoPreloaderOptions = {}
) => {
  const {
    enabled = true,
    maxConcurrent = 3,
    lookahead = 3, // Reduced for better performance
    debugMode = process.env.NODE_ENV === 'development' // Auto-detect production
  } = options;

  const preloadedVideos = useRef<Map<string, PreloadedVideo>>(new Map());
  const [loadingStatus, setLoadingStatus] = useState<Record<string, boolean>>({});
  const activePreloads = useRef<Set<string>>(new Set());

  // Cleanup function to prevent memory leaks
  const cleanupVideo = useCallback((src: string) => {
    const preloaded = preloadedVideos.current.get(src);
    if (preloaded) {
      preloaded.element.removeAttribute('src');
      preloaded.element.load(); // Free memory
      if (document.body.contains(preloaded.element)) {
        document.body.removeChild(preloaded.element);
      }
      preloadedVideos.current.delete(src);
      activePreloads.current.delete(src);
      setLoadingStatus(prev => {
        const updated = { ...prev };
        delete updated[src];
        return updated;
      });
    }
  }, []);

  // Create and preload video elements
  useEffect(() => {
    if (!enabled || videoSources.length === 0) return;

    const preloadNext = (index: number) => {
      // Clean up videos that are too far behind
      const cleanupThreshold = Math.max(0, index - 2);
      for (let i = 0; i < cleanupThreshold; i++) {
        const oldSrc = videoSources[i];
        if (oldSrc && preloadedVideos.current.has(oldSrc)) {
          cleanupVideo(oldSrc);
        }
      }

      // Preload upcoming videos within limits
      let preloadCount = 0;
      for (let i = 1; i <= lookahead && preloadCount < maxConcurrent; i++) {
        const nextIndex = index + i;
        if (nextIndex >= videoSources.length) continue;
        
        const src = videoSources[nextIndex];
        if (!src || preloadedVideos.current.has(src) || activePreloads.current.has(src)) continue;

        // Check concurrent limit
        if (activePreloads.current.size >= maxConcurrent) break;

        // Create video element for preloading
        const video = document.createElement('video');
        video.src = src;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata'; // Less aggressive for better performance
        video.crossOrigin = 'anonymous';
        
        // Hide the video element
        video.style.position = 'absolute';
        video.style.left = '-9999px';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0';
        video.style.pointerEvents = 'none';
        
        const preloadedVideo: PreloadedVideo = {
          src,
          element: video,
          isLoaded: false
        };

        // Track loading status
        activePreloads.current.add(src);
        setLoadingStatus(prev => ({ ...prev, [src]: true }));

        const handleLoadedData = () => {
          preloadedVideo.isLoaded = true;
          activePreloads.current.delete(src);
          setLoadingStatus(prev => ({ ...prev, [src]: false }));
          if (debugMode) {
            console.log(`Video preloaded: ${src.substring(0, 50)}...`);
          }
        };

        const handleError = () => {
          activePreloads.current.delete(src);
          setLoadingStatus(prev => ({ ...prev, [src]: false }));
          preloadedVideos.current.delete(src);
          if (debugMode) {
            console.warn(`Failed to preload video: ${src.substring(0, 50)}...`);
          }
          // Clean up failed video
          if (document.body.contains(video)) {
            document.body.removeChild(video);
          }
        };

        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('error', handleError);

        // Add to DOM (hidden) for loading
        document.body.appendChild(video);
        preloadedVideos.current.set(src, preloadedVideo);
        
        preloadCount++;
      }
    };

    preloadNext(currentIndex);

    // Clean up videos that are far from current index
    return () => {
      preloadedVideos.current.forEach((preloadedVideo, src) => {
        const videoIndex = videoSources.indexOf(src);
        if (videoIndex < currentIndex - 2 || videoIndex > currentIndex + lookahead) {
          cleanupVideo(src);
        }
      });
    };
  }, [currentIndex, videoSources, enabled, maxConcurrent, lookahead, debugMode, cleanupVideo]);

  // Clean up all videos on unmount
  useEffect(() => {
    return () => {
      preloadedVideos.current.forEach((preloadedVideo) => {
        preloadedVideo.element.removeAttribute('src');
        preloadedVideo.element.load();
        if (document.body.contains(preloadedVideo.element)) {
          document.body.removeChild(preloadedVideo.element);
        }
      });
      preloadedVideos.current.clear();
      activePreloads.current.clear();
    };
  }, []);

  const getPreloadedVideo = useCallback((src: string): HTMLVideoElement | null => {
    const preloaded = preloadedVideos.current.get(src);
    return preloaded?.element || null;
  }, []);

  const isVideoPreloaded = useCallback((src: string): boolean => {
    const preloaded = preloadedVideos.current.get(src);
    return preloaded?.isLoaded || false;
  }, []);

  const isVideoLoading = useCallback((src: string): boolean => {
    return loadingStatus[src] || false;
  }, [loadingStatus]);

  const preloadVideo = useCallback((src: string) => {
    if (!enabled || preloadedVideos.current.has(src) || activePreloads.current.has(src)) return;
    
    if (activePreloads.current.size >= maxConcurrent) {
      if (debugMode) {
        console.warn('Max concurrent preloads reached, skipping:', src);
      }
      return;
    }

    const video = document.createElement('video');
    video.src = src;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';
    
    // Hide the video element
    video.style.position = 'absolute';
    video.style.left = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';

    const preloadedVideo: PreloadedVideo = {
      src,
      element: video,
      isLoaded: false
    };

    activePreloads.current.add(src);
    setLoadingStatus(prev => ({ ...prev, [src]: true }));

    const handleLoadedData = () => {
      preloadedVideo.isLoaded = true;
      activePreloads.current.delete(src);
      setLoadingStatus(prev => ({ ...prev, [src]: false }));
      if (debugMode) {
        console.log(`Manual preload complete: ${src.substring(0, 50)}...`);
      }
    };

    const handleError = () => {
      activePreloads.current.delete(src);
      setLoadingStatus(prev => ({ ...prev, [src]: false }));
      preloadedVideos.current.delete(src);
      if (debugMode) {
        console.warn(`Manual preload failed: ${src.substring(0, 50)}...`);
      }
      if (document.body.contains(video)) {
        document.body.removeChild(video);
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    document.body.appendChild(video);
    preloadedVideos.current.set(src, preloadedVideo);
  }, [enabled, maxConcurrent, debugMode]);

  return {
    getPreloadedVideo,
    isVideoPreloaded,
    isVideoLoading,
    preloadVideo,
    loadingStatus,
    cleanupVideo,
    // Performance metrics for debugging
    activePreloadsCount: activePreloads.current.size,
    totalPreloaded: preloadedVideos.current.size
  };
};

