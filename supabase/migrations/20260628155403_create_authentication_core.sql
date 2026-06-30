-- ============================================================
-- Smart Exit School
-- Initial Schema
-- Migration 0001
-- Description:
--   Creates the core database structure for authentication
--   and tenant management.
--
-- Tables:
--   - schools
--   - roles
--   - profiles
--   - school_members
-- ============================================================

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- ============================================================
-- SCHOOLS
-- ============================================================

create table public.schools (

    id uuid primary key default gen_random_uuid(),

    slug text not null unique,

    name text not null,

    status text not null
        default 'trial'
        check (status in (
            'trial',
            'active',
            'inactive',
            'suspended'
        )),

    plan text not null
        default 'basic'
        check (plan in (
            'basic',
            'pro',
            'enterprise'
        )),

    timezone text not null default 'America/Sao_Paulo',

    locale text not null default 'pt-BR',

    currency text not null default 'BRL',

    logo_url text,

    primary_color text,

    secondary_color text,

    external_id text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()

);

create index idx_schools_external_id
    on public.schools (external_id);

create index idx_schools_status
    on public.schools (status);

create index idx_schools_plan
    on public.schools (plan);

-- ============================================================
-- ROLES
-- ============================================================

create table public.roles (

    id uuid primary key default gen_random_uuid(),

    name text not null unique
    check (
        name in (
            'owner',
            'administrator',
            'secretary',
            'gatekeeper'
        )
    ),

    description text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()

);

-- ============================================================
-- PROFILES
-- ============================================================

create table public.profiles (

    id uuid primary key
        references auth.users(id)
        on delete cascade,

    full_name text not null,

    avatar_url text,

    phone text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()

);

-- ============================================================
-- SCHOOL MEMBERS
-- ============================================================

create table public.school_members (

    id uuid primary key default gen_random_uuid(),

    school_id uuid not null
        references public.schools(id)
        on delete cascade,

    profile_id uuid not null
        references public.profiles(id)
        on delete cascade,

    role_id uuid not null
        references public.roles(id)
        on delete restrict,

    status text not null
        default 'active'
        check (status in (
            'active',
            'inactive'
        )),

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint school_members_school_profile_unique
    unique (school_id, profile_id)

);

create index idx_school_members_school_id
    on public.school_members (school_id);

create index idx_school_members_profile_id
    on public.school_members (profile_id);

create index idx_school_members_role_id
    on public.school_members (role_id);