# Farcaster User Preferences API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Retrieves notification preferences for a Hive user linked to Farcaster. Returns which notification types are enabled.

**Status**: ✅ Active (Production)  
**Method**: `GET`  
**Path**: `/api/farcaster/user-preferences`

## Endpoint

### GET /api/farcaster/user-preferences?hiveUsername=alice

Gets notification preferences for a Hive user.

**Query Parameters:**
- `hiveUsername` (string, required): Hive account name

**Response (200 OK):**
```json
{
  "hiveUsername": "alice",
  "fid": "12345",
  "farcasterUsername": "alice.eth",
  "preferences": {
    "notificationsEnabled": true,
    "notifyOnVotes": true,
    "notifyOnComments": true,
    "notifyOnFollows": false,
    "notifyOnMentions": true,
    "notifyOnReblogs": false,
    "notifyOnTransfers": false
  }
}
```

**Response (404 Not Found):**
```json
{
  "error": "User not found or not linked to Farcaster"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Hive username is required"
}
```

## Database Query

```sql
SELECT 
  fid,
  farcaster_username,
  hive_username,
  notifications_enabled,
  notify_on_votes,
  notify_on_comments,
  notify_on_follows,
  notify_on_mentions,
  notify_on_reblogs,
  notify_on_transfers
FROM skatehive_farcaster_preferences
WHERE hive_username = $1;
```

## Preference Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `notificationsEnabled` | boolean | true | Master toggle |
| `notifyOnVotes` | boolean | true | Upvote/downvote |
| `notifyOnComments` | boolean | true | Replies |
| `notifyOnFollows` | boolean | false | New followers |
| `notifyOnMentions` | boolean | true | @mentions |
| `notifyOnReblogs` | boolean | false | Post reblogged |
| `notifyOnTransfers` | boolean | false | Token transfers |

## Usage Examples

### Get Preferences
```javascript
const response = await fetch(
  '/api/farcaster/user-preferences?hiveUsername=alice'
);

const data = await response.json();

if (data.preferences) {
  console.log('Notifications:', data.preferences.notificationsEnabled);
  console.log('Votes:', data.preferences.notifyOnVotes);
}
```

### React Component
```jsx
function NotificationSettings({ hiveUsername }) {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPreferences() {
      const response = await fetch(
        `/api/farcaster/user-preferences?hiveUsername=${hiveUsername}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
      
      setLoading(false);
    }

    fetchPreferences();
  }, [hiveUsername]);

  if (loading) return <div>Loading preferences...</div>;
  if (!preferences) return <div>Not linked to Farcaster</div>;

  return (
    <div>
      <h3>Notification Preferences</h3>
      <ul>
        <li>Master: {preferences.notificationsEnabled ? '✅' : '❌'}</li>
        <li>Votes: {preferences.notifyOnVotes ? '✅' : '❌'}</li>
        <li>Comments: {preferences.notifyOnComments ? '✅' : '❌'}</li>
        <li>Follows: {preferences.notifyOnFollows ? '✅' : '❌'}</li>
      </ul>
    </div>
  );
}
```

### Check Before Sending
```javascript
async function shouldNotify(hiveUsername, notificationType) {
  const response = await fetch(
    `/api/farcaster/user-preferences?hiveUsername=${hiveUsername}`
  );
  
  const data = await response.json();
  
  if (!data.preferences) return false;
  
  const { preferences } = data;
  
  // Check master toggle
  if (!preferences.notificationsEnabled) return false;
  
  // Check specific notification type
  switch (notificationType) {
    case 'vote':
      return preferences.notifyOnVotes;
    case 'comment':
      return preferences.notifyOnComments;
    case 'follow':
      return preferences.notifyOnFollows;
    default:
      return false;
  }
}

// Usage
if (await shouldNotify('alice', 'vote')) {
  await sendNotification(...);
}
```

## Related Endpoints

- `/api/farcaster/update-preferences` - Update preferences
- `/api/farcaster/user-status` - Check link status
- `/api/farcaster/link-skatehive` - Initial preference setup

## Security

✅ **Low Risk:**
- Read-only endpoint
- User preferences (non-sensitive)
- No authentication required

📊 **Low Priority:**
- Add authentication to prevent enumeration
- Rate limit to prevent abuse

## Testing

Test preferences:
```bash
curl "https://skatehive.app/api/farcaster/user-preferences?hiveUsername=testuser"
```

## Dependencies

- `@/lib/farcaster/skatehive-integration` - Preferences lookup

## Notes

- Returns 404 if user not linked
- Preferences set during linking
- Can be updated via update-preferences endpoint
- Master toggle overrides all specific settings
- Default preferences can be configured in link endpoint
