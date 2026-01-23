/**
 * Main translations file for Skatehive i18n
 * 
 * All translation content is now split into separate per-language files
 * located in the ./locales/ directory for better maintainability.
 * 
 * Structure:
 * - lib/i18n/locales/en.ts - English translations
 * - lib/i18n/locales/pt-BR.ts - Portuguese (Brazil) translations
 * - lib/i18n/locales/es.ts - Spanish translations
 * - lib/i18n/locales/lg.ts - Luganda (Uganda) translations
 * - lib/i18n/types.ts - TypeScript schema interface
 */

import { en } from './locales/en';
import { ptBR } from './locales/pt-BR';
import { es } from './locales/es';
import { lg } from './locales/lg';

// Main translations object combining all language files
export const translations = {
  en,
  'pt-BR': ptBR,
  es,
  lg,
} as const;

// Type exports for type-safe translation usage
export type Locale = keyof typeof translations;
export type TranslationKeys = typeof translations['en'];

// Configuration exports
export const locales: Locale[] = ['en', 'pt-BR', 'es', 'lg'];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  'en': 'English',
  'pt-BR': 'Português',
  'es': 'Español',
  'lg': 'Luganda',
};
