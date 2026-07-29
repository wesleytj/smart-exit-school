-- ============================================================
-- Smart Exit School
-- Migration 0008
-- File: 20260727160000_extend_schools_policies_for_platform_admin.sql
-- Description:
--   Extends public.schools SELECT/UPDATE RLS policies so Platform
--   Admins (public.is_platform_admin — ADR-028) can operate
--   cross-tenant alongside tenant owner/administrator paths.
--
-- Scope:
--   public.schools policies (select/update)
--
-- Depends on:
--   Migrations 0005, 0007
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
