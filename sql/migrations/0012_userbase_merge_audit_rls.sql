-- 0012_userbase_merge_audit_rls.sql
-- RLS for userbase_merge_audit

alter table public.userbase_merge_audit enable row level security;
alter table public.userbase_merge_audit force row level security;

create policy "Service role can manage userbase_merge_audit" on public.userbase_merge_audit
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

revoke all on table public.userbase_merge_audit from anon, authenticated;
