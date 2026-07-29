-- ============================================================
-- Smart Exit School
-- Migration 0004
-- File: 20260703154000_create_pickup_core_foundation.sql
-- Description:
--   Creates the Pickup Core foundation for the operational
--   student dismissal flow (gates, pickup_events).
--
-- Scope:
--   public.gates, public.pickup_events
--
-- Depends on:
--   Migrations 0001–0003
-- ============================================================

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- ============================================================
-- GATES
-- ============================================================

create table if not exists public.gates (
    id uuid primary key default gen_random_uuid(),
    school_id uuid not null,
    name text not null,
    description text,
    display_order integer not null default 1,
    status text not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint gates_school_fk
        foreign key (school_id)
        references public.schools (id)
        on delete cascade,

    constraint gates_school_name_unique
        unique (school_id, name),

    constraint gates_status_check
        check (status in ('active', 'inactive')),

    constraint gates_display_order_check
        check (display_order > 0)
);

create index if not exists idx_gates_school_id
    on public.gates (school_id);

create index if not exists idx_gates_status
    on public.gates (status);

comment on table public.gates is
    'Represents school exit gates used in the student dismissal flow.';

comment on column public.gates.school_id is
    'School that owns the gate.';

comment on column public.gates.name is
    'Display name of the gate inside the institution.';

comment on column public.gates.description is
    'Optional description or operational note about the gate.';

comment on column public.gates.display_order is
    'Defines the display order of gates in the operational interface.';

comment on column public.gates.status is
    'Gate status: active or inactive.';

-- ============================================================
-- PICKUP EVENTS
-- ============================================================

create table if not exists public.pickup_events (
    id uuid primary key default gen_random_uuid(),
    school_id uuid not null,
    student_enrollment_id uuid not null,
    gate_id uuid not null,
    status text not null default 'called',
    called_at timestamptz not null default now(),
    completed_at timestamptz,
    cancelled_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint pickup_events_school_fk
        foreign key (school_id)
        references public.schools (id)
        on delete cascade,

    constraint pickup_events_student_enrollment_fk
        foreign key (student_enrollment_id)
        references public.student_enrollments (id)
        on delete cascade,

    constraint pickup_events_gate_fk
        foreign key (gate_id)
        references public.gates (id)
        on delete restrict,

    constraint pickup_events_status_check
        check (status in ('called', 'completed', 'cancelled')),

    constraint pickup_events_status_timestamps_check
        check (
            (status = 'called' and completed_at is null and cancelled_at is null)
            or
            (status = 'completed' and completed_at is not null and cancelled_at is null)
            or
            (status = 'cancelled' and cancelled_at is not null and completed_at is null)
        )
);

create index if not exists idx_pickup_events_school_id
    on public.pickup_events (school_id);

create index if not exists idx_pickup_events_student_enrollment_id
    on public.pickup_events (student_enrollment_id);

create index if not exists idx_pickup_events_gate_id
    on public.pickup_events (gate_id);

create index if not exists idx_pickup_events_status
    on public.pickup_events (status);

create index if not exists idx_pickup_events_called_at
    on public.pickup_events (called_at);

create unique index if not exists pickup_events_active_enrollment_unique
    on public.pickup_events (student_enrollment_id)
    where status = 'called';

comment on table public.pickup_events is
    'Represents operational student dismissal events, including active calls, completed pickups and cancelled calls.';

comment on column public.pickup_events.school_id is
    'School responsible for the dismissal event.';

comment on column public.pickup_events.student_enrollment_id is
    'Student enrollment associated with the dismissal event.';

comment on column public.pickup_events.gate_id is
    'Gate where the student was called for dismissal.';

comment on column public.pickup_events.status is
    'Operational status of the dismissal event: called, completed or cancelled.';

comment on column public.pickup_events.called_at is
    'Timestamp when the student was called for dismissal.';

comment on column public.pickup_events.completed_at is
    'Timestamp when the dismissal event was completed.';

comment on column public.pickup_events.cancelled_at is
    'Timestamp when the dismissal event was cancelled.';