import { useState, useEffect, useCallback, useRef } from 'react';

interface InstagramHealthStatus {
  healthy: boolean;
  loading: boolean;
  error?: string;
  lastChecked?: Date;
  checkNow: () => void;
}

export function useInstagramHealth(enabled: boolean = false, checkInterval: number = 30000): InstagramHealthStatus {
  const [status, setStatus] = useState<InstagramHealthStatus>({
    healthy: false,
    loading: false, // Don't show loading until enabled
    checkNow: () => {}
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkHealth = useCallback(async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch('/api/instagram-health');
      const data = await response.json();
      
      setStatus(prev => ({
        ...prev,
        healthy: data.healthy,
        loading: false,
        error: data.healthy ? undefined : data.error,
        lastChecked: new Date()
      }));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ useInstagramHealth: Health check failed:', error);
      }
      setStatus(prev => ({
        ...prev,
        healthy: false,
        loading: false,
        error: 'Failed to check server health',
        lastChecked: new Date()
      }));
    }
  }, []);

  // Update checkNow reference
  useEffect(() => {
    setStatus(prev => ({ ...prev, checkNow: checkHealth }));
  }, [checkHealth]);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Don't run if not enabled
    if (!enabled) {
      return;
    }

    // Do initial health check when enabled
    checkHealth();

    // Set up periodic health checks if interval > 0
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
  }, [enabled, checkInterval, checkHealth]);

  return status;
}
