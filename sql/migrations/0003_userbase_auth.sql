-- 0003_userbase_auth.sql
-- Userbase magic-link authentication support

create table if not exists public.userbase_magic_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.userbase_users(id) on delete cascade,
  identifier text not null,
  token_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create unique index if not exists userbase_magic_links_token_hash_uniq
on public.userbase_magic_links (token_hash);

create index if not exists userbase_magic_links_user_id_idx
on public.userbase_magic_links (user_id);

create index if not exists userbase_magic_links_expires_at_idx
on public.userbase_magic_links (expires_at);
