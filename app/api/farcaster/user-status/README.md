# Farcaster User Status API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Checks if a Hive account is linked to Farcaster and retrieves the associated Farcaster information (FID, username). Read-only endpoint for status checking.

**Status**: ✅ Active (Production)  
**Method**: `GET`  
**Path**: `/api/farcaster/user-status`

## Endpoint

### GET /api/farcaster/user-status?hiveUsername=alice

Gets Farcaster link status for a Hive user.

**Query Parameters:**
- `hiveUsername` (string, required): Hive account name

**Response (200 OK - Linked):**
```json
{
  "linked": true,
  "fid": "12345",
  "farcasterUsername": "alice.eth"
}
```

**Response (200 OK - Not Linked):**
```json
{
  "linked": false
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
SELECT fid, farcaster_username
FROM skatehive_farcaster_preferences
WHERE hive_username = $1
AND hive_username IS NOT NULL;
```

## Usage Examples

### Check Link Status
```javascript
const response = await fetch(
  '/api/farcaster/user-status?hiveUsername=alice'
);

const data = await response.json();

if (data.linked) {
  console.log(`Linked to Farcaster FID: ${data.fid}`);
  console.log(`Username: ${data.farcasterUsername}`);
} else {
  console.log('Not linked to Farcaster');
}
```

### React Hook
```jsx
function useFarcasterStatus(hiveUsername) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      setLoading(true);
      
      const response = await fetch(
        `/api/farcaster/user-status?hiveUsername=${hiveUsername}`
      );
      
      const data = await response.json();
      setStatus(data);
      setLoading(false);
    }

    if (hiveUsername) {
      fetchStatus();
    }
  }, [hiveUsername]);

  return { status, loading };
}

// Usage
function UserProfile({ hiveUsername }) {
  const { status, loading } = useFarcasterStatus(hiveUsername);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {status.linked ? (
        <div>
          🟢 Linked to Farcaster
          <br />
          FID: {status.fid}
          <br />
          Username: {status.farcasterUsername}
        </div>
      ) : (
        <div>⚪ Not linked to Farcaster</div>
      )}
    </div>
  );
}
```

### Conditional Feature
```javascript
async function canSendFarcasterNotification(hiveUsername) {
  const response = await fetch(
    `/api/farcaster/user-status?hiveUsername=${hiveUsername}`
  );
  
  const status = await response.json();
  return status.linked;
}

// Usage
if (await canSendFarcasterNotification('alice')) {
  await sendNotification(...);
}
```

## Related Endpoints

- `/api/farcaster/link-skatehive` - Link accounts
- `/api/farcaster/unlink` - Unlink accounts
- `/api/farcaster/user-preferences` - Get notification preferences
- `/api/farcaster/status` - Get token validity status

## Use Cases

1. **Profile Display**: Show Farcaster badge on user profiles
2. **Feature Gating**: Enable Farcaster-specific features
3. **Notification Check**: Verify before sending notifications
4. **Onboarding**: Prompt users to link accounts

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `linked` | boolean | Whether accounts are linked |
| `fid` | string | Farcaster ID (if linked) |
| `farcasterUsername` | string | Farcaster username (if linked) |

## Security

✅ **Low Risk:**
- Read-only endpoint
- Public information
- No authentication required
- No sensitive data exposed

## Testing

Test status check:
```bash
curl "https://skatehive.app/api/farcaster/user-status?hiveUsername=testuser"
```

## Dependencies

- `@/lib/farcaster/skatehive-integration` - Status lookup

## Notes

- Fast lookup (indexed query)
- Returns `linked: false` if not found
- Username can be null even if FID exists
- Does not check token validity (use `/api/farcaster/status`)
