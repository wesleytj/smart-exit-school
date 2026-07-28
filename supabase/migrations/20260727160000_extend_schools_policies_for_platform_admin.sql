-- ============================================================
-- Smart Exit School
-- Migration 0008
-- File: 20260727160000_extend_schools_policies_for_platform_admin.sql
-- Description:
--   Extends public.schools RLS policies so Platform Admins
--   (public.is_platform_admin — Migration 0007 / ADR-028) receive
--   the same school-level access previously limited to tenant
--   owner / administrator paths, plus SELECT for cross-tenant
--   platform operations.
--
-- Scope:
--   - public.schools policies only
--   - Reuses public.is_platform_admin()
--   - Does not alter other tables, Auth, frontend, or repositories
--
-- Depends on:
--   - Migration 0005 (schools_select_member, is_active_school_member)
--   - Migration 0007 (is_platform_admin, platform_admins)
-- ============================================================

-- ============================================================
-- SCHOOLS — SELECT
-- Active school members OR platform admins
-- ============================================================

drop policy if exists schools_select_member on public.schools;

create policy schools_select_member
on public.schools
for select
to authenticated
using (
    public.is_active_school_member(public.schools.id)
    or public.is_platform_admin()
);

-- ============================================================
-- SCHOOLS — UPDATE
-- Tenant owner/administrator OR platform admins
-- ============================================================

drop policy if exists schools_update_owner_or_administrator on public.schools;

create policy schools_update_owner_or_administrator
on public.schools
for update
to authenticated
using (
    public.is_platform_admin()
    or (
        public.is_active_school_member(public.schools.id)
        and exists (
            select 1
            from public.school_members sm
            join public.roles r
              on r.id = sm.role_id
            where sm.school_id = public.schools.id
              and sm.profile_id = auth.uid()
              and sm.status = 'active'
              and r.name in ('owner', 'administrator')
        )
    )
)
with check (
    public.is_platform_admin()
    or (
        public.is_active_school_member(public.schools.id)
        and exists (
            select 1
            from public.school_members sm
            join public.roles r
              on r.id = sm.role_id
            where sm.school_id = public.schools.id
              and sm.profile_id = auth.uid()
              and sm.status = 'active'
              and r.name in ('owner', 'administrator')
        )
    )
);

-- Required for UPDATE policy to be usable by authenticated role
-- (Migration 0005 granted SELECT only).
grant update on public.schools to authenticated;
