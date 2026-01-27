# Codex Agent Handoff: Userbase Branch

**Date:** January 26, 2026  
**Branch:** `userbase`  
**Feature:** Userbase Soft Post Overlay System  
**Status:** ✅ Complete and Ready for Deployment

---

## Branch Overview

This branch (`userbase`) contains a major feature update: the **Userbase Lite Users System**. It enables users without Hive blockchain keys (email-only or wallet-only accounts) to post content through a shared default Hive account while maintaining their personal identity in the UI.

## Code State Summary

| Area | Status | Notes |
|------|--------|-------|
| TypeScript | ✅ Clean | All build errors fixed |
| ESLint | ✅ Passes | Warnings only (pre-existing) |
| Build | ✅ Ready | `pnpm build` succeeds |
| Feature | ✅ Working | Tested locally, overlays display correctly |
| Debug Logging | ✅ Cleaned | Verbose logs removed |
| Documentation | ✅ Complete | See `docs/USERBASE_SOFT_POSTS.md` |

## What This Update Does

**Problem Solved:** Posts from lite users appeared as "skateuser" with no way to identify the actual author.

**Solution:** Posts now show the real user's display_name and avatar (e.g., "Wallet 0x8bf5" with their ENS avatar) via a soft post overlay system.

## Core Technical Change

The main fix was a **React state timing problem** where the API returned correct data but individual component instances didn't re-render when the shared cache was populated.

**Solution:** Implemented a **cache subscription system**:

```typescript
// Module-level subscribers
const cacheSubscribers = new Set<() => void>();

function notifyCacheUpdate() {
  cacheSubscribers.forEach((callback) => callback());
}

// In hook - subscribe and force re-render
const [, forceUpdate] = useState(0);
useEffect(() => {
  const handleCacheUpdate = () => forceUpdate((n) => n + 1);
  cacheSubscribers.add(handleCacheUpdate);
  return () => cacheSubscribers.delete(handleCacheUpdate);
}, []);
```

### Files Modified in This Session

| File | Changes |
|------|---------|
| `hooks/useSoftPostOverlay.ts` | Added cache subscription system, cleaned up debug logs |
| `app/api/userbase/soft-posts/route.ts` | Cleaned up verbose debug logging |
| `components/homepage/Snap.tsx` | Switched to `extractSafeUser`, removed debug logging |
| `lib/userbase/safeUserMetadata.ts` | Removed `debugExtractSafeUser` helper |

### TypeScript Fixes Applied

Fixed 6 TypeScript build errors:
- `app/api/userbase/auth/session/route.ts` - Array type handling
- `app/api/userbase/auth/sign-up/route.ts` - body→payload reference
- `app/api/userbase/merge/route.ts` - body→payload references (2 places)
- `components/homepage/Conversation.tsx` - Vote result error checking
- `components/userbase/UserbaseSignUpForm.tsx` - ensName null→undefined
- `components/userbase/UserbaseWalletBootstrapper.tsx` - ensName null→undefined

---

## Database Requirements

Before deploying, ensure these migrations have been run on Supabase:

```bash
# Required migrations (in order)
sql/migrations/0001_userbase.sql
sql/migrations/0002_userbase_rls_supabase.sql
sql/migrations/0003_userbase_auth.sql
sql/migrations/0007_userbase_soft_posts.sql
sql/migrations/0008_userbase_soft_posts_rls.sql
sql/migrations/0013_userbase_soft_posts_safe_user.sql
```

---

## Post-Deployment Verification

### Immediate (After Deploy)

1. **Verify overlay works** - Check feed shows correct display_name/avatar for lite user posts
2. **Test with real users** - Have a lite user post and verify identity displays
3. **Check API responses** - `/api/userbase/soft-posts` should return user data

### Follow-up Tasks

1. **Profile Page Overlay** - Ensure `/user/[username]` pages use overlays
2. **Comment/Reply Overlays** - Verify overlays work for comments, not just snaps
3. **Soft Vote Overlay** - May need same subscription fix in `useSoftVoteOverlay.ts`

---

## Testing Checklist

- [ ] Feed shows correct display_name for `skateuser` posts
- [ ] Feed shows correct avatar for `skateuser` posts  
- [ ] Multiple lite user posts show different profiles
- [ ] Page refresh not required (subscription works)
- [ ] No duplicate API calls (inflight deduplication)
- [ ] Build passes (`pnpm build`)
- [ ] No console errors in browser

---

## Key Configuration

- **Database:** Supabase - tables prefixed with `userbase_`
- **Default Hive Account:** `skateuser`
- **Safe User Hash:** Stored in `json_metadata.skatehive_user`

---

## Quick Reference

## Quick Commands

```bash
# Run development
pnpm dev

# Check lint
pnpm lint

# Build for production
pnpm build
```

## Code Examples

**Main Hook:**
```typescript
import useSoftPostOverlay from "@/hooks/useSoftPostOverlay";
const softPost = useSoftPostOverlay(author, permlink, safeUser);
```

**Extract Safe User:**
```typescript
import { extractSafeUser } from "@/lib/userbase/safeUserMetadata";
const safeUser = extractSafeUser(discussion.json_metadata);
```

---

## Summary for Codex Agent

**Branch `userbase` is ready to deploy.** This branch adds lite user support - users can sign up with email or wallet only (no Hive keys) and post to the blockchain via a shared account. The overlay system ensures their real identity (name, avatar) displays in the feed instead of the shared account name.

**All code is clean:**
- TypeScript compiles without errors
- ESLint passes (only pre-existing warnings)
- Debug logging has been removed
- Documentation is complete

**After deployment, verify:** Feed displays correct user profiles for posts from `skateuser` account.

