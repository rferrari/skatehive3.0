# Database Initialization API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Initializes or checks Farcaster notification database tables. Executes SQL schema from `sql/farcaster_notifications.sql` to create required tables for the Farcaster integration system.

**Status**: 🔧 Admin Only  
**Methods**: `POST`, `GET`  
**Path**: `/api/database/init`

## Endpoints

### POST /api/database/init

Initializes database tables.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Database initialization completed",
  "results": [
    {
      "statement": "CREATE TABLE farcaster_tokens...",
      "success": true
    },
    {
      "statement": "CREATE TABLE farcaster_notifica...",
      "success": true
    }
  ]
}
```

**Response (500 Error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

### GET /api/database/init

Checks existing tables.

**Response (200 OK):**
```json
{
  "success": true,
  "existingTables": [
    "farcaster_tokens",
    "farcaster_notifications"
  ],
  "missingTables": [
    "farcaster_notification_log"
  ]
}
```

## Created Tables

1. **farcaster_tokens**
   - Stores Farcaster notification tokens
   - Links FID to Hive username
   
2. **farcaster_notifications**  
   - Queues notifications to send
   - Tracks delivery status

3. **farcaster_notification_log**
   - Deduplication and analytics
   - Tracks sent notifications

## SQL Schema

Located at: `/sql/farcaster_notifications.sql`

Example structure:
```sql
CREATE TABLE IF NOT EXISTS farcaster_tokens (
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
```

## Usage

Initialize database:
```bash
curl -X POST https://skatehive.app/api/database/init
```

Check status:
```bash
curl https://skatehive.app/api/database/init
```

## Environment Variables

Uses database connection:
- `STORAGE_POSTGRES_URL` (preferred)
- `POSTGRES_URL` (fallback)

Auto-configured if `STORAGE_POSTGRES_URL` is set.

## Error Handling

- Splits SQL file by semicolon
- Executes statements sequentially
- Continues on error (logs failure)
- Returns summary of all operations

## Security

⚠️ **No Authentication**: Endpoint is public

**Recommendations:**
1. Add admin authentication
2. Restrict to specific IPs
3. Disable in production after initial setup
4. Add authorization header check

## Related Endpoints

- `/api/farcaster/init-db` - Alternative initialization
- `/api/farcaster/status` - Check system status

## Testing

Test initialization:
```bash
# Check existing tables
curl http://localhost:3000/api/database/init

# Initialize
curl -X POST http://localhost:3000/api/database/init

# Verify
curl http://localhost:3000/api/database/init | jq '.missingTables'
```

## Dependencies

- `@vercel/postgres` - Database connection
- `fs` - Read SQL file
- `path` - File path resolution

## Notes

- Safe to run multiple times (IF NOT EXISTS)
- SQL file must be valid PostgreSQL
- Statements separated by semicolons
- Comments (--) are filtered out
- Run once during initial setup
