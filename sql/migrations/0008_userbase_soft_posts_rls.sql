-- 0008_userbase_soft_posts_rls.sql
-- RLS for userbase_soft_posts

alter table public.userbase_soft_posts enable row level security;
alter table public.userbase_soft_posts force row level security;

create policy "Service role can manage userbase_soft_posts" on public.userbase_soft_posts
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

revoke all on table public.userbase_soft_posts from anon, authenticated;
