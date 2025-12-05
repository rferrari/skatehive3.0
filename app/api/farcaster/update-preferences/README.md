# Farcaster Update Preferences API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Updates notification preferences for a Hive user linked to Farcaster. Allows users to control which types of notifications they receive.

**Status**: ✅ Active (Production)  
**Method**: `POST`  
**Path**: `/api/farcaster/update-preferences`

## Endpoint

### POST /api/farcaster/update-preferences

Updates notification preferences.

**Request Body:**
```json
{
  "hiveUsername": "alice",
  "preferences": {
    "notificationsEnabled": true,
    "notifyOnVotes": false,
    "notifyOnComments": true,
    "notifyOnFollows": false
  }
}
```

**Required Fields:**
- `hiveUsername` (string): Hive account name
- `preferences` (object): Preference updates (partial allowed)

**Available Preferences:**
- `notificationsEnabled` (boolean): Master toggle
- `notifyOnVotes` (boolean): Upvote/downvote notifications
- `notifyOnComments` (boolean): Reply notifications
- `notifyOnFollows` (boolean): New follower notifications
- `notifyOnMentions` (boolean): Mention notifications
- `notifyOnReblogs` (boolean): Reblog notifications
- `notifyOnTransfers` (boolean): Token transfer notifications

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Preferences updated successfully"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "User not found or not linked to Farcaster"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid preferences"
}
```

## Database Update

```sql
UPDATE skatehive_farcaster_preferences
SET
  notifications_enabled = COALESCE($1, notifications_enabled),
  notify_on_votes = COALESCE($2, notify_on_votes),
  notify_on_comments = COALESCE($3, notify_on_comments),
  notify_on_follows = COALESCE($4, notify_on_follows),
  updated_at = NOW()
WHERE hive_username = $5;
```

## Usage Examples

### Update Specific Preference
```javascript
const response = await fetch('/api/farcaster/update-preferences', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hiveUsername: 'alice',
    preferences: {
      notifyOnVotes: false // Only update this one
    }
  })
});

const data = await response.json();
if (data.success) {
  console.log('Preferences updated');
}
```

### Disable All Notifications
```javascript
await fetch('/api/farcaster/update-preferences', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hiveUsername: 'alice',
    preferences: {
      notificationsEnabled: false
    }
  })
});
```

### React Settings Component
```jsx
function NotificationSettings({ hiveUsername }) {
  const [preferences, setPreferences] = useState({
    notificationsEnabled: true,
    notifyOnVotes: true,
    notifyOnComments: true,
    notifyOnFollows: false
  });
  const [saving, setSaving] = useState(false);

  const handleToggle = async (key) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };
    
    setPreferences(newPreferences);
    setSaving(true);

    const response = await fetch('/api/farcaster/update-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hiveUsername,
        preferences: { [key]: newPreferences[key] }
      })
    });

    setSaving(false);

    const data = await response.json();
    if (!data.success) {
      alert('Failed to update preferences');
      // Revert on failure
      setPreferences(preferences);
    }
  };

  return (
    <div>
      <h3>Notification Preferences</h3>
      
      <label>
        <input
          type="checkbox"
          checked={preferences.notificationsEnabled}
          onChange={() => handleToggle('notificationsEnabled')}
        />
        Enable all notifications
      </label>

      <label>
        <input
          type="checkbox"
          checked={preferences.notifyOnVotes}
          onChange={() => handleToggle('notifyOnVotes')}
          disabled={!preferences.notificationsEnabled}
        />
        Notify on votes
      </label>

      <label>
        <input
          type="checkbox"
          checked={preferences.notifyOnComments}
          onChange={() => handleToggle('notifyOnComments')}
          disabled={!preferences.notificationsEnabled}
        />
        Notify on comments
      </label>

      {saving && <div>Saving...</div>}
    </div>
  );
}
```

### Batch Update
```javascript
await fetch('/api/farcaster/update-preferences', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hiveUsername: 'alice',
    preferences: {
      notifyOnVotes: true,
      notifyOnComments: true,
      notifyOnFollows: false,
      notifyOnMentions: true
    }
  })
});
```

## Partial Updates

Only provided preferences are updated:
```javascript
// This only updates notifyOnVotes, others remain unchanged
{
  hiveUsername: 'alice',
  preferences: {
    notifyOnVotes: false
  }
}
```

## Master Toggle Behavior

When `notificationsEnabled: false`:
- All notifications are disabled
- Individual preferences are preserved
- Re-enabling master toggle restores previous settings

## Related Endpoints

- `/api/farcaster/user-preferences` - Get current preferences
- `/api/farcaster/link-skatehive` - Set initial preferences
- `/api/farcaster/user-status` - Check link status

## Security

⚠️ **Medium Priority:**
- No authentication (anyone can update if they know username)
- Add session/JWT verification
- Verify user owns Hive account

## Testing

Test preference update:
```bash
curl -X POST https://skatehive.app/api/farcaster/update-preferences \
  -H "Content-Type: application/json" \
  -d '{
    "hiveUsername": "testuser",
    "preferences": {
      "notifyOnVotes": false
    }
  }'
```

## Dependencies

- `@/lib/farcaster/skatehive-integration` - Preference management

## Notes

- Partial updates supported
- Unspecified fields remain unchanged
- Validates before updating
- Returns 404 if user not linked
- Atomic operation (all or nothing)
- Master toggle overrides individual settings
