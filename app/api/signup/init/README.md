# Signup Init API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Initializes a new Hive account signup session. Validates VIP code, checks username availability on Hive blockchain, creates signup session in Supabase, and returns signup token for the next step. Includes rate limiting and comprehensive validation.

**Status**: ✅ Active (Production)  
**Method**: `POST`  
**Path**: `/api/signup/init`

## Endpoint

### POST /api/signup/init

Starts the signup process.

**Request Body:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "vip_code": "4RCHXV-9F9YWCZS"
}
```

**Required Fields:**
- `username` (string): Desired Hive username (3-16 chars, lowercase, alphanumeric + hyphens)
- `email` (string): Valid email address
- `vip_code` (string): VIP invite code (format: XXXXXX-XXXXXXXX)

**Response (200 OK):**
```json
{
  "success": true,
  "signup_token": "550e8400-e29b-41d4-a716-446655440000",
  "username": "newuser",
  "email": "user@example.com",
  "message": "Signup session initialized. Please proceed to submit keys."
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Username already exists on Hive blockchain"
}
```

or

```json
{
  "error": "Invalid VIP code format. Use format: XXXXXX-XXXXXXXX"
}
```

**Response (429 Too Many Requests):**
```json
{
  "error": "Too many signup attempts. Please try again in 15 minutes."
}
```

## Validation

### Username Rules
- **Length**: 3-16 characters
- **Format**: Lowercase letters, numbers, hyphens only
- **Pattern**: Cannot start/end with hyphen
- **Availability**: Must not exist on Hive blockchain

Validated by `validateAccountName()` from `@/lib/invite/helpers`

### Email Rules
- **Format**: Must match regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Example**: `user@domain.com`

### VIP Code Format
- **Structure**: Two parts separated by hyphen
- **Example**: `4RCHXV-9F9YWCZS`
- **Parts**: 
  - First part (6 chars): Code ID
  - Second part (8 chars): Secret

## VIP Code Verification

The endpoint verifies VIP codes using Argon2 hashing:

```javascript
// Code structure
const [codeId, secret] = vip_code.split('-');

// Lookup in database
SELECT * FROM vip_codes WHERE code_id = codeId;

// Verify secret with pepper
const secretWithPepper = secret + process.env.VIP_PEPPER;
const isValid = await argon2.verify(secretHash, secretWithPepper);
```

**Security Features:**
- ✅ Secret never stored in plaintext
- ✅ Pepper added to secret before hashing
- ✅ Argon2 for secure verification
- ✅ One-time use enforcement

## Rate Limiting

Built-in rate limiting prevents abuse:
- **Window**: 15 minutes
- **Limit**: 20 signup attempts per IP
- **Reset**: Automatic after window expires

```javascript
const RATE_LIMIT = 20; // requests per window
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
```

## Signup Session

Creates session in Supabase `signup_sessions` table:
```sql
INSERT INTO signup_sessions (
  id,              -- UUID signup token
  username,        -- Desired username
  email,           -- User email
  vip_code_id,     -- Foreign key to vip_codes
  status,          -- 'INIT'
  created_at,      -- Timestamp
  expires_at       -- 24 hours from now
)
```

**Session Expiration**: 24 hours

## Usage Examples

### JavaScript/Fetch
```javascript
const response = await fetch('/api/signup/init', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'newuser',
    email: 'user@example.com',
    vip_code: '4RCHXV-9F9YWCZS'
  })
});

const data = await response.json();

if (data.success) {
  // Store signup_token for next step
  localStorage.setItem('signup_token', data.signup_token);
  // Proceed to key generation
  window.location.href = '/signup/keys';
} else {
  alert(data.error);
}
```

### React Component
```jsx
function SignupInit() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    vip_code: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/signup/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    setLoading(false);

    if (data.success) {
      sessionStorage.setItem('signup_token', data.signup_token);
      router.push('/signup/submit');
    } else {
      setError(data.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Username"
        value={formData.username}
        onChange={e => setFormData({...formData, username: e.target.value.toLowerCase()})}
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={e => setFormData({...formData, email: e.target.value})}
      />
      <input
        placeholder="VIP Code (XXXXXX-XXXXXXXX)"
        value={formData.vip_code}
        onChange={e => setFormData({...formData, vip_code: e.target.value.toUpperCase()})}
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Checking...' : 'Continue'}
      </button>
    </form>
  );
}
```

### cURL
```bash
curl -X POST https://skatehive.app/api/signup/init \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "vip_code": "4RCHXV-9F9YWCZS"
  }'
```

## Signup Flow

```
1. User enters username, email, VIP code
   ↓
2. /api/signup/init validates and creates session
   ↓
3. Returns signup_token
   ↓
4. User generates keys client-side
   ↓
5. /api/signup/submit creates Hive account
   ↓
6. /api/invite sends keys via email
```

## Error Messages

| Error | Meaning |
|-------|---------|
| `Missing required fields` | username, email, or vip_code not provided |
| `Invalid email format` | Email doesn't match regex |
| `Invalid username` | Doesn't meet Hive username requirements |
| `Username already exists` | Username taken on Hive blockchain |
| `Invalid VIP code format` | Doesn't match XXXXXX-XXXXXXXX |
| `Invalid or expired VIP code` | Code not found or secret mismatch |
| `VIP code already consumed` | Code has been used |
| `Too many signup attempts` | Rate limit exceeded |
| `Server configuration error` | Missing VIP_PEPPER env var |

## Security Considerations

🔒 **Security Features:**
1. ✅ Rate limiting (20 per 15min per IP)
2. ✅ Argon2 password hashing for VIP codes
3. ✅ Secret pepper (VIP_PEPPER env var)
4. ✅ One-time VIP code usage
5. ✅ Blockchain username availability check
6. ✅ Email format validation
7. ✅ Session expiration (24h)

📊 **Medium Priority Improvements:**
1. Add CAPTCHA for additional bot protection
2. Implement email verification before proceeding
3. Add suspicious pattern detection
4. Log failed attempts for security monitoring

## Database Schema

### signup_sessions
```sql
CREATE TABLE signup_sessions (
  id UUID PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  vip_code_id UUID REFERENCES vip_codes(id),
  status VARCHAR(20) DEFAULT 'INIT',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);
```

### vip_codes
```sql
CREATE TABLE vip_codes (
  id UUID PRIMARY KEY,
  code_id VARCHAR(10) UNIQUE NOT NULL,
  secret_hash TEXT NOT NULL,
  consumed_at TIMESTAMPTZ,
  consumed_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Environment Variables

Required:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key for database operations
- `VIP_PEPPER` - Secret pepper for VIP code hashing

## Related Endpoints

- `/api/signup/submit` - Complete account creation (next step)
- `/api/signup/test-email` - Test email delivery
- `/api/signup/burn-code` - Consume VIP code (called by submit)

## Testing

Test with valid VIP code:
```bash
curl -X POST http://localhost:3000/api/signup/init \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "test@example.com",
    "vip_code": "4RCHXV-9F9YWCZS"
  }'
```

## Dependencies

- `@supabase/supabase-js` - Database operations
- `uuid` - Generate signup tokens
- `argon2` - VIP code verification
- `@/lib/invite/helpers` - Username validation and blockchain check

## Notes

- Signup token is a UUID v4
- Sessions expire after 24 hours
- VIP codes can only be used once
- Username availability checked on Hive blockchain in real-time
- Rate limiting is per IP address
- All usernames automatically converted to lowercase
