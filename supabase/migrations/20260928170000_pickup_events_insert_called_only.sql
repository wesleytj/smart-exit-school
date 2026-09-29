-- ============================================================
-- Smart Exit School
-- Migration
-- File: 20260928170000_pickup_events_insert_called_only.sql
-- Description:
--   Hardens the pickup_events state machine for phase 1.
--   An insert must start as called. The only status change
--   allowed is called -> completed. While a row is called,
--   school_id, student_enrollment_id, gate_id and called_at
--   cannot change.
--
-- Preserves:
--   - pickup_events_share_school
--   - completed_at and updated_at on called -> completed
--   - pickup_events_active_enrollment_unique (unchanged)
--   - existing RLS policies (unchanged)
--   - no DELETE privilege for authenticated
--
-- Depends on:
--   - 20260928140000_pickup_events_operational_writes.sql
-- ============================================================

create or replace function public.enforce_pickup_event_coherence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if tg_op = 'UPDATE'
       and old.status = 'called'
       and (
            new.school_id is distinct from old.school_id
            or new.student_enrollment_id is distinct from old.student_enrollment_id
            or new.gate_id is distinct from old.gate_id
            or new.called_at is distinct from old.called_at
       ) then
        raise exception 'pickup event identity fields are immutable'
            using errcode = '23514';
    end if;

    if not public.pickup_events_share_school(new.school_id, new.student_enrollment_id, new.gate_id) then
        raise exception 'pickup_events school_id must match the enrollment school and the gate school'
            using errcode = '23514';
    end if;

    if tg_op = 'INSERT' and new.status is distinct from 'called' then
        raise exception 'pickup event insert must start as called'
            using errcode = '23514';
    end if;

    if tg_op = 'UPDATE' and new.status is distinct from old.status then
        if old.status is distinct from 'called' or new.status is distinct from 'completed' then
            raise exception 'pickup event status can only change from called to completed'
                using errcode = '23514';
        end if;
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
    'Rejects a cross-school pickup event. Inserts must start as called. The only status change is called to completed, which sets completed_at and updated_at. school_id, student_enrollment_id, gate_id and called_at stay unchanged while the row is called.';

revoke delete on table public.pickup_events from authenticated;
