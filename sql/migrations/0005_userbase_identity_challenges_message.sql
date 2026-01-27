-- 0005_userbase_identity_challenges_message.sql
-- Store the exact challenge message to avoid signature mismatches.

alter table public.userbase_identity_challenges
  add column if not exists message text;
