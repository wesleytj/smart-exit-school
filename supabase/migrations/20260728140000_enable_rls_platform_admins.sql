-- ============================================================
-- Smart Exit School
-- Migration 0011
-- File: 20260728140000_enable_rls_platform_admins.sql
-- Description:
--   Locks down public.platform_admins (ADR-028) with Row Level
--   Security. Client Platform Admin checks must use
--   public.is_platform_admin() (SECURITY DEFINER), not broad
--   table scans.
--
-- Security model:
--   - RLS enabled
--   - SELECT only for the caller's own row (profile_id = auth.uid())
--   - No INSERT / UPDATE / DELETE policies for clients
--   - EXECUTE granted on is_platform_admin() for authenticated
--   - anon has no table privileges
--
-- Scope:
--   - public.platform_admins RLS + privileges
--   - EXECUTE on public.is_platform_admin()
--   - Does not alter prior migrations or other tables
--
-- Depends on:
--   - Migration 0007 (platform_admins, is_platform_admin)
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
