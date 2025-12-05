# Support API

> ⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Handles support requests by sending emails via SMTP. Used for user support inquiries, bug reports, and feedback from the SkateHive application.

## Endpoint

### `POST /api/support`

Send support email.

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "email": "user@example.com",
  "message": "I need help with...",
  "subject": "Support Request from SkateHive App",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2025-12-05T12:34:56.789Z"
}
```

**Required Fields:**
- `email` (string): User's email address
- `message` (string): Support message content

**Optional Fields:**
- `subject` (string): Email subject (defaults to "Support Request from SkateHive App")
- `userAgent` (string): Browser/device information
- `timestamp` (string): Request timestamp

---

## Validation Rules

### Email Validation
**Regex:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**Valid Examples:**
- user@example.com
- skater.123@skatehive.app
- contact+support@domain.co.uk

**Invalid Examples:**
- user@domain (no TLD)
- @domain.com (no username)
- user @domain.com (whitespace)

### Message Length
**Minimum:** 10 characters  
**Maximum:** 2000 characters

**Rationale:** 
- Minimum ensures meaningful messages
- Maximum prevents abuse and email size issues
- Apple App Store requires reasonable limits

---

## Response

### Success (200)
```json
{
  "success": true,
  "message": "Support request sent successfully."
}
```

### Error Responses

**400 - Missing Fields:**
```json
{
  "success": false,
  "error": "Email and message are required."
}
```

**400 - Invalid Email:**
```json
{
  "success": false,
  "error": "Please enter a valid email address."
}
```

**400 - Invalid Message Length:**
```json
{
  "success": false,
  "error": "Message must be between 10 and 2000 characters."
}
```

**500 - Send Failed:**
```json
{
  "success": false,
  "error": "Failed to send support request. Please try again."
}
```

**500 - Internal Error:**
```json
{
  "success": false,
  "error": "Internal server error."
}
```

---

## Usage Examples

### JavaScript/TypeScript
```typescript
const sendSupport = async () => {
  const response = await fetch('/api/support', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'user@example.com',
      message: 'I need help uploading videos',
      subject: 'Video Upload Issue',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })
  });

  const result = await response.json();
  if (result.success) {
    console.log('Support request sent!');
  } else {
    console.error('Error:', result.error);
  }
};
```

### cURL
```bash
curl -X POST https://skatehive.app/api/support \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "message": "I need help with my account",
    "subject": "Account Help"
  }'
```

---

## Email Service

Uses `supportMailer` function from `@/lib/support/route`:

**Expected Signature:**
```typescript
supportMailer({
  email: string,
  message: string,
  subject?: string,
  userAgent?: string,
  timestamp?: string
}): Promise<boolean>
```

**Returns:** `true` if email sent successfully, `false` otherwise

---

## SMTP Configuration

**Configuration Location:** `@/lib/support/route.ts`

**Typical Setup (Nodemailer):**
```javascript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
```

**Environment Variables Needed:**
```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@skatehive.app
SMTP_PASS=your_password
SMTP_FROM=support@skatehive.app
SMTP_TO=team@skatehive.app
```

---

## Security Considerations

- ✅ Email validation (regex)
- ✅ Message length limits (prevents abuse)
- ⚠️ No rate limiting (can be spammed)
- ⚠️ No CAPTCHA (bots can abuse)
- ⚠️ No authentication (anyone can send)
- ⚠️ User email not verified (spoofing possible)

**Recommendations:**
1. **Add Rate Limiting:** 3 requests per hour per IP address
2. **Implement CAPTCHA:** Google reCAPTCHA v3 for spam prevention
3. **Add Email Verification:** Send confirmation email to user
4. **Sanitize Input:** Prevent XSS in message content
5. **Log Requests:** Track for abuse monitoring

---

## Error Handling

All errors are logged:
```typescript
console.error('Support API Error:', error);
```

Errors include:
- Validation failures
- SMTP connection errors
- Email send failures
- Unexpected exceptions

---

## Rate Limiting Recommendation

**Suggested Implementation:**
```typescript
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500, // Max 500 IPs per hour
});

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  
  try {
    await limiter.check(ip, 3); // 3 requests per hour
  } catch {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }
  
  // ... rest of handler
}
```

---

## User Experience Best Practices

### Client-Side Validation
Validate before sending to reduce errors:
```typescript
const validateSupport = (email: string, message: string) => {
  if (!email || !message) {
    return 'Email and message are required';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Invalid email address';
  }
  if (message.length < 10 || message.length > 2000) {
    return 'Message must be between 10 and 2000 characters';
  }
  return null;
};
```

### UI Feedback
- Show character counter for message field
- Display validation errors in real-time
- Show loading spinner during submission
- Display success/error toast after response

---

## Testing

### Valid Request
```bash
curl -X POST http://localhost:3000/api/support \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "message": "This is a test support message that is long enough to pass validation."
  }'
```

### Expected Response
```json
{
  "success": true,
  "message": "Support request sent successfully."
}
```

---

## Related Documentation

- SMTP Configuration: `/lib/support/route.ts`
- Email Templates: Check support mailer implementation
- Rate Limiting: Consider implementing with Upstash or Vercel KV

---

**Status:** ✅ Active  
**Dependencies:** SMTP Server (via supportMailer)  
**Last Validated:** December 5, 2025  
**Security Priority:** 🔥 High (add rate limiting and CAPTCHA)
