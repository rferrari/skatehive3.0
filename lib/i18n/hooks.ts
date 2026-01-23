'use client';

import { useCallback } from 'react';
import { useLocale } from '@/contexts/LocaleContext';

/**
 * Hook to access translation function with namespace support
 * @param namespace - Optional namespace to prefix translation keys
 * @returns A function that takes a key and returns the translated string
 * 
 * Usage:
 * const t = useTranslations('wallet');
 * t('sendHive') // returns translated string for wallet.sendHive
 */
export function useTranslations(namespace?: string) {
  const { t } = useLocale();
  
  return useCallback((key: string): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return t(fullKey);
  }, [t, namespace]);
}
