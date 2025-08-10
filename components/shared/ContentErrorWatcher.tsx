import React, { useEffect, useState } from 'react';
import { SkateErrorModal } from './SkateErrorModal';

interface ContentErrorWatcherProps {
  children: React.ReactNode;
}

export const ContentErrorWatcher: React.FC<ContentErrorWatcherProps> = ({ children }) => {
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showMaliciousContentError = (message: string) => {
    console.log('🛹 SkateHive: Showing malicious content modal!');
    setErrorMessage(message);
    setIsErrorOpen(true);
  };

  const closeError = () => {
    setIsErrorOpen(false);
    setErrorMessage('');
  };

  useEffect(() => {
    // Store original console methods
    const originalWarn = console.warn;
    const originalError = console.error;

    // Intercept console.warn and console.error
    console.warn = function(...args: any[]) {
      const message = args.join(' ');
      
      // Check for @hiveio/content-renderer blocked content
      if (message.includes('@hiveio/content-renderer') && 
          (message.includes('Blocked') || message.includes('does not appear to be a url'))) {
        
        console.log('🛹 SkateHive: Intercepted malicious content attempt!');
        showMaliciousContentError(message);
        return; // Don't show the original error
      }
      
      // Call original warn for other warnings
      originalWarn.apply(console, args);
    };

    console.error = function(...args: any[]) {
      const message = args.join(' ');
      
      // Check for @hiveio/content-renderer errors
      if (message.includes('@hiveio/content-renderer') || 
          message.includes('content-renderer')) {
        
        console.log('🛹 SkateHive: Intercepted content renderer error!');
        showMaliciousContentError(message);
        return; // Don't show the original error
      }
      
      // Call original error for other errors
      originalError.apply(console, args);
    };

    // Cleanup function to restore original console methods
    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  return (
    <>
      {children}
      <SkateErrorModal
        isOpen={isErrorOpen}
        onClose={closeError}
        errorType="malicious-content"
        errorMessage={errorMessage}
      />
    </>
  );
};

export default ContentErrorWatcher;
