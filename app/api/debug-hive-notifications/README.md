# Debug Hive Notifications API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Development/debugging endpoint that fetches raw Hive blockchain notifications for a user using the server-side Hive client. Returns unfiltered notification data for troubleshooting.

**Status**: 🧪 Testing/Debug  
**Method**: `GET`  
**Path**: `/api/debug-hive-notifications`

## Endpoint

### GET /api/debug-hive-notifications

Fetches Hive notifications for debugging.

**Query Parameters:**
- `username` (string, optional): Hive username (default: "xvlad")

**Example URL:**
```
/api/debug-hive-notifications?username=alice
```

**Response (200 OK):**
```json
{
  "success": true,
  "username": "alice",
  "notifications": [
    {
      "type": "vote",
      "voter": "bob",
      "weight": 10000,
      "timestamp": "2025-01-15T10:30:00",
      "permlink": "my-post"
    },
    {
      "type": "comment",
      "author": "charlie",
      "body": "Great post!",
      "timestamp": "2025-01-15T10:25:00"
    }
  ]
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message details"
}
```

## Notification Types

Hive supports various notification types:
- `vote` - Upvote/downvote on posts/comments
- `comment` - Reply to post/comment
- `mention` - Username mentioned in post
- `follow` - New follower
- `reblog` - Post reblogged/resteemed
- `transfer` - Token transfer received
- `reply` - Direct reply notification

## Usage Examples

### JavaScript/Fetch
```javascript
const response = await fetch('/api/debug-hive-notifications?username=alice');
const { success, notifications } = await response.json();

if (success) {
  console.log('Notifications:', notifications);
  notifications.forEach(n => {
    console.log(`${n.type} from ${n.author || n.voter}`);
  });
}
```

### Debug Component
```jsx
function NotificationDebugger() {
  const [username, setUsername] = useState('xvlad');
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    const response = await fetch(`/api/debug-hive-notifications?username=${username}`);
    const data = await response.json();
    if (data.success) {
      setNotifications(data.notifications);
    }
  };

  return (
    <div>
      <input value={username} onChange={e => setUsername(e.target.value)} />
      <button onClick={fetchNotifications}>Fetch</button>
      <pre>{JSON.stringify(notifications, null, 2)}</pre>
    </div>
  );
}
```

### cURL
```bash
curl "https://skatehive.app/api/debug-hive-notifications?username=alice"
```

## Server-Side Hive Client

Uses `serverHiveClient` from `@/lib/hive/server-client`:
```javascript
import { serverHiveClient } from '@/lib/hive/server-client';
const notifications = await serverHiveClient.fetchNotifications(username);
```

## Related Endpoints

- `/api/farcaster/notifications-queue` - Filtered notifications for Farcaster
- `/api/cron` - Automated notification processing
- `/api/farcaster/test-notifications` - Test notification system

## Use Cases

1. **Debugging**: Verify notification fetching works
2. **Testing**: Check notification format/structure
3. **Development**: Test new notification types
4. **Monitoring**: Check if Hive API is responsive

## Notes

- Default username is "xvlad" (for quick testing)
- Returns raw Hive API data (not processed)
- No filtering or deduplication applied
- Use for debugging only, not production
- No authentication required
