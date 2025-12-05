# Farcaster Unlink API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Unlinks a Hive account from Farcaster. Removes notification tokens and clears the Hive username association. Optionally updates Hive profile to remove Farcaster metadata.

**Status**: ✅ Active (Production)  
**Method**: `POST`  
**Path**: `/api/farcaster/unlink`

## Endpoint

### POST /api/farcaster/unlink

Unlinks Hive and Farcaster accounts.

**Request Body:**
```json
{
  "hiveUsername": "alice",
  "updateHiveProfile": true,
  "postingKey": "5J..."
}
```

**Required Fields:**
- `hiveUsername` (string): Hive account to unlink

**Optional Fields:**
- `updateHiveProfile` (boolean): Remove Farcaster data from profile
- `postingKey` (string): Required if `updateHiveProfile` is true

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Account unlinked successfully"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "No Farcaster account linked to this Hive account"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Hive username is required"
}
```

## Unlink Process

1. **Lookup FID**: Find Farcaster ID from Hive username
2. **Remove Token**: Delete from `farcaster_tokens` table
3. **Clear Link**: Set `hive_username = NULL` in preferences
4. **Update Profile**: (Optional) Remove Farcaster from Hive profile

## Database Operations

Remove token:
```sql
DELETE FROM farcaster_tokens
WHERE fid = $1;
```

Clear username link:
```sql
UPDATE skatehive_farcaster_preferences
SET hive_username = NULL
WHERE fid = $1;
```

## Usage Examples

### Basic Unlink
```javascript
const response = await fetch('/api/farcaster/unlink', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hiveUsername: 'alice'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Account unlinked');
}
```

### Unlink with Profile Update
```javascript
const response = await fetch('/api/farcaster/unlink', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hiveUsername: 'alice',
    updateHiveProfile: true,
    postingKey: '5J...'
  })
});
```

### React Component
```jsx
function UnlinkFarcaster({ hiveUsername, postingKey }) {
  const [loading, setLoading] = useState(false);

  const handleUnlink = async () => {
    if (!confirm('Are you sure you want to unlink your Farcaster account?')) {
      return;
    }

    setLoading(true);
    
    const response = await fetch('/api/farcaster/unlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hiveUsername,
        updateHiveProfile: true,
        postingKey
      })
    });

    const data = await response.json();
    setLoading(false);

    if (data.success) {
      alert('Farcaster account unlinked');
    } else {
      alert(data.message);
    }
  };

  return (
    <button onClick={handleUnlink} disabled={loading}>
      {loading ? 'Unlinking...' : 'Unlink Farcaster'}
    </button>
  );
}
```

## Effects

After unlinking:
- ❌ No more Farcaster notifications
- ❌ Notification token deleted
- ❌ FID no longer associated
- ✅ Preferences preserved (can relink)
- ✅ Hive account unaffected

## Related Endpoints

- `/api/farcaster/link-skatehive` - Link accounts
- `/api/farcaster/user-status` - Check link status

## Security

- ✅ Only requires Hive username (user knows their own)
- ✅ Posting key not stored
- ⚠️ No authentication (anyone can unlink if they know username)

📊 **Medium Priority:**
- Add authentication requirement
- Verify user owns Hive account
- Add confirmation step

## Testing

Test unlink:
```bash
curl -X POST https://skatehive.app/api/farcaster/unlink \
  -H "Content-Type: application/json" \
  -d '{
    "hiveUsername": "testuser"
  }'
```

## Dependencies

- `@/lib/farcaster/skatehive-integration` - Link management
- `@/lib/farcaster/token-store-factory` - Token removal

## Notes

- Unlinking is reversible (can relink)
- FID can be linked to different Hive account
- Preferences remain in database
- Profile update is optional
- Token is permanently deleted
