-- 0010_userbase_soft_votes_rls.sql
-- RLS for userbase_soft_votes

alter table public.userbase_soft_votes enable row level security;
alter table public.userbase_soft_votes force row level security;

create policy "Service role can manage userbase_soft_votes" on public.userbase_soft_votes
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

revoke all on table public.userbase_soft_votes from anon, authenticated;
