# Farcaster Auth Kit Integration

This document explains the Farcaster Auth Kit integration in the SkateHive application.

## Overview

The Farcaster Auth Kit integration replaces manual FID and username input with a secure "Sign In with Farcaster" button. Users can now authenticate directly with their Farcaster account and automatically link it to their SkateHive profile.

## Changes Made

### 1. Dependencies Added
- `@farcaster/auth-kit` - The official Farcaster authentication library

### 2. Provider Setup
The `AuthKitProvider` has been added to `app/providers.tsx` with the following configuration:
```tsx
const farcasterAuthConfig = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: process.env.NEXT_PUBLIC_DOMAIN || 'skatehive.app',
  siweUri: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://skatehive.app'}/api/auth/farcaster`,
};
```

### 3. Component Updates
The `FarcasterAccountLink` component now:
- Uses the `SignInButton` from `@farcaster/auth-kit`
- Automatically obtains FID and username from the authentication flow
- Shows different states based on authentication status
- Provides better error handling and user feedback

## User Experience

### Before Linking
1. User sees a "Sign In with Farcaster" button
2. Clicking the button opens the Farcaster authentication flow
3. User scans QR code with their Farcaster app or is redirected on mobile
4. Upon successful authentication, the account is automatically linked

### After Linking
1. User sees their connected Farcaster account details
2. Can toggle notification preferences
3. Can unlink their account if needed

## Environment Variables

Add these variables to your `.env.local` file:

```bash
NEXT_PUBLIC_DOMAIN=skatehive.app
NEXT_PUBLIC_BASE_URL=https://skatehive.app
```

## Security Features

- Authentication is handled entirely by Farcaster's secure infrastructure
- No manual input of sensitive information required
- Server-side validation of authentication results
- Proper error handling for failed authentication attempts

## Development Notes

- The AuthKit provider is wrapped around the entire application in the providers hierarchy
- CSS styles are automatically imported from `@farcaster/auth-kit/styles.css`
- The component gracefully handles both authenticated and non-authenticated states
- Uses React hooks like `useCallback` to optimize performance and prevent dependency issues

## Testing

To test the integration:
1. Start the development server: `pnpm dev`
2. Navigate to the Farcaster settings page
3. Try the "Sign In with Farcaster" button
4. Verify that authentication and linking work correctly

## Troubleshooting

Common issues and solutions:
- Ensure environment variables are properly set
- Verify that the domain matches your application's actual domain
- Check that the Optimism RPC endpoint is accessible
- Ensure proper provider hierarchy in the app structure
