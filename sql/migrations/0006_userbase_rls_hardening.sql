-- 0006_userbase_rls_hardening.sql
-- Harden RLS + privileges for userbase tables (Supabase)

-- Ensure RLS is enabled everywhere
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

-- Force RLS so table owners can't bypass policy checks
alter table public.userbase_users force row level security;
alter table public.userbase_auth_methods force row level security;
alter table public.userbase_sessions force row level security;
alter table public.userbase_identities force row level security;
alter table public.userbase_community_memberships force row level security;
alter table public.userbase_user_keys force row level security;
alter table public.userbase_secrets force row level security;
alter table public.userbase_key_usage_audit force row level security;
alter table public.userbase_magic_links force row level security;
alter table public.userbase_identity_challenges force row level security;

-- Remove direct access from anon/authenticated roles (API should use service_role)
revoke all on table public.userbase_users from anon, authenticated;
revoke all on table public.userbase_auth_methods from anon, authenticated;
revoke all on table public.userbase_sessions from anon, authenticated;
revoke all on table public.userbase_identities from anon, authenticated;
revoke all on table public.userbase_community_memberships from anon, authenticated;
revoke all on table public.userbase_user_keys from anon, authenticated;
revoke all on table public.userbase_secrets from anon, authenticated;
revoke all on table public.userbase_key_usage_audit from anon, authenticated;
revoke all on table public.userbase_magic_links from anon, authenticated;
revoke all on table public.userbase_identity_challenges from anon, authenticated;
