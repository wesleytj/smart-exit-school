-- ============================================================
-- Smart Exit School
-- Migration 0007
-- File: 20260727150000_create_platform_admins.sql
-- Description:
--   Introduces Platform Admin infrastructure defined by ADR-028.
--   Creates public.platform_admins and public.is_platform_admin().
--
-- Scope:
--   public.platform_admins, public.is_platform_admin()
--
-- Depends on:
--   Migration 0001 (profiles)
-- ============================================================

-- Required for gen_random_uuid() (kept for consistency with prior migrations)
create extension if not exists pgcrypto;

-- ============================================================
-- PLATFORM ADMINS
-- Maps authenticated profiles to Platform domain authority.
-- A platform admin never derives school CRUD authority from
-- school_members (ADR-028).
-- ============================================================

create table if not exists public.platform_admins (

    profile_id uuid primary key
        references public.profiles (id)
        on delete cascade,

    created_at timestamptz not null default now(),

    created_by uuid
        references public.profiles (id)
        on delete set null

);

create index if not exists idx_platform_admins_created_by
    on public.platform_admins (created_by);

comment on table public.platform_admins is
    'Platform domain operators (ADR-028). Not school members; authority is cross-tenant.';

comment on column public.platform_admins.profile_id is
    'Authenticated profile that holds Platform Admin authority.';

comment on column public.platform_admins.created_by is
    'Optional profile that registered this platform admin entry.';

-- ============================================================
-- HELPER FUNCTION
-- ============================================================

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.platform_admins pa
        where pa.profile_id = auth.uid()
    );
$$;

comment on function public.is_platform_admin() is
    'Returns true when the authenticated user is registered in public.platform_admins.';
