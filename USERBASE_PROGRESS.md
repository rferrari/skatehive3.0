# Userbase Integration Progress

Last update: 2026-01-26

## Current status
- Core userbase schema + migrations are in place (users, auth methods, sessions, identities, keys, secrets, soft posts/votes, merge audit).
- Email magic-link sign-in and sign-up are live.
- Wallet-only onboarding auto-creates user + session when Hive/EVM/Farcaster connects.
- Merge flow is available (merge preview + merge action) and wired into Settings.
- Default Hive account posting/voting for email-only users is working.
- Soft posts/votes are tracked and overlaid in the feed.
- Retry/cleanup jobs exist for soft posts and soft votes, invoked by `/api/cron`.
- Posting key storage (encrypted) is available in Settings.

## Where we stopped
- We just tightened error handling and mounted guards in the soft overlay hooks, added a post failure toast, and enabled cron retries for soft votes.
- We added a merge panel to Settings with translation keys.

## Next steps (short-term)
1) UI/UX review of Sign In & Sign Up
   - Check Connection modal vs `/sign-in` and `/sign-up` flow consistency.
   - Validate copy, layout, and CTA clarity.
   - Ensure magic-link response states are clear (loading, success, errors).
   - Confirm that email-only users see name + avatar defaults after login.

2) Lite profile support (app-only profiles)
   - Add a lightweight profile model for email-only users.
   - Render it on the profile page without touching Hive profiles.
   - Support merge: when accounts merge, consolidate lite profile data.
   - Edge cases: email-only → link Hive, wallet-only → add email, duplicate handles, missing avatars.

3) Merge flow QA
   - Verify merge preview counts (identities/auth/sessions/soft posts/votes).
   - Validate final state after merge: no dupes, identities moved, sessions retained.

4) Cron + retry validation
   - Trigger `/api/cron` and confirm both soft posts and soft votes retry.
   - Check alert webhook payloads on failures.

5) UX polish
   - Ensure identity linking/unlinking flows update UI state correctly.
   - Confirm “manage” modal closes on link success.

6) Production readiness
   - Verify env vars for default account, encryption secret, and alert webhook.
   - Confirm RLS policies are applied in Supabase for all userbase tables.

## Testing checklist
- Email sign-up → magic link → session established.
- Email sign-in only → profile defaults applied → post/vote with default account.
- Wallet-only connect → auto-create user → link identity.
- Merge: wallet + email accounts → merge → identity list correct.
- Retry job: set a post to failed → `/api/cron` retries → status updates.
