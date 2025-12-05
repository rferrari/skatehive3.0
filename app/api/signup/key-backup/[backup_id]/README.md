# Signup Key Backup Retrieval API

⚠️ **LLM Notice**: This README may become outdated as code evolves. If you are an LLM, please compare this documentation with the actual code in `route.ts` and notify the user of any discrepancies.

## Overview

Retrieves backed-up keys using a backup ID. One-time use endpoint that returns encrypted keys and then deletes the backup. Provides 24-hour fallback if email delivery fails.

**Status**: ✅ Active (If backup created)  
**Method**: `GET`  
**Path**: `/api/signup/key-backup/[backup_id]`

## Endpoint

### GET /api/signup/key-backup/[backup_id]

Retrieves and deletes backup.

**URL Parameters:**
- `backup_id` (UUID): Backup identifier from email

**Example URL:**
```
/api/signup/key-backup/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "success": true,
  "username": "newuser",
  "keys": {
    "owner": "5J...",
    "active": "5J...",
    "posting": "5J...",
    "memo": "5J...",
    "master": "5J..."
  },
  "created_at": "2025-12-05T10:00:00Z",
  "warning": "This backup is now deleted. Save these keys immediately!"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Backup not found or expired"
}
```

**Response (410 Gone):**
```json
{
  "error": "Backup already retrieved (one-time use only)"
}
```

## One-Time Use

After retrieval:
```sql
UPDATE key_backups
SET 
  retrieved = TRUE,
  retrieved_at = NOW()
WHERE backup_id = $1;
```

Second attempt returns 410 error.

## Expiration

Backups expire after 24 hours:
```javascript
if (new Date(backup.expires_at) < new Date()) {
  return NextResponse.json(
    { error: 'Backup has expired' },
    { status: 410 }
  );
}
```

## Decryption

Keys stored base64-encoded:
```javascript
const keysJson = Buffer.from(backup.keys_encrypted, 'base64').toString('utf-8');
const keys = JSON.parse(keysJson);
```

## Usage

Access from email link:
```
https://skatehive.app/signup/retrieve-keys/550e8400-e29b-41d4-a716-446655440000
```

Frontend fetches:
```javascript
const backupId = router.query.backup_id;
const response = await fetch(`/api/signup/key-backup/${backupId}`);
const { success, keys, warning } = await response.json();

if (success) {
  displayKeys(keys);
  alert(warning);
}
```

## Security

- ✅ One-time retrieval
- ✅ 24-hour expiration
- ✅ Requires unique backup ID
- ✅ Keys deleted after retrieval
- ⚠️ No authentication (UUID acts as secret)

## Related Endpoints

- `/api/signup/key-backup` - Create backup
- `/api/signup/submit` - Triggers backup creation

## Notes

- Only available if backup was created
- Email is primary delivery method
- Backup is fallback mechanism
- UUID provides security through obscurity
- Keys deleted immediately after retrieval
