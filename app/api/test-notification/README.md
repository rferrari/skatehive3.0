# Test Notification API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Development-only endpoint for testing notification URL generation and validation. Helps verify that notification links are properly constructed before sending to Farcaster users.

**Status**: 🧪 Testing Only (Development Environment)  
**Method**: `GET`  
**Path**: `/api/test-notification`

## Endpoint

### GET /api/test-notification

Tests notification URL construction.

**Query Parameters:**
- `username` (string, required): Hive username to test

**Example URL:**
```
/api/test-notification?username=alice
```

**Response (200 OK):**
```json
{
  "username": "alice",
  "baseUrl": "http://localhost:3000",
  "testHiveUrl": "https://skatehive.app/post/hive-196037/@alice/test-post-permlink",
  "cleanUrl": "post/hive-196037/@alice/test-post-permlink",
  "finalUrl": "http://localhost:3000/post/hive-196037/@alice/test-post-permlink",
  "urlValid": true
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Username required"
}
```

**Response (404 Not Found) - Production:**
```json
{
  "error": "Not available in production"
}
```

## Usage

This endpoint helps verify:
1. ✅ Base URL configuration (`NEXT_PUBLIC_BASE_URL`)
2. ✅ URL cleaning/transformation logic
3. ✅ Final URL construction
4. ✅ URL validity (can be parsed)

### Testing Locally
```bash
curl "http://localhost:3000/api/test-notification?username=alice"
```

### React Testing Component
```jsx
function TestNotifications() {
  const [username, setUsername] = useState('alice');
  const [result, setResult] = useState(null);

  const testUrl = async () => {
    const response = await fetch(`/api/test-notification?username=${username}`);
    const data = await response.json();
    setResult(data);
  };

  return (
    <div>
      <input value={username} onChange={e => setUsername(e.target.value)} />
      <button onClick={testUrl}>Test URL</button>
      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
```

## Related Endpoints

- `/api/farcaster/notify` - Send actual notifications
- `/api/farcaster/test-notifications` - Test automated notification processing

## Notes

- Only available in development environment
- Returns 404 in production
- Tests URL transformation used by notification service
- Useful for debugging notification link issues
