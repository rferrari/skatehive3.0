"use client";
import { useState, useEffect } from 'react';

export const useKeychainSDK = () => {
  const [keychainSDK, setKeychainSDK] = useState<any>(null);
  const [keychainTypes, setKeychainTypes] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('keychain-sdk').then((mod) => {
        setKeychainSDK(mod.KeychainSDK);
        setKeychainTypes({
          KeychainRequestTypes: mod.KeychainRequestTypes,
          KeychainKeyTypes: mod.KeychainKeyTypes,
        });
        setIsLoaded(true);
      }).catch((error) => {
        console.error('Failed to load keychain-sdk:', error);
      });
    }
  }, []);

  return {
    KeychainSDK: keychainSDK,
    KeychainRequestTypes: keychainTypes?.KeychainRequestTypes,
    KeychainKeyTypes: keychainTypes?.KeychainKeyTypes,
    isLoaded,
  };
};
