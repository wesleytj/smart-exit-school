-- ============================================================
-- Smart Exit School
-- Migration 0009
-- File: 20260727170000_bootstrap_platform_admin.sql
-- Description:
--   Bootstraps Platform Admin authority (ADR-028) by inserting a
--   row into public.platform_admins for an already-provisioned
--   profile. Auth identities must be created via Supabase Auth
--   (Dashboard, Admin API, or Auth signup) — never by SQL inserts
--   into auth.users / auth.identities.
--
-- Strategy:
--   Locate an existing public.profiles row whose linked Auth user
--   email is admin@alltech.com (read-only lookup on auth.users for
--   email resolution). Insert only into public.platform_admins.
--
-- Behavior:
--   - Assumes auth user + public.profiles already exist
--   - Writes exclusively to public.platform_admins
--   - Idempotent via ON CONFLICT DO NOTHING
--   - Safe on supabase db reset / db push when no matching profile
--     exists (inserts zero rows; does not fail)
--
-- Scope:
--   - Does not INSERT into auth.users or auth.identities
--   - Does not use crypt() / gen_salt() / password hashes
--   - Does not INSERT/UPDATE public.profiles
--   - Does not alter RLS policies, school_members, frontend,
--     repositories, or services
--
-- Depends on:
--   - Migration 0001 (profiles)
--   - Migration 0007 (platform_admins)
-- ============================================================

-- Promote matching profile to Platform Admin (idempotent).
-- created_by: reuse the earliest platform admin when present;
-- otherwise self-reference the promoted profile.
insert into public.platform_admins (
  profile_id,
  created_by
)
select
  p.id as profile_id,
  coalesce(
    (
      select pa.profile_id
      from public.platform_admins pa
      order by pa.created_at asc
      limit 1
    ),
    p.id
  ) as created_by
from public.profiles p
inner join auth.users u
  on u.id = p.id
where lower(u.email) = lower('admin@alltech.com')
on conflict (profile_id) do nothing;
