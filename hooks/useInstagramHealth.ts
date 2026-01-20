import { useState, useEffect, useCallback, useRef } from 'react';

interface InstagramHealthStatus {
  healthy: boolean;
  loading: boolean;
  error?: string;
  lastChecked?: Date;
}

export function useInstagramHealth(checkInterval: number = 30000): InstagramHealthStatus {
  const [status, setStatus] = useState<InstagramHealthStatus>({
    healthy: false,
    loading: checkInterval !== 0 // Only show loading if we're going to check
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/instagram-health');
      const data = await response.json();
      
      setStatus({
        healthy: data.healthy,
        loading: false,
        error: data.healthy ? undefined : data.error,
        lastChecked: new Date()
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ useInstagramHealth: Health check failed:', error);
      }
      setStatus({
        healthy: false,
        loading: false,
        error: 'Failed to check server health',
        lastChecked: new Date()
      });
    }
  }, []);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Don't run if checkInterval is 0 (disabled)
    if (checkInterval === 0) {
      setStatus({
        healthy: false,
        loading: false,
        error: 'Health check disabled'
      });
      return;
    }

    // Always do initial health check (for checkInterval > 0 or -1)
    checkHealth();

    // Set up periodic health checks only if checkInterval > 0
    if (checkInterval > 0) {
      intervalRef.current = setInterval(checkHealth, checkInterval);
    }
    
    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkInterval, checkHealth]);

  return status;
}
