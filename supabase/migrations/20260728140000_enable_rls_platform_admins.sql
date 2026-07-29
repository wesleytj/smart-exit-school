-- ============================================================
-- Smart Exit School
-- Migration 0011
-- File: 20260728140000_enable_rls_platform_admins.sql
-- Description:
--   Enables RLS on public.platform_admins and EXECUTE on
--   public.is_platform_admin() (ADR-028). Clients must use the
--   RPC, not broad table scans.
--
-- Scope:
--   RLS + grants for platform_admins / is_platform_admin()
--
-- Depends on:
--   Migration 0007
-- ============================================================

-- ============================================================
-- RLS
-- ============================================================

alter table public.platform_admins enable row level security;

-- Own-row read only (defense in depth). Application code must not
-- query this table; it uses public.is_platform_admin() instead.
drop policy if exists platform_admins_select_own on public.platform_admins;

create policy platform_admins_select_own
on public.platform_admins
for select
to authenticated
using (profile_id = auth.uid());

-- No INSERT / UPDATE / DELETE policies for authenticated or anon.
-- Mutations remain restricted to privileged/migration roles.

-- ============================================================
-- PRIVILEGES
-- ============================================================

revoke all on table public.platform_admins from anon;
revoke all on table public.platform_admins from authenticated;

grant select on table public.platform_admins to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
