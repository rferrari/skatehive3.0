-- 0004_userbase_identity_challenges.sql
-- Challenges for verifying identity linkage (e.g., EVM signature)

create table if not exists public.userbase_identity_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.userbase_users(id) on delete cascade,
  type text not null, -- hive | evm | farcaster
  identifier text not null, -- address or handle
  nonce text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create index if not exists userbase_identity_challenges_user_id_idx
  on public.userbase_identity_challenges(user_id);

create index if not exists userbase_identity_challenges_type_identifier_idx
  on public.userbase_identity_challenges(type, identifier);

create index if not exists userbase_identity_challenges_expires_at_idx
  on public.userbase_identity_challenges(expires_at);
