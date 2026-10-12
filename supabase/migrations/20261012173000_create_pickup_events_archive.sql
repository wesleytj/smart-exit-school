-- ============================================================
-- Smart Exit School
-- Migration
-- File: 20261012173000_create_pickup_events_archive.sql
-- Description:
--   Cycle C · Delivery C3: Archive foundation for old pickup events.
--   Creates public.pickup_events_archive, partial temporal indexes
--   on public.pickup_events, and the batch archival function
--   public.archive_old_pickup_events.
--
-- Security:
--   - archive_old_pickup_events is SECURITY DEFINER with search_path = public.
--   - EXECUTE is granted ONLY to service_role and postgres.
--   - EXECUTE is REVOKED from public, anon, and authenticated.
--   - Invocation is strictly restricted to controlled backend services
--     (Edge Functions, service_role tasks or administrative CLI audit scripts).
--   - Operator sessions (authenticated) CANNOT call this function directly.
--   - Rows with status = 'called' are NEVER archived or deleted.
--   - No pg_cron or scheduled jobs enabled in this migration.
--
-- Depends on:
--   - 20260703154000_create_pickup_core_foundation.sql
--   - 20260706180031_enable-rls-foundation.sql
--   - 20261003220000_pickup_events_allow_cancellation.sql
-- ============================================================

-- 1. Índices temporais parciais em public.pickup_events
create index if not exists idx_pickup_events_status_completed_at
    on public.pickup_events (status, completed_at)
    where status = 'completed';

create index if not exists idx_pickup_events_status_cancelled_at
    on public.pickup_events (status, cancelled_at)
    where status = 'cancelled';

-- 2. Tabela de arquivo public.pickup_events_archive
create table if not exists public.pickup_events_archive (
    id uuid primary key,
    school_id uuid not null,
    student_enrollment_id uuid not null,
    gate_id uuid not null,
    status text not null,
    called_at timestamptz not null,
    completed_at timestamptz,
    cancelled_at timestamptz,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    archived_at timestamptz not null default now(),

    constraint pickup_events_archive_school_fk
        foreign key (school_id)
        references public.schools (id)
        on delete cascade,

    constraint pickup_events_archive_student_enrollment_fk
        foreign key (student_enrollment_id)
        references public.student_enrollments (id)
        on delete cascade,

    constraint pickup_events_archive_gate_fk
        foreign key (gate_id)
        references public.gates (id)
        on delete restrict,

    constraint pickup_events_archive_status_check
        check (status in ('completed', 'cancelled')),

    constraint pickup_events_archive_status_timestamps_check
        check (
            (status = 'completed' and completed_at is not null and cancelled_at is null)
            or
            (status = 'cancelled' and cancelled_at is not null and completed_at is null)
        )
);

create index if not exists idx_pickup_events_archive_school_id
    on public.pickup_events_archive (school_id);

create index if not exists idx_pickup_events_archive_archived_at
    on public.pickup_events_archive (archived_at);

create index if not exists idx_pickup_events_archive_student_enrollment_id
    on public.pickup_events_archive (student_enrollment_id);

create index if not exists idx_pickup_events_archive_gate_id
    on public.pickup_events_archive (gate_id);

comment on table public.pickup_events_archive is
    'Historical archive of completed and cancelled pickup dismissal events for legal and auditing retention.';

-- 3. Row Level Security em public.pickup_events_archive
alter table public.pickup_events_archive enable row level security;

create policy pickup_events_archive_select_member
on public.pickup_events_archive
for select
to authenticated
using (
    public.is_active_school_member(school_id)
);

-- Permissão de leitura histórica para membros autenticados
grant select on table public.pickup_events_archive to authenticated;

-- Revoga explicitamente permissões de mutação de public, anon e authenticated
revoke insert, update, delete, truncate on table public.pickup_events_archive from public, anon, authenticated;

-- 4. Função atômica de arquivamento em lote public.archive_old_pickup_events
create or replace function public.archive_old_pickup_events(
    p_older_than interval default interval '30 days',
    p_batch_limit integer default 5000,
    p_school_id uuid default null
)
returns table (
    archived_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_archived integer := 0;
begin
    -- Validação defensiva do limite de lote (evita transações desmedidas)
    if p_batch_limit is null or p_batch_limit <= 0 then
        p_batch_limit := 5000;
    elsif p_batch_limit > 10000 then
        p_batch_limit := 10000;
    end if;

    -- Validação defensiva do intervalo de retenção
    if p_older_than is null or p_older_than <= interval '0 seconds' then
        p_older_than := interval '30 days';
    end if;

    -- Transferência atômica via CTE com bloqueio por linha (SKIP LOCKED)
    -- NUNCA seleciona status = 'called'
    with eligible_events as (
        select id
        from public.pickup_events
        where status in ('completed', 'cancelled')
          and coalesce(completed_at, cancelled_at, updated_at) < (now() - p_older_than)
          and (p_school_id is null or school_id = p_school_id)
        order by coalesce(completed_at, cancelled_at, updated_at) asc
        limit p_batch_limit
        for update skip locked
    ),
    inserted_archive as (
        insert into public.pickup_events_archive (
            id,
            school_id,
            student_enrollment_id,
            gate_id,
            status,
            called_at,
            completed_at,
            cancelled_at,
            created_at,
            updated_at,
            archived_at
        )
        select
            pe.id,
            pe.school_id,
            pe.student_enrollment_id,
            pe.gate_id,
            pe.status,
            pe.called_at,
            pe.completed_at,
            pe.cancelled_at,
            pe.created_at,
            pe.updated_at,
            now()
        from public.pickup_events pe
        join eligible_events ee on ee.id = pe.id
        returning id
    ),
    deleted_hot as (
        delete from public.pickup_events pe
        using inserted_archive ia
        where pe.id = ia.id
        returning pe.id
    )
    select count(*) into v_archived from deleted_hot;

    return query select v_archived;
end;
$$;

comment on function public.archive_old_pickup_events(interval, integer, uuid) is
    'Transfers completed and cancelled pickup events older than specified interval into pickup_events_archive in bounded batches. Restricted exclusively to backend service_role.';

-- 5. Endurecimento de privilégios: EXECUTE restrito a service_role (e postgres)
revoke all on function public.archive_old_pickup_events(interval, integer, uuid) from public, anon, authenticated;
grant execute on function public.archive_old_pickup_events(interval, integer, uuid) to service_role;
