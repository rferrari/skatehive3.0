-- 0014_userbase_identity_uniqueness.sql
-- Allow multiple users to link the same EVM/Farcaster identities.
-- Keep Hive handles unique.

drop index if exists userbase_identities_type_address_ci_uniq;
drop index if exists userbase_identities_type_external_id_uniq;
drop index if exists userbase_identities_type_handle_ci_uniq;

create unique index if not exists userbase_identities_hive_handle_ci_uniq
on public.userbase_identities (lower(handle))
where type = 'hive' and handle is not null;
