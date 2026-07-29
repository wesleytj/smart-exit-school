-- ============================================================
-- Smart Exit School
-- Migration 0012
-- File: 20260728150000_schools_insert_delete_for_platform_admin.sql
-- Description:
--   Completes Platform Admin CRUD on public.schools (ADR-028) by
--   adding INSERT and DELETE policies for is_platform_admin(),
--   plus matching GRANTs.
--
-- Scope:
--   public.schools insert/delete policies + grants
--
-- Depends on:
--   Migrations 0007, 0008
-- ============================================================

-- ============================================================
-- SCHOOLS — INSERT
-- Platform Admin only
-- ============================================================

drop policy if exists schools_insert_platform_admin on public.schools;

create policy schools_insert_platform_admin
on public.schools
for insert
to authenticated
with check (
    public.is_platform_admin()
);

-- ============================================================
-- SCHOOLS — DELETE
-- Platform Admin only
-- ============================================================

drop policy if exists schools_delete_platform_admin on public.schools;

create policy schools_delete_platform_admin
on public.schools
for delete
to authenticated
using (
    public.is_platform_admin()
);

-- ============================================================
-- GRANTS
-- ============================================================

grant insert on public.schools to authenticated;
grant delete on public.schools to authenticated;
