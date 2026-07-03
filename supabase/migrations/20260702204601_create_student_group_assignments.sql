-- ============================================================
-- Smart Exit School
-- Initial Schema
-- Migration 0003
-- Description:
--   Create student_group_assignments table to formally link a
--   student enrollment to its current academic group.
--
-- Tables:
--   - public.student_group_assignments
-- ============================================================

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

create table if not exists public.student_group_assignments (
    id uuid primary key default gen_random_uuid(),
    student_enrollment_id uuid not null,
    academic_group_id uuid not null,
    status text not null default 'active',
    assigned_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint student_group_assignments_status_check
        check (status in ('active', 'inactive')),

    constraint student_group_assignments_enrollment_fk
        foreign key (student_enrollment_id)
        references public.student_enrollments (id)
        on delete cascade,

    constraint student_group_assignments_group_fk
        foreign key (academic_group_id)
        references public.academic_groups (id)
        on delete restrict
);

create index if not exists idx_student_group_assignments_enrollment_id
    on public.student_group_assignments (student_enrollment_id);

create index if not exists idx_student_group_assignments_group_id
    on public.student_group_assignments (academic_group_id);

create unique index if not exists student_group_assignments_active_enrollment_unique
    on public.student_group_assignments (student_enrollment_id)
    where status = 'active';

comment on table public.student_group_assignments is
    'Vincula a matrícula do aluno à sua turma atual, permitindo identificar em qual turma ele deve ser chamado no fluxo operacional do Smart Exit School.';

comment on column public.student_group_assignments.student_enrollment_id is
    'Matrícula do aluno no ano letivo.';

comment on column public.student_group_assignments.academic_group_id is
    'Turma acadêmica atual vinculada à matrícula.';

comment on column public.student_group_assignments.status is
    'Status do vínculo entre matrícula e turma: active ou inactive.';

comment on column public.student_group_assignments.assigned_at is
    'Data/hora em que a matrícula foi vinculada à turma atual.';