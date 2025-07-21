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
  // siweUri is optional - Auth Kit handles SIWE verification internally
  // Only needed if you want custom server-side session management
};
```

### 3. Component Updates
The `FarcasterAccountLink` component now:
- Uses the `SignInButton` from `@farcaster/auth-kit`
- Automatically obtains FID and username from the authentication flow
- Shows different states based on authentication status
- Provides better error handling and user feedback
- **NEW**: Sends welcome notifications to users when they connect their accounts
- **NEW**: Includes disconnect/sign-out functionality for Farcaster Auth Kit sessions

## User Experience

### Before Linking
1. User sees a "Sign In with Farcaster" button
2. Clicking the button opens the Farcaster authentication flow
3. User scans QR code with their Farcaster app or is redirected on mobile
4. Upon successful authentication, the account is automatically linked
5. **NEW**: User receives a welcome notification in their Farcaster client

### After Linking
1. User sees their connected Farcaster account details
2. Can toggle notification preferences
3. Can unlink their account if needed
4. **NEW**: Can sign out from the Farcaster Auth Kit session (orange "Sign Out" button)

### Disconnect Options
- **Unlink**: Removes the connection between Hive and Farcaster accounts (red button)
- **Sign Out**: Signs out from the current Farcaster Auth Kit session (orange button)

## Features

### Welcome Notifications
When a user successfully connects their Farcaster account:
- A welcome notification is automatically sent to their Farcaster client
- The notification includes:
  - Title: "🛹 Connected to SkateHive!"
  - Message: Welcome message with username
  - Deep link back to Farcaster settings page
- Uses the 'follow' notification type (no admin privileges required)
- Fails silently if notification cannot be sent (doesn't block main flow)

### Disconnect Functionality
- **Farcaster Auth Kit Sign Out**: Clears the current authentication session
- **Account Unlinking**: Removes the stored connection between accounts
- Both options provide appropriate user feedback

## Environment Variables

Add these variables to your `.env.local` file (optional - the app has fallback values):

```bash
NEXT_PUBLIC_DOMAIN=skatehive.app
NEXT_PUBLIC_BASE_URL=https://skatehive.app
```

Note: These environment variables are optional as the application provides fallback values.

## Security Features

- Authentication is handled entirely by Farcaster's secure infrastructure
- No manual input of sensitive information required
- Server-side validation of authentication results
- Proper error handling for failed authentication attempts
- Welcome notifications use non-admin notification types

## Development Notes

- The AuthKit provider is wrapped around the entire application in the providers hierarchy
- CSS styles are automatically imported from `@farcaster/auth-kit/styles.css`
- The component gracefully handles both authenticated and non-authenticated states
- Uses React hooks like `useCallback` to optimize performance and prevent dependency issues
- Welcome notifications are sent asynchronously and don't block the main linking flow

## API Integration

The component integrates with several SkateHive API endpoints:
- `/api/farcaster/link-skatehive` - Links Farcaster account to Hive username
- `/api/farcaster/notify` - Sends welcome notifications to users
- `/api/farcaster/user-preferences` - Manages user notification preferences
- `/api/farcaster/unlink` - Removes account connections

## Testing

To test the integration:
1. Start the development server: `pnpm dev`
2. Navigate to the Farcaster settings page
3. Try the "Sign In with Farcaster" button
4. Verify that authentication and linking work correctly
5. Check that a welcome notification is received in the Farcaster client
6. Test the disconnect functionality

## Troubleshooting

Common issues and solutions:
- Ensure environment variables are properly set (though they have fallback values)
- Verify that the domain matches your application's actual domain
- Check that the Optimism RPC endpoint is accessible
- Ensure proper provider hierarchy in the app structure
- Welcome notifications may not be delivered if the user hasn't enabled notifications in their Farcaster client
- If authentication fails, check browser console for detailed error messages
- The Auth Kit handles SIWE verification internally, so no custom server endpoint is needed
