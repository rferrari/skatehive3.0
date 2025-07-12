# Database Setup for Farcaster Notifications

This guide covers setting up persistent storage for Farcaster notification tokens using Vercel Postgres.

## Quick Setup

### 1. Install Dependencies ✅

```bash
pnpm add @vercel/postgres
```

### 2. Configure Vercel Postgres

1. **Go to your Vercel dashboard**
2. **Navigate to your project → Storage → Create Database → Postgres**
3. **Copy the environment variables to your `.env.local`:**

```bash
POSTGRES_URL="postgres://default:..."
POSTGRES_PRISMA_URL="postgres://default:..."
POSTGRES_URL_NO_SSL="postgres://default:..."
POSTGRES_URL_NON_POOLING="postgres://default:..."
POSTGRES_USER="default"
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="verceldb"

# Set a secure password for database initialization
FARCASTER_INIT_PASSWORD="your_secure_password_here"
```

### 3. Initialize the Database

**Option A: Using the API endpoint (recommended)**

```bash
curl -X POST http://localhost:3000/api/farcaster/init-db \
  -H "Content-Type: application/json" \
  -d '{"password": "your_secure_password_here"}'
```

**Option B: Manual SQL execution**

Connect to your Vercel Postgres database and run:

```sql
CREATE TABLE IF NOT EXISTS farcaster_tokens (
  id SERIAL PRIMARY KEY,
  fid VARCHAR(50) NOT NULL UNIQUE,
  username VARCHAR(255),
  hive_username VARCHAR(255),
  token TEXT NOT NULL,
  notification_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_fid ON farcaster_tokens(fid);
CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_hive_username ON farcaster_tokens(hive_username);
CREATE INDEX IF NOT EXISTS idx_farcaster_tokens_active ON farcaster_tokens(is_active);
```

### 4. Verify Setup

Check database status:

```bash
curl http://localhost:3000/api/farcaster/init-db
```

Expected response:
```json
{
  "status": "connected",
  "totalTokens": 0,
  "activeTokens": 0,
  "lastUpdated": null
}
```

## Storage Modes

The notification system automatically selects the appropriate storage:

- **Production**: Always uses Vercel Postgres (requires `POSTGRES_URL`)
- **Development**: Uses in-memory storage (unless `POSTGRES_URL` is set)

### Force Database Mode in Development

Add to `.env.local`:
```bash
POSTGRES_URL="your_database_url"
```

## Database Schema

### `farcaster_tokens` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-incrementing primary key |
| `fid` | VARCHAR(50) | Farcaster ID (unique) |
| `username` | VARCHAR(255) | Farcaster username |
| `hive_username` | VARCHAR(255) | Linked Hive username (optional) |
| `token` | TEXT | Notification token |
| `notification_url` | TEXT | Farcaster client URL |
| `is_active` | BOOLEAN | Whether notifications are enabled |
| `created_at` | TIMESTAMP | Token creation time |
| `updated_at` | TIMESTAMP | Last update time |

### Indexes

- `idx_farcaster_tokens_fid`: Fast lookups by Farcaster ID
- `idx_farcaster_tokens_hive_username`: Fast lookups by Hive username
- `idx_farcaster_tokens_active`: Fast filtering of active tokens

## API Endpoints

### Database Management

- **POST** `/api/farcaster/init-db` - Initialize database tables
- **GET** `/api/farcaster/init-db` - Check database status

### Token Management

- **POST** `/api/farcaster/link` - Link Farcaster user to Hive notifications
- **POST** `/api/farcaster/webhook` - Process Farcaster webhook events
- **POST** `/api/farcaster/notify` - Send test notifications

## Monitoring

### Database Status Check

```typescript
import { getTokenStore } from '@/lib/farcaster/token-store-factory';

const tokenStore = getTokenStore();
const tokens = await tokenStore.getAllTokens();
console.log(`Total tokens: ${tokens.length}`);
console.log(`Active tokens: ${tokens.filter(t => t.isActive).length}`);
```

### Common Operations

```typescript
import { getTokenStore } from '@/lib/farcaster/token-store-factory';

const tokenStore = getTokenStore();

// Add a new token
await tokenStore.addToken('123', 'alice', 'token123', 'https://client.com', 'alice-hive');

// Get tokens for specific Hive users
const tokens = await tokenStore.getTokensForHiveUsers(['alice-hive', 'bob-hive']);

// Disable notifications
await tokenStore.disableNotifications('123');
```

## Troubleshooting

### Connection Issues

1. **Verify environment variables** are correctly set
2. **Check Vercel dashboard** for database status
3. **Test connection** with a simple query

### Migration from In-Memory

If you were using in-memory storage:

1. **Set up Vercel Postgres** following steps above
2. **Initialize database** with the API endpoint
3. **Restart your application** - tokens will now persist
4. **Users will need to re-link** their accounts

### Common Errors

**Error: "relation 'farcaster_tokens' does not exist"**
- Run the database initialization endpoint

**Error: "password authentication failed"**
- Check your `POSTGRES_URL` and credentials in Vercel dashboard

**Error: "connection timeout"**
- Verify your Vercel project is connected to the database

## Security Notes

- **Never commit** `.env.local` with real credentials
- **Use strong passwords** for `FARCASTER_INIT_PASSWORD`
- **Rotate tokens** periodically for security
- **Monitor database access** in Vercel dashboard

## Performance

- **Indexing**: Optimized for common queries (FID, Hive username, active status)
- **Connection pooling**: Handled automatically by Vercel Postgres
- **Caching**: Consider implementing Redis for high-traffic scenarios

## Next Steps

1. **Set up monitoring** for token usage and notification delivery rates
2. **Implement analytics** for notification effectiveness
3. **Add rate limiting** for notification endpoints
4. **Consider backup strategy** for critical token data
