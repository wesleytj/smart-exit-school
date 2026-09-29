-- ============================================================
-- Smart Exit School
-- Migration
-- File: 20260928140000_pickup_events_operational_writes.sql
-- Description:
--   Allows authenticated school members to create and complete
--   pickup calls, and rejects an event whose school, enrollment
--   and gate are not the same school.
--
-- Scope:
--   - INSERT and UPDATE on public.pickup_events for authenticated
--   - SELECT stays as granted in Migration 0005
--   - DELETE is not granted
--   - Helper pickup_events_share_school
--   - BEFORE INSERT/UPDATE trigger for school coherence and for
--     completing only a row that is still called
--   - Existing pickup_events policies gain the same school check
--
-- Depends on:
--   - 20260703154000_create_pickup_core_foundation.sql
--   - 20260706180031_enable-rls-foundation.sql
-- ============================================================

create or replace function public.pickup_events_share_school(
    target_school_id uuid,
    target_enrollment_id uuid,
    target_gate_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.student_enrollments se
        join public.students s
          on s.id = se.student_id
        join public.gates g
          on g.id = target_gate_id
        where se.id = target_enrollment_id
          and s.school_id = target_school_id
          and g.school_id = target_school_id
    );
$$;

comment on function public.pickup_events_share_school(uuid, uuid, uuid) is
    'Returns true when the pickup school, the enrollment student school and the gate school are the same school.';

create or replace function public.enforce_pickup_event_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.pickup_events_share_school(new.school_id, new.student_enrollment_id, new.gate_id) then
        raise exception 'pickup_events school_id must match the enrollment school and the gate school'
            using errcode = '23514';
    end if;

    if tg_op = 'UPDATE'
       and new.status = 'completed'
       and old.status is distinct from 'called' then
        raise exception 'pickup event can only be completed from status called'
            using errcode = '23514';
    end if;

    if tg_op = 'UPDATE'
       and new.status = 'completed'
       and old.status = 'called' then
        new.completed_at := now();
        new.updated_at := now();
    end if;

    return new;
end;
$$;

comment on function public.enforce_pickup_event_coherence() is
    'Rejects a pickup event that crosses schools, and fills completed_at only when a called row becomes completed.';

drop trigger if exists pickup_events_coherence on public.pickup_events;

create trigger pickup_events_coherence
    before insert or update on public.pickup_events
    for each row
    execute function public.enforce_pickup_event_coherence();

-- ============================================================
-- POLICIES
-- Same names as Migration 0005, plus school coherence.
-- ============================================================

drop policy if exists pickup_events_select_member on public.pickup_events;
drop policy if exists pickup_events_insert_member on public.pickup_events;
drop policy if exists pickup_events_update_member on public.pickup_events;
drop policy if exists pickup_events_delete_member on public.pickup_events;

create policy pickup_events_select_member
on public.pickup_events
for select
to authenticated
using (
    public.is_active_school_member(school_id)
    and public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_gate(gate_id)
    and public.pickup_events_share_school(school_id, student_enrollment_id, gate_id)
);

create policy pickup_events_insert_member
on public.pickup_events
for insert
to authenticated
with check (
    public.is_active_school_member(school_id)
    and public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_gate(gate_id)
    and public.pickup_events_share_school(school_id, student_enrollment_id, gate_id)
);

create policy pickup_events_update_member
on public.pickup_events
for update
to authenticated
using (
    public.is_active_school_member(school_id)
    and public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_gate(gate_id)
    and public.pickup_events_share_school(school_id, student_enrollment_id, gate_id)
)
with check (
    public.is_active_school_member(school_id)
    and public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_gate(gate_id)
    and public.pickup_events_share_school(school_id, student_enrollment_id, gate_id)
);

create policy pickup_events_delete_member
on public.pickup_events
for delete
to authenticated
using (
    public.is_active_school_member(school_id)
    and public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_gate(gate_id)
    and public.pickup_events_share_school(school_id, student_enrollment_id, gate_id)
);

grant insert, update on table public.pickup_events to authenticated;

grant execute on function public.pickup_events_share_school(uuid, uuid, uuid) to authenticated;
grant execute on function public.enforce_pickup_event_coherence() to authenticated;
