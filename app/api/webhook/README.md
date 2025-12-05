# Webhook API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Farcaster webhook endpoint that processes miniapp events and notification subscriptions. Handles frame additions, notifications enabled/disabled events, and stores Farcaster tokens in database for push notification delivery.

**Status**: ⚠️ Active (Signature verification disabled for app_key)  
**Method**: `POST`  
**Path**: `/api/webhook`

## Endpoint

### POST /api/webhook

Receives Farcaster webhook events.

**Request Headers:**
- Standard HTTP headers (automatically processed)

**Request Body:**
```json
{
  "header": "base64-encoded-header",
  "payload": "base64-encoded-payload",
  "signature": "signature-string"
}
```

**Decoded Header Format:**
```json
{
  "fid": "12345",
  "username": "alice",
  "type": "app_key"
}
```

**Decoded Payload Format:**
```json
{
  "event": "frame_added",
  "notificationDetails": {
    "token": "farcaster_notification_token",
    "url": "https://api.farcaster.com/v1/frame-notifications"
  }
}
```

**Response (200 OK):**
```json
{
  "ok": true,
  "message": "Webhook processed successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid JSON"
}
```

or

```json
{
  "error": "Invalid Farcaster webhook format"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid Farcaster signature"
}
```

## Supported Events

### frame_added / miniapp_added
User adds SkateHive as a Farcaster miniapp
- Stores notification token and URL
- Enables notifications (sets `is_active = TRUE`)
- Associates FID with Hive username (if available)

### notifications_enabled
User explicitly enables notifications
- Updates `is_active = TRUE`
- Ensures token is active in database

### notifications_disabled
User disables notifications
- Updates `is_active = FALSE`
- Keeps token in database for re-enable

### frame_removed / miniapp_removed
User removes miniapp
- Deletes token from database
- Removes all associations

## Security Features

### Signature Verification

⚠️ **IMPORTANT**: Signature verification is **skipped** for `app_key` type events

**Current Implementation:**
```javascript
if (headerJson.type === 'app_key') {
  // Skip verification (temporary workaround)
  console.warn('Skipping signature verification for app_key');
}
```

**For other event types:**
- Verifies signature using `verifyFarcasterSignature()`
- Returns 401 if signature invalid
- Prevents unauthorized webhook calls

**Security Risk**: 🔥 **High Priority**
- App_key events can be forged
- Anyone can call webhook with fake app_key events
- Recommendation: Implement proper app_key verification

### Payload Validation

The endpoint validates:
1. ✅ JSON structure (must be valid JSON)
2. ✅ Required fields (header, payload, signature)
3. ✅ Base64 decoding (header and payload must be base64)
4. ✅ Event type (must have `event` field)
5. ⚠️ Signature (skipped for app_key)

## Database Operations

### Token Storage

When notifications are enabled, stores:
```sql
INSERT INTO farcaster_tokens (fid, username, token, url, is_active)
VALUES ($1, $2, $3, $4, TRUE)
ON CONFLICT (fid) DO UPDATE SET
  token = $2,
  url = $3,
  is_active = TRUE,
  updated_at = NOW()
```

### Token Deactivation

When notifications are disabled:
```sql
UPDATE farcaster_tokens
SET is_active = FALSE
WHERE fid = $1
```

### Token Deletion

When miniapp is removed:
```sql
DELETE FROM farcaster_tokens
WHERE fid = $1
```

## Deduplication

The endpoint prevents duplicate token storage:
```javascript
const existingToken = await tokenStore.getTokenByFid(fid);
if (!existingToken || existingToken.token !== newToken) {
  await tokenStore.addToken(fid, username, token, url);
}
```

## Usage Examples

### Farcaster Setup (Developer Portal)
```
Webhook URL: https://skatehive.app/api/webhook
Events: miniapp_added, notifications_enabled, notifications_disabled, miniapp_removed
```

### Manual Testing (Development)
```bash
# Create mock webhook payload
FID="12345"
EVENT="frame_added"

# Encode header
HEADER=$(echo -n '{"fid":"'$FID'","username":"alice","type":"app_key"}' | base64)

# Encode payload
PAYLOAD=$(echo -n '{
  "event":"'$EVENT'",
  "notificationDetails":{
    "token":"test_token_123",
    "url":"https://api.farcaster.com/notifications"
  }
}' | base64)

# Send webhook
curl -X POST https://skatehive.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "header": "'$HEADER'",
    "payload": "'$PAYLOAD'",
    "signature": "fake_signature"
  }'
```

### Verify Token Storage
```javascript
// Check if token was stored
const response = await fetch('/api/farcaster/status');
const { status } = await response.json();
console.log('Active tokens:', status.tokenStore.activeTokens);
```

## Error Handling

The endpoint logs all errors and returns appropriate status codes:

| Scenario | Status Code | Response |
|----------|-------------|----------|
| Invalid JSON | 400 | `{"error":"Invalid JSON"}` |
| Missing payload | 400 | `{"error":"Invalid Farcaster webhook format"}` |
| Base64 decode fail | 400 | `{"error":"Failed to decode Farcaster payload"}` |
| Missing event | 400 | `{"error":"Invalid event in Farcaster payload"}` |
| Invalid signature | 401 | `{"error":"Invalid Farcaster signature"}` |
| Database error | 500 | `{"error":"Internal server error"}` |

## Logging

All webhook events are logged:
```
[FARCASTER WEBHOOK] Event: frame_added for FID 12345 (@alice)
[FARCASTER WEBHOOK] ✅ Token stored for FID 12345
[FARCASTER WEBHOOK] ❌ Failed to store token: Database error
```

## Testing

Use the test webhook endpoint:
```bash
curl -X POST https://skatehive.app/api/farcaster/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "fid": "12345",
    "event": "frame_added"
  }'
```

## Security Audit

🔥 **Critical Issues:**

1. **App_key Signature Skip**: Anyone can forge app_key events
   - **Fix**: Implement proper app_key verification
   - **Impact**: High - Can create fake users

2. **No Rate Limiting**: Webhook can be spammed
   - **Fix**: Add rate limiting (max 10 req/min per FID)
   - **Impact**: Medium - Can cause database load

3. **No Replay Protection**: Same webhook can be processed multiple times
   - **Fix**: Add nonce/timestamp validation
   - **Impact**: Medium - Duplicate tokens

**Recommendations:**
```javascript
// Add rate limiting
const rateLimit = new RateLimiter({
  windowMs: 60000,
  max: 10,
  keyGenerator: (req) => req.body.header // FID-based
});

// Add replay protection
const seenNonces = new Set();
if (seenNonces.has(nonce)) {
  return NextResponse.json({ error: 'Replay attack' }, { status: 400 });
}
seenNonces.add(nonce);

// Add timestamp validation
const age = Date.now() - timestamp;
if (age > 300000) { // 5 minutes
  return NextResponse.json({ error: 'Webhook expired' }, { status: 400 });
}
```

## Database Schema

Required tables:
```sql
CREATE TABLE farcaster_tokens (
  id SERIAL PRIMARY KEY,
  fid VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255),
  token TEXT NOT NULL,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  hive_username VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_farcaster_tokens_fid ON farcaster_tokens(fid);
CREATE INDEX idx_farcaster_tokens_active ON farcaster_tokens(is_active);
CREATE INDEX idx_farcaster_tokens_hive ON farcaster_tokens(hive_username);
```

## Related Endpoints

- `/api/farcaster/test-webhook` - Test webhook processing (dev only)
- `/api/farcaster/status` - Check webhook status and token count
- `/api/farcaster/notify` - Send notifications using stored tokens
- `/api/farcaster/link-skatehive` - Link Hive user to Farcaster FID

## Dependencies

- `@/lib/farcaster/token-store-factory` - Token storage abstraction
- `@/lib/farcaster/token-store` - Signature verification
- PostgreSQL database for token persistence

## Migration Notes

If using in-memory storage (no database):
- Tokens lost on server restart
- No persistence across deployments
- Webhook events need reprocessing
- **Recommendation**: Set up PostgreSQL before production

## Notes

- Farcaster documentation: https://docs.farcaster.xyz/developers/frames/webhooks
- Webhook retries: Farcaster retries failed webhooks with exponential backoff
- Max payload size: ~64KB (Farcaster limit)
- Signature algorithm: Ed25519
- Token expiration: Tokens don't expire but can be revoked by user
