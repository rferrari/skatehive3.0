# OTT Authentication API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

One-Time Token (OTT) authentication endpoint for secure, passwordless login after account creation. Validates OTT from email, consumes it (one-time use), and returns a JWT for session authentication.

**Status**: ✅ Active (Production)  
**Method**: `GET`  
**Path**: `/api/auth/ott`

## Endpoint

### GET /api/auth/ott

Authenticates user with one-time token.

**Query Parameters:**
- `ott` (string, required): One-time token from email

**Example URL:**
```
/api/auth/ott?ott=550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "success": true,
  "username": "newuser",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-12-06T10:00:00Z"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing one-time token (ott) parameter"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid or expired one-time token"
}
```

## OTT Lifecycle

1. **Created**: When account is created
2. **Sent**: Via email link
3. **Validated**: This endpoint checks validity
4. **Consumed**: Marked as used (one-time)
5. **Expired**: Cannot be used again

## Database Operations

Validate OTT:
```sql
SELECT * FROM auth_ott
WHERE token = $1
  AND consumed_at IS NULL
  AND expires_at > NOW();
```

Consume OTT:
```sql
UPDATE auth_ott
SET consumed_at = NOW()
WHERE token = $1;
```

## JWT Generation

Creates JWT with 24-hour validity:
```javascript
const jwt = await new SignJWT({
  username,
  type: 'hive_signup',
  iat: Math.floor(Date.now() / 1000),
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('24h')
  .sign(secret);
```

## Cookie Setting

JWT stored in HTTP-only cookie:
```javascript
response.cookies.set('auth_token', jwt, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 86400, // 24 hours
  path: '/'
});
```

## Usage Examples

### Email Link
```html
<a href="https://skatehive.app/auth/login?ott=550e8400-e29b-41d4-a716-446655440000">
  Click here to log in
</a>
```

### Frontend Handler
```javascript
// Extract OTT from URL
const urlParams = new URLSearchParams(window.location.search);
const ott = urlParams.get('ott');

if (ott) {
  const response = await fetch(`/api/auth/ott?ott=${ott}`);
  const data = await response.json();
  
  if (data.success) {
    // JWT stored in cookie automatically
    localStorage.setItem('username', data.username);
    router.push('/dashboard');
  } else {
    alert('Invalid or expired login link');
  }
}
```

### React Component
```jsx
function OTTLogin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const { ott } = router.query;
    
    if (ott) {
      fetch(`/api/auth/ott?ott=${ott}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            router.push('/dashboard');
          } else {
            setError(data.error);
            setLoading(false);
          }
        });
    }
  }, [router.query]);

  if (loading) return <div>Logging you in...</div>;
  if (error) return <div>Error: {error}</div>;
}
```

## Security Features

1. ✅ **One-Time Use**: Token consumed after use
2. ✅ **Expiration**: Time-limited validity
3. ✅ **HTTP-Only Cookie**: XSS protection
4. ✅ **Secure Flag**: HTTPS only in production
5. ✅ **SameSite**: CSRF protection
6. ✅ **JWT Signing**: Tamper-proof tokens

## Error Scenarios

| Error | Cause | Status |
|-------|-------|--------|
| Missing ott | No token in URL | 400 |
| Invalid token | Token not found | 401 |
| Already used | consumed_at IS NOT NULL | 401 |
| Expired | expires_at < NOW() | 401 |

## Environment Variables

Required:
- `JWT_SECRET` or `NEXTAUTH_SECRET` - JWT signing key
- `SUPABASE_URL` - Database connection
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access

## OTT Generation

OTTs created during signup:
```javascript
const ott = uuidv4();
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

await supabase.from('auth_ott').insert({
  token: ott,
  username,
  expires_at: expiresAt
});
```

## Related Endpoints

- `/api/signup/submit` - Creates OTT after account creation

## Database Schema

```sql
CREATE TABLE auth_ott (
  id SERIAL PRIMARY KEY,
  token UUID UNIQUE NOT NULL,
  username VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ
);

CREATE INDEX idx_auth_ott_token ON auth_ott(token);
CREATE INDEX idx_auth_ott_expires ON auth_ott(expires_at);
```

## Testing

Test OTT flow:
```bash
# Generate test OTT
curl -X POST http://localhost:3000/api/test/generate-ott \
  -d '{"username":"testuser"}'

# Use OTT
curl "http://localhost:3000/api/auth/ott?ott=uuid-token"
```

## Dependencies

- `@supabase/supabase-js` - Database
- `jose` - JWT operations
- `uuid` - Token generation

## Notes

- OTT valid for 24 hours
- JWT valid for 24 hours
- Cookie automatically sent with requests
- Passwordless authentication
- Secure against replay attacks
- Used for post-signup login
