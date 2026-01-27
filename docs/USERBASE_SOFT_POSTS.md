# Userbase Soft Posts System

## Overview

The **Soft Posts** system enables "lite" users (email-only or wallet-only accounts without Hive keys) to post content to the Hive blockchain. Posts are published under a shared default Hive account (`skateuser`) but display the user's actual profile information (display name, avatar, handle) via an overlay system.

## Architecture

### Data Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Lite User      │     │  Default Hive    │     │   Hive          │
│   (no keys)      │────▶│  Account         │────▶│   Blockchain    │
│                  │     │  (skateuser)     │     │                 │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌──────────────────┐     ┌──────────────────┐
│  userbase_users  │◀───▶│ userbase_soft_   │
│  (user profile)  │     │ posts (registry) │
└──────────────────┘     └──────────────────┘
```

1. **User creates content** → saved to `userbase_soft_posts` with their `user_id`
2. **Backend broadcasts** → publishes to Hive under `skateuser` with `safe_user` hash in metadata
3. **Feed displays** → `useSoftPostOverlay` hook fetches overlay data to show real author

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `useSoftPostOverlay` | `hooks/useSoftPostOverlay.ts` | React hook for fetching/caching overlay data |
| `useSoftPostOverlays` | `hooks/useSoftPostOverlay.ts` | Batch version for multiple posts |
| `extractSafeUser` | `lib/userbase/safeUserMetadata.ts` | Extracts safe_user hash from post metadata |
| `soft-posts API` | `app/api/userbase/soft-posts/route.ts` | API endpoint for fetching overlays |
| `Snap.tsx` | `components/homepage/Snap.tsx` | Feed item component using overlays |

### Database Schema

**Table: `userbase_soft_posts`**
```sql
- id: uuid (primary key)
- user_id: uuid (FK → userbase_users)
- author: text (Hive account, e.g., "skateuser")
- permlink: text (Hive permlink)
- safe_user: text (HMAC hash for secure lookup)
- type: text (post | comment | snap)
- status: text (queued | broadcasted | failed)
- metadata: jsonb (body, title, onchain data)
- created_at, updated_at, broadcasted_at: timestamptz
```

**Indexes:**
- `(author, permlink)` - unique index for fast lookup
- `(safe_user)` - index for safe_user-based queries
- `(user_id)` - index for user's posts

### Safe User Identification

Posts include a `safe_user` field (HMAC hash of `user_id`) in both:
1. **On-chain metadata** (`json_metadata.skatehive_user` or `json_metadata.safe_user`)
2. **Database column** (`userbase_soft_posts.safe_user`)

This allows the overlay system to match blockchain posts to userbase profiles securely.

## Hook Implementation Details

### Cache Architecture

```typescript
// Module-level shared cache
const overlayCache = new Map<string, { value: SoftPostOverlay | null; ts: number }>();
const inflight = new Map<string, Promise<void>>();  // Deduplication
const cacheSubscribers = new Set<() => void>();     // React update notifications

// Cache key format: "author/permlink"
```

### Key Features

1. **Shared Cache**: All hook instances share a single cache
2. **Inflight Deduplication**: Prevents duplicate API calls for same post
3. **NULL TTL**: Caches negative results for 2 minutes to avoid repeated lookups
4. **Subscription System**: Notifies React components when cache updates

### Usage Example

```typescript
import useSoftPostOverlay from "@/hooks/useSoftPostOverlay";
import { extractSafeUser } from "@/lib/userbase/safeUserMetadata";

function PostItem({ discussion }) {
  const safeUser = useMemo(
    () => extractSafeUser(discussion.json_metadata),
    [discussion.json_metadata]
  );

  const softPost = useSoftPostOverlay(
    discussion.author,
    discussion.permlink,
    safeUser
  );

  const displayAuthor = softPost?.user.display_name || discussion.author;
  const displayAvatar = softPost?.user.avatar_url || defaultAvatar;

  return (
    <div>
      <Avatar src={displayAvatar} />
      <span>{displayAuthor}</span>
    </div>
  );
}
```

## API Endpoint

**POST `/api/userbase/soft-posts`**

Request:
```json
{
  "posts": [
    { "author": "skateuser", "permlink": "abc123", "safe_user": "hash..." }
  ]
}
```

Response:
```json
{
  "items": [
    {
      "author": "skateuser",
      "permlink": "abc123",
      "user": {
        "id": "uuid...",
        "display_name": "Wallet 0x8bf5",
        "handle": "wallet-8bf594",
        "avatar_url": "https://..."
      }
    }
  ]
}
```

## Database Migrations

Run these migrations in order:

1. `0001_userbase.sql` - Base userbase tables
2. `0002_userbase_rls_supabase.sql` - RLS policies (Supabase only)
3. `0003_userbase_auth.sql` - Magic link auth
4. `0007_userbase_soft_posts.sql` - Soft posts table
5. `0008_userbase_soft_posts_rls.sql` - RLS for soft posts
6. `0013_userbase_soft_posts_safe_user.sql` - Safe user column and index

## Troubleshooting

### Posts showing "skateuser" instead of real author

1. **Check `safe_user` in metadata**: Post must have `json_metadata.skatehive_user` or `json_metadata.safe_user`
2. **Check database record**: `userbase_soft_posts` must have matching `safe_user` value
3. **Check user profile**: `userbase_users` must have `display_name` set

### API returns empty items

1. Verify Supabase connection (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
2. Check that `safe_user` values match between request and database
3. Ensure the user has a linked `userbase_users` record

## Current Status (January 2026)

✅ **Working:**
- Soft post overlay system fully functional
- Cache subscription pattern for React re-renders
- Safe user extraction from post metadata
- API endpoint with primary + secondary queries
- Feed displays correct display_name/avatar for lite users

🧹 **Cleaned up:**
- Debug logging removed from production code
- Unused `debugExtractSafeUser` helper removed
- Optimized imports (removed unused `useCallback`)

## Related Files

- `hooks/useSoftPostOverlay.ts` - Main overlay hook
- `hooks/useSoftVoteOverlay.ts` - Similar pattern for votes
- `lib/userbase/safeUserMetadata.ts` - Safe user extraction
- `app/api/userbase/soft-posts/route.ts` - API endpoint
- `components/homepage/Snap.tsx` - Feed component using overlays
