# Agent Guidelines

This repository contains the **Skatehive 3.0** web application. It is a Next.js based community site for the Skatehive (Hive blockchain) community.

## Technology overview

- **Node.js** 20.x
- **Package manager:** pnpm 9.x (lockfile version 9). Always use `pnpm` for installs and scripts.
- **Next.js** 15.3.2
- **Chakra UI** 2.10.9 (icons 2.2.4)
- **Tailwind CSS** 4
- **React Query** for data caching
- **Wagmi** and **Viem** for Ethereum connectivity
- **Aioha** for Hive authentication and wallet support
- TypeScript is enabled via `tsconfig.json`.
- The project deploys on **Vercel** using the default Next.js build.

## Local setup

1. Copy `.env.local.example` to `.env.local` and update values.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the dev server:
   ```bash
   pnpm dev
   ```
4. Run lint checks with `pnpm lint`.

## Providers and dependencies

The main provider tree is defined in `app/providers.tsx`.
Key packages and their roles:

- **Aioha** – registers Hive auth options and manages wallets
- **Chakra UI** – theme and global styles through `ThemeProvider`
- **React Query** – data caching via `QueryClientProvider`
- **Wagmi** with **Viem** – Ethereum RPC connectivity
- **UserProvider** – stores Hive user information

Keep provider logic modular. New providers should live in their own modules under `app/` or `contexts/`.

When adding a dependency, verify the package and maintainer to avoid typosquatted packages. Check with `pnpm info <pkg>` and inspect its repository. Run `pnpm audit` after install and review subdependencies using `pnpm list <pkg>`.

For coding rules, file structure, and patterns, see `RULES.md`.
## Theme strategy

The application uses a centralized theming system via Chakra UI with multiple pre-defined themes.

### Theme structure

- **Theme files:** All themes are located in `/themes/` directory
- **Theme provider:** The `ThemeProvider` in `app/themeProvider.tsx` manages theme state
- **Available themes:** 18+ themes including `hackerPlus` (default), `forest`, `bluesky`, `cyberpunk`, `nounish`, `windows95`, `gruvbox-nogg`, etc.

### Theme requirements

Each theme file must export a Chakra UI theme object using `extendTheme()` with these **required color tokens:**

```typescript
colors: {
  background: string,      // Main background color
  text: string,            // Primary text color
  primary: string,         // Primary brand color
  secondary: string,       // Secondary brand color
  accent: string,          // Accent/highlight color
  muted: string,           // Muted background
  border: string,          // Border color
  error: string,           // Error state
  success: string,         // Success state
  warning: string,         // Warning state
  panel: string,           // Panel background
  panelHover: string,      // Panel hover state
  inputBg: string,         // Input background
  inputBorder: string,     // Input border
  inputText: string,       // Input text
  inputPlaceholder: string,// Input placeholder
  dim: string,             // Dimmed text
  subtle: string,          // Subtle backgrounds (usually rgba)
}
```

Themes may also define:
- `fonts` – heading, body, mono font families
- `fontSizes`, `fontWeights`, `lineHeights`
- `borders`, `shadows`, `radii`
- `components` – Chakra component style overrides (Button, Input, Card, etc.)

### Using themes in components

**DO:**
- Use semantic color tokens: `bg="background"`, `color="primary"`, `borderColor="border"`
- Use Chakra props: `<Box bg="panel" borderColor="border" />`
- Access theme via `useTheme()` hook when needed
- Test components with multiple themes

**DON'T:**
- Hard-code hex colors or specific color values
- Use color values that aren't defined in the theme
- Assume a specific color scheme (dark/light)

### Adding a new theme

1. Create a new file in `/themes/yourtheme.ts`
2. Use `extendTheme()` and include all required color tokens
3. Import and register in `app/themeProvider.tsx`:
   - Import: `import yourTheme from "@/themes/yourtheme"`
   - Add to `themeMap`: `yourtheme: yourTheme`
4. Export from `/themes/index.ts`

### Theme switching

Users can switch themes at runtime. The selected theme is persisted in `localStorage`. The fallback theme is `hackerPlus`. Theme can be overridden via `APP_CONFIG.THEME_OVERRIDE` or `APP_CONFIG.DEFAULT_THEME`.