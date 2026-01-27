-- 0001_userbase.sql
-- Minimal Skatehive userbase schema (prefixed tables to avoid VIP conflicts)

create extension if not exists "pgcrypto";

-- USERS
create table if not exists public.userbase_users (
  id uuid primary key default gen_random_uuid(),
  handle text,
  display_name text,
  avatar_url text,
  cover_url text,
  bio text,
  location text,
  status text not null default 'active',
  onboarding_step int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists userbase_users_handle_ci_uniq
on public.userbase_users (lower(handle))
where handle is not null;

-- AUTH METHODS
create table if not exists public.userbase_auth_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.userbase_users(id) on delete cascade,
  type text not null,                 -- email_magic | passkey | future oauth
  identifier text,                    -- email normalized, passkey id, etc
  secret_hash text,                   -- nullable
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create unique index if not exists userbase_auth_methods_type_identifier_ci_uniq
on public.userbase_auth_methods (type, lower(identifier))
where identifier is not null;

-- SESSIONS
create table if not exists public.userbase_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.userbase_users(id) on delete cascade,
  refresh_token_hash text not null,
  device_id text,
  user_agent text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists userbase_sessions_user_id_idx on public.userbase_sessions(user_id);
create index if not exists userbase_sessions_expires_at_idx on public.userbase_sessions(expires_at);
create index if not exists userbase_sessions_refresh_token_hash_idx on public.userbase_sessions(refresh_token_hash);

-- IDENTITIES
create table if not exists public.userbase_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.userbase_users(id) on delete cascade,
  type text not null,                 -- hive | evm | farcaster
  handle text,                        -- hive username, farcaster username
  address text,                       -- evm address, farcaster custody address
  external_id text,                   -- farcaster fid
  is_primary boolean not null default false,
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists userbase_identities_type_handle_ci_uniq
on public.userbase_identities (type, lower(handle))
where handle is not null;

create unique index if not exists userbase_identities_type_address_ci_uniq
on public.userbase_identities (type, lower(address))
where address is not null;

create unique index if not exists userbase_identities_type_external_id_uniq
on public.userbase_identities (type, external_id)
where external_id is not null;

create unique index if not exists userbase_identities_primary_per_type_uniq
on public.userbase_identities (user_id, type)
where is_primary = true;

create index if not exists userbase_identities_user_id_idx on public.userbase_identities(user_id);

-- COMMUNITY MEMBERSHIPS
create table if not exists public.userbase_community_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.userbase_users(id) on delete cascade,
  community_tag text not null,
  role text not null default 'member',
  source text not null default 'autosubscribe',
  subscribed_at timestamptz not null default now()
);

create unique index if not exists userbase_community_memberships_user_tag_uniq
on public.userbase_community_memberships(user_id, community_tag);

create index if not exists userbase_community_memberships_tag_idx
on public.userbase_community_memberships(community_tag);

-- USER KEYS (registry only; encrypted key stored in secrets table)
create table if not exists public.userbase_user_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.userbase_users(id) on delete cascade,
  identity_id uuid not null references public.userbase_identities(id) on delete cascade,
  chain text not null default 'hive',
  key_type text not null,             -- posting | active
  custody text not null default 'none',-- none | stored
  status text not null default 'enabled',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  rotation_count int not null default 0
);

create unique index if not exists userbase_user_keys_identity_keytype_uniq
on public.userbase_user_keys(identity_id, key_type);

create index if not exists userbase_user_keys_user_id_idx
on public.userbase_user_keys(user_id);

-- SECRETS (encrypted only)
create table if not exists public.userbase_secrets (
  id uuid primary key default gen_random_uuid(),
  user_key_id uuid not null references public.userbase_user_keys(id) on delete cascade,
  ciphertext text not null,
  dek_wrapped text,
  key_version int not null default 1,
  created_at timestamptz not null default now(),
  rotated_at timestamptz,
  revoked_at timestamptz,
  unique (user_key_id)
);

-- KEY USAGE AUDIT
create table if not exists public.userbase_key_usage_audit (
  id uuid primary key default gen_random_uuid(),
  user_key_id uuid not null references public.userbase_user_keys(id) on delete cascade,
  action text not null,               -- decrypt | sign_broadcast | rotate | revoke
  route text,
  ip_hash text,
  device_id text,
  success boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists userbase_key_usage_user_key_id_created_idx
on public.userbase_key_usage_audit(user_key_id, created_at desc);

create index if not exists userbase_key_usage_action_created_idx
on public.userbase_key_usage_audit(action, created_at desc);

-- updated_at trigger for userbase_users
create or replace function public.userbase_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists userbase_users_updated_at on public.userbase_users;
create trigger userbase_users_updated_at
before update on public.userbase_users
for each row execute function public.userbase_set_updated_at();
