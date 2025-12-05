# Cron Job API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Automated cron job endpoint that processes unread Hive notifications and sends them to linked Farcaster users. Designed to be triggered by Vercel Cron or external scheduler (e.g., cron-job.org).

**Status**: ✅ Active (Production)  
**Method**: `GET`  
**Path**: `/api/cron`

## Endpoint

### GET /api/cron

Processes and sends pending notifications.

**Response (200 OK):**
```json
{
  "ok": true,
  "processed": 15,
  "sent": 12,
  "failed": 3,
  "users": ["alice", "bob", "charlie"],
  "duration": 2500
}
```

**Response (Error):**
```json
{
  "ok": false,
  "error": "Unknown error"
}
```

## Functionality

The cron job:
1. ✅ Fetches unread Hive notifications for all linked users
2. ✅ Filters notifications by last read timestamp
3. ✅ Transforms Hive notifications to Farcaster format
4. ✅ Sends to Farcaster via stored tokens
5. ✅ Updates last read timestamp
6. ✅ Deduplicates notifications

## Scheduling

### Vercel Cron (Recommended)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs every 5 minutes.

### External Cron Service

Use cron-job.org or similar:
```
URL: https://skatehive.app/api/cron
Schedule: */5 * * * * (every 5 minutes)
Method: GET
```

### Manual Trigger
```bash
curl https://skatehive.app/api/cron
```

## Processing Flow

```
1. Get all linked users (Hive ↔ Farcaster)
   ↓
2. For each user:
   - Fetch unread Hive notifications
   - Filter by last read timestamp
   - Transform to Farcaster format
   ↓
3. Send to Farcaster
   ↓
4. Update last read timestamp
   ↓
5. Return summary
```

## Notification Transformation

Hive notifications are transformed:
```javascript
// Hive notification
{
  type: 'vote',
  voter: 'bob',
  weight: 10000,
  permlink: 'my-post'
}

// Transformed to Farcaster
{
  title: '👍 New Vote',
  body: 'bob upvoted your post',
  targetUrl: 'https://skatehive.app/post/hive-196037/@alice/my-post'
}
```

## Supported Notification Types

| Hive Type | Farcaster Title | Icon |
|-----------|----------------|------|
| `vote` | New Vote | 👍 |
| `comment` | New Comment | 💬 |
| `mention` | You were mentioned | 📢 |
| `follow` | New Follower | 👤 |
| `reblog` | Post Reblogged | 🔄 |
| `transfer` | Tokens Received | 💰 |

## Deduplication

Prevents sending duplicate notifications:
- Tracks sent notifications in `farcaster_notification_log` table
- Uses hash of (user, type, source_id, timestamp)
- Skips already-sent notifications

## Error Handling

The endpoint handles errors gracefully:
- Failed user fetches → Skip user, continue
- Farcaster API errors → Log error, continue
- Database errors → Return error response
- Timeout → Partial results returned

## Performance

- **Processing Time**: 1-5 seconds for 10 users
- **Rate Limiting**: Farcaster may rate limit
- **Batch Processing**: Processes all users in one request
- **Timeout**: Vercel serverless timeout (10s default, 30s max)

**Optimization:**
```javascript
// Add max users per run
const MAX_USERS_PER_RUN = 50;
const users = await getLinkedUsers();
const batch = users.slice(0, MAX_USERS_PER_RUN);
```

## Monitoring

Check cron job health:
```bash
# Test manually
curl https://skatehive.app/api/cron

# Check logs
curl https://skatehive.app/api/farcaster/cleanup \
  -X POST \
  -H "Authorization: Bearer cron-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"action":"stats"}'
```

## Related Endpoints

- `/api/farcaster/notifications-queue` - Get pending notifications
- `/api/farcaster/notify` - Send individual notification
- `/api/farcaster/test-notifications` - Test notification processing
- `/api/farcaster/cleanup` - Database cleanup

## Security

🔒 **No Authentication**: Cron endpoint is public

**Recommendations:**
1. Add secret token validation:
```javascript
const cronSecret = request.headers.get('x-cron-secret');
if (cronSecret !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

2. Use Vercel Cron (includes authentication)
3. Rate limit endpoint (max 1 request per minute)

## Dependencies

- `@/lib/farcaster/automated-notifications`: `AutomatedNotificationService`
- PostgreSQL database for notification tracking
- Farcaster API for sending notifications
- Hive blockchain for notification data

## Database Tables

Required:
- `farcaster_tokens` - User tokens
- `farcaster_notification_log` - Deduplication
- `skatehive_farcaster_preferences` - User preferences

## Troubleshooting

**No notifications sent:**
- Check if users have linked Farcaster accounts
- Verify Farcaster tokens are active
- Check Hive API connectivity

**Duplicate notifications:**
- Verify deduplication is working
- Check `farcaster_notification_log` table

**Timeout errors:**
- Reduce `MAX_USERS_PER_RUN`
- Optimize database queries
- Use background jobs for processing

## Notes

- Runs automatically via Vercel Cron
- Can be triggered manually for testing
- Processes all linked users in single run
- Deduplicates to prevent spam
- Logs all activities for debugging
