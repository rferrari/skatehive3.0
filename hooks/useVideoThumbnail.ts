/**
 * Optimized hook for managing video thumbnails with caching and lazy loading
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import { extractIPFSHash } from "@/lib/utils/ipfsMetadata";

// Global cache for thumbnails
const thumbnailCache = new Map<string, {
  url: string | null;
  timestamp: number;
  loading: boolean;
  failed: boolean; // Track failed requests
}>();

// Cache TTL: 30 minutes
const CACHE_TTL = 30 * 60 * 1000;

// Request deduplication map
const pendingRequests = new Map<string, Promise<string | null>>();

interface UseThumbnailOptions {
  enabled?: boolean;
  lazy?: boolean;
}

export function useVideoThumbnail(src: string, options: UseThumbnailOptions = {}) {
  const { enabled = true, lazy = true } = options;
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThumbnail = useCallback(async (videoSrc: string) => {
    if (!enabled || !videoSrc) return;

    try {
      const hash = extractIPFSHash(videoSrc);
      if (!hash) {
        setError("Invalid IPFS URL");
        return;
      }

      // Check cache validity
      const cached = thumbnailCache.get(hash);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        // Don't retry if we know it failed recently
        if (cached.failed) {
          setError("Thumbnail not available");
          return;
        }
        setThumbnailUrl(cached.url);
        setIsLoading(false);
        return;
      }

      // Check if request is already in progress
      if (pendingRequests.has(hash)) {
        const result = await pendingRequests.get(hash)!;
        setThumbnailUrl(result);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Create new request
      const requestPromise = fetchThumbnail(hash);
      pendingRequests.set(hash, requestPromise);

      try {
        const thumbnail = await requestPromise;
        
        // Cache the result
        thumbnailCache.set(hash, {
          url: thumbnail,
          timestamp: Date.now(),
          loading: false,
          failed: !thumbnail, // Mark as failed if no thumbnail
        });

        setThumbnailUrl(thumbnail);
      } finally {
        pendingRequests.delete(hash);
        setIsLoading(false);
      }

    } catch (err) {
      console.warn("Failed to load thumbnail:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load thumbnail";
      
      // Cache the failure to prevent retries
      const hash = extractIPFSHash(videoSrc);
      if (hash) {
        thumbnailCache.set(hash, {
          url: null,
          timestamp: Date.now(),
          loading: false,
          failed: true,
        });
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!lazy) {
      loadThumbnail(src);
    }
  }, [src, lazy, loadThumbnail]);

  return {
    thumbnailUrl,
    isLoading,
    error,
    loadThumbnail: () => loadThumbnail(src),
  };
}

// Separate function to handle the actual API call
async function fetchThumbnail(hash: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/pinata/metadata/${hash}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No thumbnail available
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const metadata = await response.json();
    return metadata?.keyvalues?.thumbnailUrl || null;
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Utility function to preload thumbnails for a list of videos
export function preloadThumbnails(videoUrls: string[]): Promise<void> {
  return Promise.all(
    videoUrls.slice(0, 10).map(async (url) => { // Limit to first 10 for performance
      try {
        const hash = extractIPFSHash(url);
        if (!hash) return;
        
        // Check if we already have this in cache (success or failure)
        const cached = thumbnailCache.get(hash);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
          return; // Skip if recently cached
        }
        
        const thumbnail = await fetchThumbnail(hash);
        
        // Cache the result
        thumbnailCache.set(hash, {
          url: thumbnail,
          timestamp: Date.now(),
          loading: false,
          failed: !thumbnail,
        });
      } catch (error) {
        console.warn("Failed to preload thumbnail for:", url);
        // Cache the failure
        const hash = extractIPFSHash(url);
        if (hash) {
          thumbnailCache.set(hash, {
            url: null,
            timestamp: Date.now(),
            loading: false,
            failed: true,
          });
        }
      }
    })
  ).then(() => void 0);
}

// Clear cache function for memory management
export function clearThumbnailCache(): void {
  thumbnailCache.clear();
  pendingRequests.clear();
}

export default useVideoThumbnail;
