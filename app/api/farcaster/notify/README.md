# Farcaster Notify API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Sends notifications to Farcaster users who have linked their Hive accounts. Supports individual, targeted, and broadcast notifications. Admin-only operations (broadcast, custom, test types) require authentication.

**Status**: ✅ Active (Production)  
**Methods**: `POST`, `GET`  
**Path**: `/api/farcaster/notify`

## Endpoints

### POST /api/farcaster/notify

Sends notification to Farcaster users.

**Request Body:**
```json
{
  "type": "vote",
  "title": "New Upvote",
  "body": "alice upvoted your post",
  "hiveUsername": "bob",
  "targetUsers": ["bob", "charlie"],
  "sourceUrl": "https://skatehive.app/post/...",
  "broadcast": false,
  "adminUsername": "skatehive"
}
```

**Fields:**
- `type` (string): Notification type (vote, comment, follow, etc.)
- `title` (string): Max 32 characters (Farcaster limit)
- `body` (string): Max 128 characters (Farcaster limit)
- `hiveUsername` (string, optional): Source username
- `targetUsers` (array, optional): Specific users to notify
- `sourceUrl` (string, optional): URL to open when clicked
- `broadcast` (boolean, optional): Send to all users (admin only)
- `adminUsername` (string, optional): Required for admin operations

**Response (200 OK):**
```json
{
  "success": true,
  "results": [
    {
      "user": "bob",
      "sent": true
    }
  ],
  "notification": {
    "type": "vote",
    "title": "New Upvote",
    "body": "alice upvoted your post"
  },
  "message": "Notification sent"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Admin privileges required"
}
```

### GET /api/farcaster/notify

Returns API documentation.

**Response (200 OK):**
```json
{
  "message": "SkateHive Farcaster Notification Test Endpoint",
  "usage": {
    "method": "POST",
    "body": {...}
  },
  "examples": {...}
}
```

## Notification Types

| Type | Admin Only | Use Case |
|------|-----------|----------|
| `vote` | No | Upvote/downvote notifications |
| `comment` | No | Reply notifications |
| `follow` | No | New follower |
| `mention` | No | Username mentioned |
| `reblog` | No | Post reblogged |
| `transfer` | No | Token received |
| `custom` | Yes | Custom messages |
| `test` | Yes | Testing |

## Admin Authentication

Admin operations require:
```javascript
const isAdminOperation = broadcast || ['custom', 'test'].includes(type);

if (isAdminOperation) {
  if (!isServerSideAdmin(adminUsername)) {
    return createUnauthorizedResponse();
  }
}
```

## Notification Structure

```javascript
{
  type: 'vote',
  title: 'New Vote', // Max 32 chars
  body: 'alice upvoted your post', // Max 128 chars
  hiveUsername: 'alice',
  sourceUrl: 'https://skatehive.app/...',
  metadata: {
    author: 'alice',
    permlink: 'post-permlink'
  }
}
```

## Usage Examples

### Send to Specific User
```javascript
await fetch('/api/farcaster/notify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'vote',
    title: '👍 New Vote',
    body: 'alice upvoted your post',
    targetUsers: ['bob'],
    sourceUrl: 'https://skatehive.app/post/...'
  })
});
```

### Broadcast to All Users (Admin Only)
```javascript
await fetch('/api/farcaster/notify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'custom',
    title: '📢 Announcement',
    body: 'New feature released!',
    broadcast: true,
    adminUsername: 'skatehive',
    sourceUrl: 'https://skatehive.app/updates'
  })
});
```

### Custom Notification
```javascript
await fetch('/api/farcaster/notify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'custom',
    title: '🎉 Contest Winner',
    body: 'Congratulations bob!',
    targetUsers: ['bob'],
    adminUsername: 'skatehive'
  })
});
```

## Character Limits

Farcaster enforces strict limits:
- **Title**: 32 characters (truncated automatically)
- **Body**: 128 characters (truncated automatically)

Example:
```javascript
title: title.substring(0, 32)
body: messageBody.substring(0, 128)
```

## Target User Resolution

1. **Broadcast**: `broadcast: true` → All linked users
2. **Targeted**: `targetUsers: ['user1', 'user2']` → Specific users
3. **Single**: `hiveUsername: 'user1'` → Converted to `targetUsers: ['user1']`

## Related Endpoints

- `/api/farcaster/link-skatehive` - Link users
- `/api/farcaster/status` - Check token status
- `/api/cron` - Automated notifications

## Security

🔥 **High Priority:**
1. Broadcast requires admin authentication ✅
2. Custom/test types require admin ✅
3. Rate limiting recommended (not implemented)
4. Add logging for audit trail

## Testing

Test notification:
```bash
curl -X POST https://skatehive.app/api/farcaster/notify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "title": "Test",
    "body": "Testing notifications",
    "targetUsers": ["yourusername"],
    "adminUsername": "skatehive"
  }'
```

## Dependencies

- `@/lib/farcaster/notification-service` - Sends notifications
- `@/lib/server/adminUtils` - Admin verification
- `@/types/farcaster` - Type definitions

## Notes

- Title/body automatically truncated
- Notifications sent via Farcaster API
- Requires active Farcaster tokens
- Deduplication handled by notification service
- Broadcast sends to all linked users
- Admin username validated server-side
