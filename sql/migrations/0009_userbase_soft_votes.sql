-- 0009_userbase_soft_votes.sql
-- Soft-vote registry for app-only users (votes cast via default Hive account)

create table if not exists public.userbase_soft_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.userbase_users(id) on delete cascade,
  author text not null,
  permlink text not null,
  weight int not null,
  status text not null default 'queued', -- queued | broadcasted | failed
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  broadcasted_at timestamptz
);

create unique index if not exists userbase_soft_votes_user_post_uniq
on public.userbase_soft_votes(user_id, author, permlink);

create index if not exists userbase_soft_votes_user_id_idx
on public.userbase_soft_votes(user_id);

create index if not exists userbase_soft_votes_created_at_idx
on public.userbase_soft_votes(created_at desc);
