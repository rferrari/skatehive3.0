# Skatehive i18n Structure

## Overview
The translation system has been split into separate per-language files for better maintainability and collaboration.

## File Structure

```
lib/i18n/
├── translations.ts         # Main export file (37 lines)
├── types.ts               # TypeScript schema interface
├── locales/
│   ├── en.ts             # English translations (~532 lines)
│   ├── pt-BR.ts          # Portuguese (Brazil) translations (~532 lines)
│   └── es.ts             # Spanish translations (~532 lines)
└── translations-old-backup.ts  # Backup of monolithic file (1610 lines)
```

## Benefits of This Structure

1. **Better Maintainability**: Each language in its own file (~532 lines vs 1610 lines monolithic)
2. **Easier Collaboration**: Multiple translators can work on different languages without merge conflicts
3. **Clear Diffs**: Git changes are isolated to specific languages
4. **Easier Navigation**: Find translations faster in smaller, focused files
5. **Type Safety**: All translations share the same TypeScript schema

## How It Works

### Main File (`translations.ts`)
The main file imports and re-exports all language files:

```typescript
import { en } from './locales/en';
import { ptBR } from './locales/pt-BR';
import { es } from './locales/es';

export const translations = {
  en,
  'pt-BR': ptBR,
  es,
} as const;
```

### Type Safety (`types.ts`)
The `TranslationSchema` interface defines the structure that all language files must follow. This ensures consistency across all translations.

### Usage in Components
Components continue to use translations exactly as before:

```typescript
import { useTranslations } from '@/contexts/LocaleContext';

function MyComponent() {
  const t = useTranslations('namespace');
  return <div>{t('key')}</div>;
}
```

## Adding New Translations

1. Add the key to `types.ts` in the appropriate namespace
2. Add translations for all 3 languages:
   - `locales/en.ts`
   - `locales/pt-BR.ts`
   - `locales/es.ts`
3. TypeScript will ensure all languages have the same keys

## Adding a New Language

1. Create `locales/{locale-code}.ts` with the same structure as `en.ts`
2. Import in `translations.ts`
3. Add to the `translations` object
4. Update the `Locale` type and `locales` array

## Translation Namespaces

- `navigation` - Navigation menu items
- `common` - Common UI labels
- `auth` - Authentication messages
- `wallet` - Wallet operations
- `compose` - Content creation
- `magazine` - Magazine page
- `loadingMessages` - Loading screen messages
- `upvoteToast` - Upvote notifications
- `settings` - Settings page
- `invite` - Invite page
- `blog` - Blog page
- `leaderboard` - Leaderboard page
- `forms` - Form placeholders, labels, errors
- `notifications` - Success/error/warning messages
- `modals` - Modal titles and actions
- `buttons` - Button labels
- `tooltips` - Tooltip text
- `views` - View mode labels
- `status` - Status indicators

## Migration Notes

- Old monolithic file backed up as `translations-old-backup.ts`
- All existing components continue to work without changes
- No breaking changes to the API
- File size reduced from 1610 lines to 37 lines (main file)
