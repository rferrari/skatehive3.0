# Community Toast Components

This folder contains refactored toast notification components for encouraging community engagement.

## Components

### 1. `CommunityToasts` (Main Component)

The main component that combines both toast functionalities.

```tsx
import CommunityToasts from '@/components/homepage/CommunityToasts';

// Basic usage
<CommunityToasts />

// With custom intervals
<CommunityToasts
  showInterval={180000}  // Show every 3 minutes
  displayDuration={20000} // Display for 20 seconds
/>
```

### 2. `UpvoteSnapToast`

Handles encouraging users to upvote the main snap container post.

### 3. `WitnessVoteToast`

Handles encouraging users to vote for the SkateHive witness.

## Shared Components

### `ToastCard`

Reusable toast card component with consistent styling.

## Hooks

### `useIsDesktop`

Detects if the user is on a desktop device (≥768px width) without SSR issues.

### `usePeriodicTimer`

Safely manages periodic timers with automatic cleanup.

## Constants

### `toastConfig.ts`

Centralized configuration for all toast-related constants:

- `SHOW_INTERVAL`: How often to show toasts (default: 2 minutes)
- `DISPLAY_DURATION`: How long to display toasts (default: 16 seconds)
- `INITIAL_DELAY`: Initial delay before first toast (default: 5 seconds)
- `WITNESS_DELAY`: Delay for witness toast (default: 15 seconds)
- `VOTE_WEIGHT`: Vote weight for upvotes (10000 = 100%)
- `DESKTOP_BREAKPOINT`: Minimum width for desktop (768px)

## Features

✅ **Separated Concerns**: Each toast type has its own component
✅ **Reusable Components**: Shared toast card and hooks
✅ **Type Safety**: Full TypeScript support
✅ **Memory Safe**: Proper timer cleanup
✅ **Responsive**: Only shows on desktop
✅ **Rate Limited**: Prevents spam notifications
✅ **Configurable**: Easy to customize intervals and behavior
✅ **Error Handling**: Comprehensive error handling and user feedback

## Migration

To replace the old `UpvoteSnapToast` component:

```tsx
// Old way
import UpvoteSnapToast from "@/components/homepage/UpvoteSnapToast";

// New way
import CommunityToasts from "@/components/homepage/CommunityToasts";
```

The new `CommunityToasts` component provides all the functionality of the original component but with better structure and maintainability.
