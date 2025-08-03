import { useState, useEffect } from 'react';

/**
 * Custom hook to provide a robust Hive avatar URL with automatic fallback
 * Falls back to Ecency service if Hive Images fails
 */
export function useHiveAvatar(username: string, size: 'small' | 'sm' | '' = 'small') {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!username) {
      setAvatarUrl('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Primary: Hive Images
    const hiveImageUrl = `https://images.hive.blog/u/${username}/avatar${size ? `/${size}` : ''}`;
    
    // Test if Hive Images works
    const testImage = new Image();
    testImage.crossOrigin = 'anonymous';
    
    testImage.onload = () => {
      setAvatarUrl(hiveImageUrl);
      setIsLoading(false);
    };
    
    testImage.onerror = () => {
      // Fallback to Ecency
      const ecencyUrl = `https://images.ecency.com/webp/u/${username}/avatar${size ? `/${size}` : ''}`;
      
      const fallbackImage = new Image();
      fallbackImage.crossOrigin = 'anonymous';
      
      fallbackImage.onload = () => {
        setAvatarUrl(ecencyUrl);
        setIsLoading(false);
      };
      
      fallbackImage.onerror = () => {
        setHasError(true);
        setAvatarUrl(''); // Will trigger fallback UI
        setIsLoading(false);
      };
      
      fallbackImage.src = ecencyUrl;
    };
    
    testImage.src = hiveImageUrl;
  }, [username, size]);

  return { avatarUrl, isLoading, hasError };
}

/**
 * Utility function to get Hive avatar URL with error handling
 * Returns an object with primary and fallback URLs for onError handling
 */
export function getHiveAvatarUrls(username: string, size: 'small' | 'sm' | '' = 'small') {
  const sizeParam = size ? `/${size}` : '';
  
  return {
    primary: `https://images.hive.blog/u/${username}/avatar${sizeParam}`,
    fallback: `https://images.ecency.com/webp/u/${username}/avatar${sizeParam}`,
  };
}

/**
 * React component props for handling avatar fallback
 */
export function getAvatarErrorHandler(username: string, size: 'small' | 'sm' | '' = 'small') {
  const urls = getHiveAvatarUrls(username, size);
  
  return {
    src: urls.primary,
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.target as HTMLImageElement;
      if (target.src === urls.primary) {
        target.src = urls.fallback;
      }
    },
    crossOrigin: 'anonymous' as const,
  };
}
