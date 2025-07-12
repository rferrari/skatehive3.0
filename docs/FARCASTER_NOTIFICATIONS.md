# Farcaster Notifications Integration Guide

This guide explains how to integrate SkateHive with Farcaster miniapp notifications, allowing Hive blockchain notifications to be sent to Farcaster users.

## Overview

The integration consists of several components:

1. **Farcaster Miniapp Manifest** - Declares SkateHive as a Farcaster miniapp
2. **Webhook Handler** - Receives events when users add/remove the miniapp
3. **Token Store** - Manages Farcaster notification tokens
4. **Notification Service** - Sends notifications to Farcaster clients
5. **React Hook** - Provides easy integration in React components
6. **API Endpoints** - For testing and management

## Setup

### 1. Farcaster Manifest

The manifest at `/.well-known/farcaster.json` declares SkateHive as a Farcaster miniapp:

```json
{
  "accountAssociation": {
    "header": "...", // JFS signature header
    "payload": "...", // JFS signature payload  
    "signature": "..." // JFS signature
  },
  "miniapp": {
    "version": "1",
    "name": "SkateHive",
    "webhookUrl": "https://skatehive.app/api/farcaster/webhook",
    // ... other metadata
  }
}
```

**Important**: The `accountAssociation` must be a valid JSON Farcaster Signature from your Farcaster account's custody address proving domain ownership.

# 2. Please Create
```bash
NEXT_PUBLIC_BASE_URL=https://skatehive.app
```

### 3. Deploy Webhook Endpoint

The webhook endpoint at `/api/farcaster/webhook` must be publicly accessible to receive events from Farcaster clients.

## How It Works

### User Flow

1. User adds SkateHive as a Farcaster miniapp
2. Farcaster client sends `miniapp_added` event to webhook
3. SkateHive stores the notification token and URL
4. User links their Hive username to their Farcaster FID
5. When Hive notifications occur, they're forwarded to Farcaster

### Webhook Events

The webhook receives these events from Farcaster clients:

- `miniapp_added` - User adds SkateHive, includes notification token
- `miniapp_removed` - User removes SkateHive
- `notifications_enabled` - User re-enables notifications
- `notifications_disabled` - User disables notifications

### Notification Flow

1. Hive blockchain generates notification (vote, comment, follow, etc.)
2. SkateHive fetches new notifications via Hive API
3. New notifications are converted to Farcaster format
4. Notifications are sent to relevant Farcaster clients
5. Users receive push notifications in their Farcaster apps

## Usage

### Basic Hook Usage

```tsx
import { useFarcasterNotifications } from '@/hooks/useFarcasterNotifications';

function MyComponent() {
  const { status, linkToFarcaster, sendNotification } = useFarcasterNotifications();

  // Link user's Hive account to Farcaster FID
  const handleLink = async () => {
    const success = await linkToFarcaster('12345'); // Farcaster FID
    if (success) {
      console.log('Linked successfully!');
    }
  };

  // Send custom notification
  const handleNotify = async () => {
    await sendNotification({
      type: 'vote',
      title: '👍 New Vote',
      body: 'Someone voted on your post!',
      hiveUsername: 'skatehive',
      sourceUrl: 'https://skatehive.app/post/skatehive/awesome-trick'
    });
  };

  return (
    <div>
      <p>Farcaster connected: {status.isConnected ? 'Yes' : 'No'}</p>
      <p>Active tokens: {status.tokenCount}</p>
      <button onClick={handleLink}>Link to Farcaster</button>
      <button onClick={handleNotify}>Send Test Notification</button>
    </div>
  );
}
```

### Context Integration

```tsx
import { useNotifications } from '@/contexts/NotificationContext';

function NotificationSettings() {
  const { 
    farcasterEnabled, 
    enableFarcasterNotifications, 
    disableFarcasterNotifications 
  } = useNotifications();

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={farcasterEnabled}
          onChange={(e) => {
            if (e.target.checked) {
              enableFarcasterNotifications();
            } else {
              disableFarcasterNotifications();
            }
          }}
        />
        Enable Farcaster Notifications
      </label>
    </div>
  );
}
```

## API Endpoints

### Webhook Endpoint
- **POST** `/api/farcaster/webhook`
- Receives signed events from Farcaster clients
- Automatically processes miniapp events

### Link Management
- **POST** `/api/farcaster/link` - Link Hive user to Farcaster FID
- **GET** `/api/farcaster/link?hiveUsername=skatehive` - Get Farcaster links for Hive user
- **GET** `/api/farcaster/link?fid=12345` - Get Hive user for Farcaster FID

### Test Notifications
- **POST** `/api/farcaster/notify` - Send test notification
- **GET** `/api/farcaster/notify` - Get usage documentation

### Example API Usage

```bash
# Link Hive user to Farcaster FID
curl -X POST https://skatehive.app/api/farcaster/link \\
  -H "Content-Type: application/json" \\
  -d '{"fid": "12345", "hiveUsername": "skatehive"}'

# Send test notification
curl -X POST https://skatehive.app/api/farcaster/notify \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "vote",
    "title": "🛹 New Vote",
    "body": "Someone voted on your skate video!",
    "targetUsers": ["skatehive"]
  }'
```

## Notification Types

The system supports these Hive notification types:

- **vote** - Someone voted on your content
- **comment** - Someone commented on your content  
- **follow** - Someone followed you
- **mention** - Someone mentioned you
- **reblog** - Someone reblogged your content
- **transfer** - Someone sent you tokens

Each type gets converted to appropriate Farcaster notification format with:
- Emoji icon in title
- Descriptive message body
- Link back to relevant SkateHive page

## Rate Limits

Farcaster imposes rate limits:
- 1 notification per 30 seconds per token
- 100 notifications per day per token

The system automatically handles rate limiting and retries.

## Error Handling

The system handles various error scenarios:
- Invalid tokens (removes from store)
- Rate limiting (retries later)
- Network failures (retries with backoff)
- Malformed notifications (logs and skips)

## Testing

### 1. Use the Demo Component

Add the demo component to test functionality:

```tsx
import { FarcasterNotificationDemo } from '@/components/FarcasterNotificationDemo';

function TestPage() {
  return <FarcasterNotificationDemo />;
}
```

### 2. Test API Endpoints

Use the provided API endpoints to test integration without a full Farcaster setup.

### 3. Local Development

For local testing, use tools like ngrok to expose your webhook endpoint:

```bash
ngrok http 3000
# Update farcaster.json webhookUrl to ngrok URL
```

## Production Deployment

### 1. Domain Verification

Ensure your `farcaster.json` manifest includes a valid `accountAssociation` with:
- Correct domain in payload
- Valid signature from your Farcaster account
- Proper base64url encoding

### 2. HTTPS Required

Farcaster requires HTTPS for webhook URLs. Ensure your deployment supports HTTPS.

### 3. Database Storage

In production, replace the in-memory token store with persistent database storage:

```typescript
// Replace farcasterTokenStore with database implementation
class DatabaseTokenStore implements TokenStore {
  async addToken(fid: string, username: string, token: string, url: string) {
    // Store in database
  }
  // ... other methods
}
```

### 4. Monitoring

Monitor webhook endpoints and notification delivery:
- Log all webhook events
- Track notification success/failure rates
- Monitor for invalid tokens
- Alert on high error rates

## Security Considerations

1. **Signature Verification** - Always verify Farcaster signatures
2. **Rate Limiting** - Implement additional rate limiting on webhook endpoints
3. **Token Security** - Store notification tokens securely
4. **Input Validation** - Validate all webhook payloads
5. **Error Handling** - Don't expose internal errors in API responses

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check manifest is accessible at `/.well-known/farcaster.json`
   - Verify webhook URL is correct and HTTPS
   - Check domain ownership signature

2. **Notifications not sending**
   - Verify tokens are stored correctly
   - Check Farcaster client rate limits
   - Validate notification format

3. **Linking fails**
   - Ensure FID exists and has SkateHive added
   - Check Hive username is correct
   - Verify token is active

### Debug Information

Use the debug functions to troubleshoot:

```typescript
const { getDebugInfo } = useFarcasterNotifications();
console.log(getDebugInfo());
```

This shows:
- Current status
- All stored tokens
- Recent notifications
- Processing state

## Future Enhancements

Potential improvements:

1. **Database Integration** - Persistent token storage
2. **User Preferences** - Granular notification settings
3. **Analytics** - Notification delivery metrics
4. **Batching** - Group notifications efficiently
5. **Templates** - Customizable notification templates

## Support

For issues or questions:
1. Check console logs for errors
2. Use debug endpoints for diagnostics
3. Verify Farcaster manifest is valid
4. Test with API endpoints first

Remember to test thoroughly in development before deploying to production!
