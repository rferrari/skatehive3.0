import { useState, useEffect, useRef } from 'react';
import { Discussion } from '@hiveio/dhive';

interface SkatespotsResponse {
  success: boolean;
  data: Discussion[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const useSkatespots = () => {
  const [spots, setSpots] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const fetchedPermlinksRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  const fetchSkatespots = async (page: number = 1, append: boolean = false) => {
    // Prevent multiple simultaneous requests
    if (isLoading) return;
    
    // Don't refetch if we already have data for this page (but allow refresh)
    if (page === 1 && !append && spots.length > 0 && isInitializedRef.current && !error) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/skatespots?page=${page}&limit=10`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: SkatespotsResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to fetch skatespots');
      }
      
      // Filter out duplicates only when appending
      let newSpots = result.data;
      if (append) {
        newSpots = result.data.filter(spot => !fetchedPermlinksRef.current.has(spot.permlink));
      }
      
      // Add new permlinks to the set
      newSpots.forEach(spot => fetchedPermlinksRef.current.add(spot.permlink));
      
      if (append) {
        setSpots(prev => {
          const updated = [...prev, ...newSpots];
          if (typeof window !== 'undefined') {
          }
          return updated;
        });
      } else {
        // For initial load, always set spots regardless of duplicates
        setSpots(newSpots);
        isInitializedRef.current = true;
      }
      
      if (typeof window !== 'undefined') {
      }
      setHasMore(result.pagination.hasNextPage);
      setCurrentPage(result.pagination.currentPage);
      
    } catch (err) {
      console.error('Error fetching skatespots:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch skatespots');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSkatespots(1, false);
  }, []);

  // Debug: Track spots changes (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
    }
  }, [spots]);

  // Load next page
  const loadNextPage = () => {
    if (!isLoading && hasMore) {
      fetchSkatespots(currentPage + 1, true);
    }
  };

  // Refresh spots
  const refresh = () => {
    fetchedPermlinksRef.current.clear();
    setCurrentPage(1);
    setHasMore(true);
    // Don't clear spots immediately - let the new fetch handle it
    fetchSkatespots(1, false);
  };

  return {
    spots,
    isLoading,
    hasMore,
    error,
    loadNextPage,
    refresh,
    currentPage
  };
}; 