-- 0002_userbase_rls_supabase.sql
-- Supabase-only RLS policies for userbase tables

alter table public.userbase_users enable row level security;
alter table public.userbase_auth_methods enable row level security;
alter table public.userbase_sessions enable row level security;
alter table public.userbase_identities enable row level security;
alter table public.userbase_community_memberships enable row level security;
alter table public.userbase_user_keys enable row level security;
alter table public.userbase_secrets enable row level security;
alter table public.userbase_key_usage_audit enable row level security;
alter table public.userbase_magic_links enable row level security;
alter table public.userbase_identity_challenges enable row level security;

create policy "Service role can manage userbase_users" on public.userbase_users
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role can manage userbase_auth_methods" on public.userbase_auth_methods
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role can manage userbase_sessions" on public.userbase_sessions
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role can manage userbase_identities" on public.userbase_identities
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role can manage userbase_community_memberships" on public.userbase_community_memberships
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role can manage userbase_user_keys" on public.userbase_user_keys
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role can manage userbase_secrets" on public.userbase_secrets
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role can manage userbase_key_usage_audit" on public.userbase_key_usage_audit
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role can manage userbase_magic_links" on public.userbase_magic_links
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role can manage userbase_identity_challenges" on public.userbase_identity_challenges
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');
