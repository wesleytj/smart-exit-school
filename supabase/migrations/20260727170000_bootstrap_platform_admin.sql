-- ============================================================
-- Smart Exit School
-- Migration 0009
-- File: 20260727170000_bootstrap_platform_admin.sql
-- Description:
--   Bootstraps Platform Admin by inserting into public.platform_admins
--   for an existing Auth profile (email admin@alltech.com). Auth
--   identities must already exist via Supabase Auth — never SQL
--   inserts into auth.users. Idempotent (ON CONFLICT DO NOTHING).
--
-- Scope:
--   insert into public.platform_admins only
--
-- Depends on:
--   Migrations 0007, 0010 (profiles sync)
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
