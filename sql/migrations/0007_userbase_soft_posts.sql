-- 0007_userbase_soft_posts.sql
-- Soft-post registry for app-only users (posts authored by a default Hive account)

create table if not exists public.userbase_soft_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.userbase_users(id) on delete cascade,
  author text not null, -- default Hive account
  permlink text not null,
  title text,
  type text not null default 'post', -- post | comment | snap
  status text not null default 'queued', -- queued | broadcasted | failed
  tx_id text,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  broadcasted_at timestamptz
);

create unique index if not exists userbase_soft_posts_author_permlink_uniq
on public.userbase_soft_posts(author, permlink);

create index if not exists userbase_soft_posts_user_id_idx
on public.userbase_soft_posts(user_id);

create index if not exists userbase_soft_posts_created_at_idx
on public.userbase_soft_posts(created_at desc);
