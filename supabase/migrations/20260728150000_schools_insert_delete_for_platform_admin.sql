-- ============================================================
-- Smart Exit School
-- Migration 0012
-- File: 20260728150000_schools_insert_delete_for_platform_admin.sql
-- Description:
--   Completes Platform Admin CRUD on public.schools (Issue #16 /
--   ADR-028) by adding INSERT and DELETE policies restricted to
--   public.is_platform_admin(), plus matching GRANTs.
--
-- Scope:
--   - INSERT policy for Platform Admin
--   - DELETE policy for Platform Admin
--   - GRANT INSERT, DELETE to authenticated
--   - Does not alter existing SELECT or UPDATE policies
--   - Does not alter other tables, Auth, frontend, or repositories
--
-- Depends on:
--   - Migration 0007 (is_platform_admin)
--   - Migration 0008 (schools SELECT/UPDATE for platform admin)
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
