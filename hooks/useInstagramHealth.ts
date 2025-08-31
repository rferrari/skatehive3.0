import { useState, useEffect } from 'react';

interface InstagramHealthStatus {
  healthy: boolean;
  loading: boolean;
  error?: string;
  lastChecked?: Date;
}

export function useInstagramHealth(checkInterval: number = 30000): InstagramHealthStatus {
  const [status, setStatus] = useState<InstagramHealthStatus>({
    healthy: false,
    loading: true
  });

  const checkHealth = async () => {
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
      setStatus({
        healthy: false,
        loading: false,
        error: 'Failed to check server health',
        lastChecked: new Date()
      });
    }
  };

  useEffect(() => {
    // Initial health check
    checkHealth();

    // Set up periodic health checks
    const interval = setInterval(checkHealth, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval]);

  return status;
}
