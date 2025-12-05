# Farcaster Link SkateHive API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Links a Hive account to a Farcaster FID (Farcaster ID). Stores the connection in database and optionally updates the Hive profile to show Farcaster username. Enables cross-platform notifications.

**Status**: ✅ Active (Production)  
**Method**: `POST`  
**Path**: `/api/farcaster/link-skatehive`

## Endpoint

### POST /api/farcaster/link-skatehive

Links Hive and Farcaster accounts.

**Request Body:**
```json
{
  "hiveUsername": "alice",
  "fid": "12345",
  "farcasterUsername": "alice.eth",
  "preferences": {
    "notificationsEnabled": true,
    "notifyOnVotes": true,
    "notifyOnComments": true,
    "notifyOnFollows": true
  },
  "updateHiveProfile": true,
  "postingKey": "5J..."
}
```

**Required Fields:**
- `hiveUsername` (string): Hive account name
- `fid` (string): Farcaster ID
- `farcasterUsername` (string): Farcaster username

**Optional Fields:**
- `preferences` (object): Notification preferences
- `updateHiveProfile` (boolean): Update Hive profile metadata
- `postingKey` (string): Required if `updateHiveProfile` is true

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Account linked successfully",
  "hiveProfileUpdated": true,
  "hiveProfileMessage": "Profile updated with Farcaster info"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Missing required parameters"
}
```

## Preferences Structure

```javascript
{
  notificationsEnabled: boolean,     // Master toggle
  notifyOnVotes: boolean,           // Upvote notifications
  notifyOnComments: boolean,        // Reply notifications
  notifyOnFollows: boolean,         // New follower notifications
  notifyOnMentions: boolean,        // Mention notifications
  notifyOnReblogs: boolean,         // Reblog notifications
  notifyOnTransfers: boolean        // Token transfer notifications
}
```

## Database Operations

Stores link in `skatehive_farcaster_preferences`:
```sql
INSERT INTO skatehive_farcaster_preferences (
  fid,
  farcaster_username,
  hive_username,
  notifications_enabled,
  notify_on_votes,
  notify_on_comments,
  created_at
) VALUES ($1, $2, $3, $4, $5, $6, NOW())
ON CONFLICT (fid) DO UPDATE SET
  hive_username = $3,
  farcaster_username = $2,
  updated_at = NOW();
```

## Hive Profile Update

If `updateHiveProfile: true` and `postingKey` provided:

Updates Hive account profile JSON metadata:
```json
{
  "profile": {
    "farcaster": {
      "fid": "12345",
      "username": "alice.eth",
      "linked": true
    }
  }
}
```

Uses Hive posting key to sign transaction.

## Usage Examples

### Link Without Profile Update
```javascript
const response = await fetch('/api/farcaster/link-skatehive', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hiveUsername: 'alice',
    fid: '12345',
    farcasterUsername: 'alice.eth',
    preferences: {
      notificationsEnabled: true,
      notifyOnVotes: true,
      notifyOnComments: true
    }
  })
});

const data = await response.json();
if (data.success) {
  console.log('Accounts linked!');
}
```

### Link With Profile Update
```javascript
const response = await fetch('/api/farcaster/link-skatehive', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hiveUsername: 'alice',
    fid: '12345',
    farcasterUsername: 'alice.eth',
    preferences: {
      notificationsEnabled: true
    },
    updateHiveProfile: true,
    postingKey: '5J...' // User's Hive posting key
  })
});
```

### React Component
```jsx
function LinkFarcaster({ hiveUsername, postingKey }) {
  const [fid, setFid] = useState('');
  const [farcasterUsername, setFarcasterUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    setLoading(true);
    
    const response = await fetch('/api/farcaster/link-skatehive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hiveUsername,
        fid,
        farcasterUsername,
        preferences: {
          notificationsEnabled: true,
          notifyOnVotes: true,
          notifyOnComments: true
        },
        updateHiveProfile: true,
        postingKey
      })
    });

    const data = await response.json();
    setLoading(false);

    if (data.success) {
      alert('Accounts linked successfully!');
    } else {
      alert(data.message);
    }
  };

  return (
    <div>
      <input placeholder="FID" value={fid} onChange={e => setFid(e.target.value)} />
      <input placeholder="Farcaster Username" value={farcasterUsername} onChange={e => setFarcasterUsername(e.target.value)} />
      <button onClick={handleLink} disabled={loading}>
        {loading ? 'Linking...' : 'Link Accounts'}
      </button>
    </div>
  );
}
```

## Related Endpoints

- `/api/farcaster/unlink` - Unlink accounts
- `/api/farcaster/user-status` - Check link status
- `/api/farcaster/user-preferences` - Get preferences
- `/api/farcaster/update-preferences` - Update preferences

## Security

🔒 **Security Features:**
1. ✅ Posting key never stored
2. ✅ Used only for profile update
3. ✅ Preferences stored separately
4. ⚠️ No FID ownership verification

📊 **Medium Priority:**
- Add FID ownership verification
- Add rate limiting
- Log linking attempts

## Testing

Test linking:
```bash
curl -X POST https://skatehive.app/api/farcaster/link-skatehive \
  -H "Content-Type: application/json" \
  -d '{
    "hiveUsername": "testuser",
    "fid": "12345",
    "farcasterUsername": "testuser.eth",
    "preferences": {
      "notificationsEnabled": true
    }
  }'
```

## Dependencies

- `@/lib/farcaster/skatehive-integration` - Link management
- `@/lib/hive/profile-service` - Hive profile updates

## Notes

- FID must be unique (one Farcaster account per link)
- Hive username can link to one Farcaster account
- Profile update is optional
- Posting key required only for profile update
- Preferences can be updated later
- Link enables cross-platform notifications
