-- 0013_userbase_soft_posts_safe_user.sql
-- Add safe_user column to soft posts for reliable overlay lookup

alter table if exists public.userbase_soft_posts
add column if not exists safe_user text;

update public.userbase_soft_posts
set safe_user = coalesce(metadata->>'safe_user', metadata->>'skatehive_user')
where safe_user is null and metadata is not null;

create index if not exists userbase_soft_posts_safe_user_idx
on public.userbase_soft_posts(safe_user);
