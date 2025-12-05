# Admin Check API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Server-side admin validation endpoint that checks if a given Hive username has administrator privileges. Uses server-side configuration to determine admin status and logs all security attempts for audit purposes.

**Status**: ✅ Active (Production)  
**Method**: `POST`  
**Path**: `/api/admin/check`

## Endpoint

### POST /api/admin/check

Validates admin status for a Hive username.

**Request Body:**
```json
{
  "username": "string (required)"
}
```

**Validation Rules:**
- `username` must be provided and must be a string
- Empty or non-string usernames return `isAdmin: false`

**Response (200 OK):**
```json
{
  "isAdmin": boolean
}
```

**Response (400 Bad Request):**
```json
{
  "isAdmin": false
}
```

**Response (500 Internal Server Error):**
```json
{
  "isAdmin": false
}
```

## Admin Configuration

Admin status is determined by the `isServerSideAdmin()` function from `@/lib/server/adminUtils`. This function:
- Checks against a server-side list of admin usernames
- Does NOT rely on client-side data
- Ensures secure admin verification

## Security Features

1. **Server-Side Only**: Admin list is stored and validated on the server
2. **Security Logging**: All admin check attempts are logged with:
   - Username attempting check
   - Request metadata
   - Success/failure status
   - IP address and user agent (if available)
3. **Fail-Safe**: Returns `isAdmin: false` on any error
4. **No Information Leakage**: Always returns boolean, never reveals admin list

## Usage Examples

### JavaScript/Fetch
```javascript
const response = await fetch('/api/admin/check', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'skatehive'
  })
});

const data = await response.json();
console.log('Is admin?', data.isAdmin);
```

### cURL
```bash
curl -X POST https://skatehive.app/api/admin/check \
  -H "Content-Type: application/json" \
  -d '{"username":"skatehive"}'
```

## Security Audit

🔥 **High Priority**: Add rate limiting to prevent brute-force enumeration of admin usernames

**Recommendations:**
1. Implement rate limiting (max 5 requests per minute per IP)
2. Add CAPTCHA for repeated failed attempts
3. Consider adding JWT authentication for admin-protected routes
4. Review security logs regularly for suspicious patterns
5. Rotate admin credentials periodically

## Error Handling

The endpoint follows a fail-safe pattern:
- Invalid input → Returns `isAdmin: false` with 400 status
- Missing username → Returns `isAdmin: false` with 400 status
- Server error → Returns `isAdmin: false` with 500 status
- Security first: Never throws errors that might leak information

## Dependencies

- `@/lib/server/adminUtils`: Contains `isServerSideAdmin()` and `logSecurityAttempt()` functions
- Server-side configuration file with admin usernames list

## Related Endpoints

- None (standalone security check)

## Notes

- This endpoint is called before admin operations (broadcast notifications, database operations, etc.)
- Admin checks are logged for security auditing
- The endpoint intentionally provides minimal information to prevent enumeration attacks
- Consider implementing time-based delays for failed checks to slow down brute-force attempts
