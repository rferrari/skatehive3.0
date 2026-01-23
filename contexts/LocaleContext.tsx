'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, Locale, defaultLocale, locales } from '@/lib/i18n/translations';

const LOCALE_STORAGE_KEY = 'skatehive-locale';

// Export the translation function type for use in other modules
export type TranslationFunction = (key: string) => string;

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationFunction;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return the key if not found
    }
  }
  return typeof result === 'string' ? result : path;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved locale from localStorage
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved && locales.includes(saved as Locale)) {
        setLocaleState(saved as Locale);
        return;
      }
    } catch {
      // localStorage unavailable, fall through to auto-detection
    }
    // Auto-detect from browser
    const browserLang = navigator.language;
    if (browserLang.startsWith('pt')) {
      setLocaleState('pt-BR');
    } else if (browserLang.startsWith('es')) {
      setLocaleState('es');
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {
      // Ignore storage errors - locale will still work for this session
    }
  }, []);


  const t = useCallback((key: string): string => {
    const currentTranslations = translations[locale];
    const value = getNestedValue(currentTranslations, key);
    if (value === key) {
      // Fallback to English
      return getNestedValue(translations[defaultLocale], key);
    }
    return value;
  }, [locale]);

  // Prevent hydration mismatch by rendering children only after mount
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    // Return fallback when not in provider (SSR)
    return {
      locale: defaultLocale,
      setLocale: () => {},
      t: (key: string) => getNestedValue(translations[defaultLocale], key),
    };
  }
  return context;
}

export function useTranslations(namespace?: string) {
  const { t, locale } = useLocale();
  
  return useCallback((key: string): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return t(fullKey);
  }, [t, namespace]);
}
