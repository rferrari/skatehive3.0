# Signup Test Email API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Development endpoint for testing email delivery without creating a Hive account. Sends a preview email with test keys to verify SMTP configuration and email template rendering.

**Status**: 🧪 Testing Only  
**Method**: `POST`  
**Path**: `/api/signup/test-email`

## Endpoint

### POST /api/signup/test-email

Sends test email with sample keys.

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "keys": {
    "owner": "5JTest...",
    "active": "5JTest...",
    "posting": "5JTest...",
    "memo": "5JTest...",
    "master": "5JTest..."
  },
  "signup_token": "test-token"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "to": "test@example.com"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing required fields: username, email, keys, signup_token"
}
```

## Email Content

Test email includes:
- ⚠️ "TEST EMAIL" warning banner
- "ACCOUNT NOT CREATED YET" disclaimer
- All 5 keys (owner, active, posting, memo, master)
- Security reminders
- Clear indication this is test only

## Usage

Test SMTP configuration:
```javascript
const response = await fetch('/api/signup/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser',
    email: 'myemail@example.com',
    keys: {
      owner: '5JTestOwner...',
      active: '5JTestActive...',
      posting: '5JTestPosting...',
      memo: '5JTestMemo...',
      master: '5JTestMaster...'
    },
    signup_token: 'test-token-123'
  })
});

const data = await response.json();
console.log('Email sent:', data.success);
```

## Related Endpoints

- `/api/signup/submit` - Production account creation
- `/api/invite` - Production email sending

## Notes

- Skips session validation (test only)
- Does NOT create Hive account
- Does NOT consume VIP code
- Use to verify email config before production
- Check spam folder if not received
