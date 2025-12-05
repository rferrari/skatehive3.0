# Signup Key Backup API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Emergency key backup system - **CURRENTLY DISABLED**. The `key_backups` table doesn't exist in the schema. Returns success to prevent errors during signup but doesn't actually store backups.

**Status**: ⚠️ Disabled (Table not implemented)  
**Methods**: `POST`, `GET`  
**Path**: `/api/signup/key-backup`

## Endpoints

### POST /api/signup/key-backup

Creates emergency backup (currently disabled).

**Response (200 OK):**
```json
{
  "success": true,
  "backup_id": null,
  "message": "Key backup temporarily disabled - keys sent via email only"
}
```

### GET /api/signup/key-backup

Returns backup system information.

**Response (200 OK):**
```json
{
  "message": "Emergency Key Backup System",
  "status": "DISABLED - key_backups table not available",
  "backup_table_schema": "CREATE TABLE key_backups (...)"
}
```

## Intended Functionality

When implemented, would:
1. Store encrypted keys for 24 hours
2. Allow one-time retrieval
3. Serve as fallback if email fails
4. Auto-expire after 24h or retrieval

## Database Schema (Not Implemented)

```sql
CREATE TABLE key_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID UNIQUE NOT NULL,
  username VARCHAR(50) NOT NULL,
  signup_token UUID NOT NULL,
  keys_encrypted TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  retrieved BOOLEAN DEFAULT FALSE,
  retrieved_at TIMESTAMPTZ
);
```

## Related Endpoints

- `/api/signup/key-backup/[backup_id]` - Retrieve backup
- `/api/signup/submit` - Calls backup creation

## Notes

- Currently returns dummy success response
- Keys only delivered via email
- Table needs to be created to enable feature
- Migration required before activation
