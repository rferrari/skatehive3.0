# Signup Burn Code API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Consumes (burns) a VIP code after successful account creation. Marks the code as used and updates the signup session status. Called internally by `/api/signup/submit` after blockchain account creation succeeds.

**Status**: ✅ Active (Internal)  
**Method**: `POST`  
**Path**: `/api/signup/burn-code`

## Endpoint

### POST /api/signup/burn-code

Marks VIP code as consumed.

**Request Body:**
```json
{
  "signup_token": "550e8400-e29b-41d4-a716-446655440000",
  "test_mode": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "VIP code consumed successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "VIP code has already been consumed"
}
```

## Database Operations

Updates VIP code:
```sql
UPDATE vip_codes
SET 
  consumed_at = NOW(),
  consumed_email = 'user@example.com'
WHERE id = vip_code_id;
```

Updates signup session:
```sql
UPDATE signup_sessions
SET 
  status = 'SUCCESS',
  completed_at = NOW()
WHERE id = signup_token;
```

## Test Mode

When `test_mode: true`:
- Status set to 'BURNED' instead of 'SUCCESS'
- Used for testing without affecting production data

## Usage

Called internally:
```javascript
// After Hive account creation succeeds
await fetch('/api/signup/burn-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    signup_token: sessionToken,
    test_mode: false
  })
});
```

## Related Endpoints

- `/api/signup/submit` - Calls this endpoint after account creation
- `/api/signup/init` - Validates VIP code

## Notes

- One-time operation per VIP code
- Irreversible (code cannot be reused)
- Called automatically by submit endpoint
- Test mode for development/testing
