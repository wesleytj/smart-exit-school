-- ============================================================
-- Smart Exit School
-- Initial Schema
-- Migration 0002
-- Description:
--   Creates the academic structure of the system,
--   including levels, shifts, groups, students,
--   and enrollments.
--
--
-- Tables:
--   - academic_levels
--   - academic_shifts
--   - academic_groups
--   - students
--   - student_enrollments
-- ============================================================
-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- ============================================================
-- ACADEMIC LEVELS
-- ============================================================
create table public.academic_levels (
    id uuid primary key default gen_random_uuid (),
    school_id uuid not null references public.schools (id) on delete cascade,
    name text not null,
    display_order integer not null check (display_order > 0),
    status text not null default 'active' check (status in ('active', 'inactive')),
    external_id text,
    created_at timestamptz not null default now (),
    updated_at timestamptz not null default now (),
    constraint academic_levels_school_name_unique unique (school_id, name)
);

create index idx_academic_levels_school_id on public.academic_levels (school_id);

create index idx_academic_levels_status on public.academic_levels (status);

create index idx_academic_levels_display_order on public.academic_levels (display_order);

create index idx_academic_levels_external_id on public.academic_levels (external_id);

-- ============================================================
-- ACADEMIC SHIFTS
-- ============================================================
create table public.academic_shifts (
    id uuid primary key default gen_random_uuid (),
    name text not null unique check (
        name in ('morning', 'afternoon', 'full_time', 'night')
    ),
    description text,
    created_at timestamptz not null default now (),
    updated_at timestamptz not null default now ()
);

-- ============================================================
-- ACADEMIC GROUPS
-- ============================================================
create table public.academic_groups (
    id uuid primary key default gen_random_uuid (),
    school_id uuid not null references public.schools (id) on delete cascade,
    academic_level_id uuid not null references public.academic_levels (id) on delete restrict,
    academic_shift_id uuid not null references public.academic_shifts (id) on delete restrict,
    name text not null,
    display_order integer not null check (display_order > 0),
    status text not null default 'active' check (status in ('active', 'inactive')),
    external_id text,
    created_at timestamptz not null default now (),
    updated_at timestamptz not null default now (),
    constraint academic_groups_school_level_shift_name_unique unique (
        school_id,
        academic_level_id,
        academic_shift_id,
        name
    )
);

create index idx_academic_groups_school_id on public.academic_groups (school_id);

create index idx_academic_groups_level_id on public.academic_groups (academic_level_id);

create index idx_academic_groups_shift_id on public.academic_groups (academic_shift_id);

create index idx_academic_groups_status on public.academic_groups (status);

create index idx_academic_groups_display_order on public.academic_groups (display_order);

create index idx_academic_groups_external_id on public.academic_groups (external_id);

-- ============================================================
-- STUDENTS
-- ============================================================
create table public.students (

    id uuid primary key default gen_random_uuid(),

    school_id uuid not null
        references public.schools(id)
        on delete cascade,

    student_identifier text not null,

    full_name text not null,

    birth_date date not null
    check (birth_date <= current_date),

    status text not null
        default 'active'
        check (
            status in (
                'active',
                'inactive'
            )
        ),

    external_id text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint students_school_identifier_unique
        unique (
            school_id,
            student_identifier
        )

);

create index idx_students_school_id
    on public.students (school_id);

create index idx_students_status
    on public.students (status);

create index idx_students_external_id
    on public.students (external_id);

-- ============================================================
-- STUDENT ENROLLMENTS
-- ============================================================

create table public.student_enrollments (

    id uuid primary key default gen_random_uuid(),

    student_id uuid not null
        references public.students(id)
        on delete cascade,

    academic_year integer not null
    check (academic_year >= 2000),

    status text not null
        default 'active'
        check (
            status in (
                'active',
                'inactive',
                'completed'
            )
        ),

    external_id text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint student_enrollments_student_year_unique
        unique (
            student_id,
            academic_year
        )

);

create index idx_student_enrollments_student_id
    on public.student_enrollments (student_id);

create index idx_student_enrollments_status
    on public.student_enrollments (status);

create index idx_student_enrollments_academic_year
    on public.student_enrollments (academic_year);

create index idx_student_enrollments_external_id
    on public.student_enrollments (external_id);