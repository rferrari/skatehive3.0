# Farcaster Integration

This document explains the Farcaster integration in the SkateHive application, supporting both web authentication and Farcaster miniapp contexts.

## Overview

The Farcaster integration provides two authentication methods:

1. **Web Authentication**: Uses Farcaster Auth Kit for browser-based sign-in
2. **Miniapp Authentication**: Uses Farcaster SDK for seamless authentication within the Farcaster miniapp

Users can authenticate directly with their Farcaster account and automatically link it to their SkateHive profile.

## Changes Made

### 1. Dependencies Added

- `@farcaster/auth-kit` - The official Farcaster authentication library for web
- `@farcaster/miniapp-sdk` - The official Farcaster SDK for miniapp contexts
- `@farcaster/frame-sdk` - Supporting SDK for frame interactions

### 2. Provider Setup

The `AuthKitProvider` has been added to `app/providers.tsx` with the following configuration:

```tsx
const farcasterAuthConfig = {
  rpcUrl: "https://mainnet.optimism.io",
  domain: process.env.NEXT_PUBLIC_DOMAIN || "skatehive.app",
  // siweUri is optional - Auth Kit handles SIWE verification internally
  // Only needed if you want custom server-side session management
};
```

### 3. Component Updates

The integration now includes multiple components:

**`FarcasterUniversalLink`** (Recommended):

- Automatically detects web vs. miniapp context
- Routes to appropriate authentication method
- Provides seamless user experience across platforms

**`FarcasterAccountLink`** (Web-only):

- Uses the `SignInButton` from `@farcaster/auth-kit`
- Automatically obtains FID and username from the authentication flow
- Shows different states based on authentication status
- Implements session persistence across page refreshes and browser restarts

**`useFarcasterMiniapp`** Hook:

- **Proper Detection**: Uses `sdk.isInMiniApp()` for accurate context detection
- **Fast Performance**: Optimized detection with caching and short-circuiting
- **SDK Actions**: Provides `openUrl`, `close`, and `composeCast` functionality
- **Error Handling**: Graceful fallbacks for non-miniapp environments

**`FarcasterMiniappLink`** (Miniapp-only):

- Uses `@farcaster/miniapp-sdk` for context-aware authentication
- Automatically obtains user data from Farcaster miniapp context
- **NEW**: No sign-in required - user is already authenticated in miniapp
- **NEW**: Optimized UI for miniapp experience
- **NEW**: Debug information to help with development

**Common Features**:

- Provides better error handling and user feedback
- **NEW**: Sends welcome notifications to users when they connect their accounts
- **NEW**: Includes disconnect/unlink functionality
- **NEW**: Custom session management with 7-day expiration (web only)

## User Experience

### Web Browser Experience

#### Before Linking

1. User sees a "Sign In with Farcaster" button
2. Clicking the button opens the Farcaster authentication flow
3. User scans QR code with their Farcaster app or is redirected on mobile
4. Upon successful authentication, the account is automatically linked
5. **NEW**: User receives a welcome notification in their Farcaster client

#### After Linking

1. User sees their connected Farcaster account details
2. Can toggle notification preferences
3. Can unlink their account if needed
4. **NEW**: Can sign out from the Farcaster Auth Kit session (orange "Sign Out" button)

### Farcaster Miniapp Experience

#### Automatic Authentication

1. User is automatically authenticated when accessing SkateHive through Farcaster
2. User sees their Farcaster profile details immediately
3. **NEW**: No additional sign-in required - seamless experience
4. Can directly link their account to SkateHive with one click

#### After Linking

1. User sees their connected account status
2. Can toggle notification preferences
3. Can unlink their account if needed
4. **NEW**: Optimized UI for mobile/miniapp experience

### Disconnect Options

- **Unlink**: Removes the connection between Hive and Farcaster accounts (red button)
- **Sign Out**: Signs out from the current Farcaster Auth Kit session (orange button)

## Features

### Session Persistence

The integration now includes robust session management:

- **Automatic Session Storage**: User authentication state is stored in browser localStorage
- **7-Day Session Expiry**: Sessions automatically expire after 7 days for security
- **Cross-Tab Support**: Authentication state is shared across browser tabs
- **Graceful Restoration**: Sessions are restored on page refresh and browser restart
- **Visual Feedback**: Users can see when their session has been restored
- **Clean Logout**: Session data is properly cleared when users sign out

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

### Miniapp Detection

- Uses the official `sdk.isInMiniApp()` method for accurate detection
- Implements fast short-circuiting for server-side rendering scenarios
- Caches results for improved performance on subsequent calls
- Provides debug information in development mode

### Web vs Miniapp Architecture

- **Web**: Uses AuthKit provider with session persistence and QR code authentication
- **Miniapp**: Uses SDK context with automatic user detection and native actions
- **Universal Component**: Automatically routes to appropriate implementation

### Performance Optimizations

- The AuthKit provider is wrapped around the entire application in the providers hierarchy
- CSS styles are automatically imported from `@farcaster/auth-kit/styles.css`
- Components gracefully handle both authenticated and non-authenticated states
- Uses React hooks like `useCallback` to optimize performance and prevent dependency issues
- Welcome notifications are sent asynchronously and don't block the main linking flow
- SDK detection is optimized with timeouts and caching

## API Integration

The component integrates with several SkateHive API endpoints:

- `/api/farcaster/link-skatehive` - Links Farcaster account to Hive username
- `/api/farcaster/notify` - Sends welcome notifications to users
- `/api/farcaster/user-preferences` - Manages user notification preferences
- `/api/farcaster/unlink` - Removes account connections

## Testing

To test the integration:

### Web Browser Testing

1. Start the development server: `pnpm dev`
2. Navigate to the Farcaster settings page in a web browser
3. Try the "Sign in with Farcaster" button
4. Verify that authentication and linking work correctly
5. Check that a welcome notification is received in the Farcaster client
6. Test the disconnect functionality
7. Test session persistence across page refreshes

### Farcaster Miniapp Testing

1. Deploy your app or use a tunnel for local development
2. Access SkateHive through the Farcaster miniapp
3. Navigate to the Farcaster settings page
4. Verify automatic user detection and authentication
5. Test the account linking functionality
6. Verify the miniapp-optimized UI appears
7. Test notification preferences and unlinking

## Troubleshooting

Common issues and solutions:

- Ensure environment variables are properly set (though they have fallback values)
- Verify that the domain matches your application's actual domain
- Check that the Optimism RPC endpoint is accessible
- Ensure proper provider hierarchy in the app structure
- Welcome notifications may not be delivered if the user hasn't enabled notifications in their Farcaster client
- If authentication fails, check browser console for detailed error messages
- The Auth Kit handles SIWE verification internally, so no custom server endpoint is needed
