-- ============================================================
-- Smart Exit School
-- Migration: 20261010140000_create_impersonation_foundation.sql
-- Description:
--   Impersonation User-Level Foundation (Fase 3 / ADR-029).
--   Creates public.impersonation_audit_logs with strict RLS
--   and public.list_platform_users RPC for Platform Admin user catalog.
--
-- Scope:
--   - Table public.impersonation_audit_logs
--   - Indexes on super_admin_id, target_user_id, started_at desc
--   - RLS enabled with select policy for Platform Admins only
--   - Revocation of public/anon access and selective authenticated grants
--   - RPC public.list_platform_users (SECURITY DEFINER)
-- ============================================================

-- ============================================================
-- 1. TABELA DE AUDITORIA DE IMPERSONATION
-- ============================================================

create table if not exists public.impersonation_audit_logs (
    id uuid primary key default gen_random_uuid(),
    super_admin_id uuid not null references public.profiles(id) on delete restrict,
    target_user_id uuid not null references auth.users(id) on delete restrict,
    target_user_email text not null,
    target_user_name text,
    target_school_id uuid references public.schools(id) on delete set null,
    reason text not null check (length(trim(reason)) >= 5),
    started_at timestamptz not null default now(),
    ended_at timestamptz,
    ip_address text,
    user_agent text,
    constraint impersonation_audit_logs_duration_check check (ended_at is null or ended_at >= started_at)
);

comment on table public.impersonation_audit_logs is
    'Trilha imutável de auditoria para sessões de suporte e impersonation iniciadas por Platform Admins (ADR-029).';

-- ============================================================
-- 2. ÍNDICES DE PERFORMANCE E CONSULTA
-- ============================================================

create index if not exists idx_impersonation_audit_logs_super_admin
    on public.impersonation_audit_logs (super_admin_id);

create index if not exists idx_impersonation_audit_logs_target_user
    on public.impersonation_audit_logs (target_user_id);

create index if not exists idx_impersonation_audit_logs_started_at
    on public.impersonation_audit_logs (started_at desc);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS) & POLICIES
-- ============================================================

alter table public.impersonation_audit_logs enable row level security;

-- Somente Platform Admin tem permissão de leitura
create policy impersonation_audit_logs_select_admin
    on public.impersonation_audit_logs
    for select
    to authenticated
    using (public.is_platform_admin());

-- Inserções e atualizações são restritas a service_role (Edge Function)
-- Nenhuma policy de INSERT/UPDATE/DELETE é concedida a anon/authenticated.

-- ============================================================
-- 4. GRANTS DE TABELA
-- ============================================================

revoke all on public.impersonation_audit_logs from anon, authenticated;
grant select on public.impersonation_audit_logs to authenticated;
grant select, insert, update on public.impersonation_audit_logs to service_role;

-- ============================================================
-- 5. RPC: LISTAGEM GLOBAL DE USUÁRIOS PARA PLATFORM ADMIN
-- ============================================================

create or replace function public.list_platform_users(
    p_search text default null,
    p_school_id uuid default null,
    p_limit int default 50,
    p_offset int default 0
)
returns table (
    user_id uuid,
    email text,
    full_name text,
    school_id uuid,
    school_name text,
    role_name text,
    member_status text,
    last_sign_in_at timestamptz,
    created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    if not public.is_platform_admin() then
        raise exception 'Access denied: caller is not a platform admin' using errcode = '42501';
    end if;

    return query
    select
        u.id as user_id,
        u.email::text as email,
        p.full_name as full_name,
        s.id as school_id,
        s.name as school_name,
        r.name as role_name,
        sm.status as member_status,
        u.last_sign_in_at as last_sign_in_at,
        u.created_at as created_at
    from auth.users u
    inner join public.profiles p on p.id = u.id
    left join public.school_members sm on sm.profile_id = p.id
    left join public.schools s on s.id = sm.school_id
    left join public.roles r on r.id = sm.role_id
    where (
        p_search is null
        or u.email ilike ('%' || p_search || '%')
        or p.full_name ilike ('%' || p_search || '%')
        or s.name ilike ('%' || p_search || '%')
    )
    and (p_school_id is null or s.id = p_school_id)
    order by u.last_sign_in_at desc nulls last, u.created_at desc
    limit coalesce(p_limit, 50)
    offset coalesce(p_offset, 0);
end;
$$;

comment on function public.list_platform_users(text, uuid, int, int) is
    'Retorna catálogo consolidado de usuários para Platform Admins realizarem suporte e impersonation.';

revoke all on function public.list_platform_users(text, uuid, int, int) from anon, public;
grant execute on function public.list_platform_users(text, uuid, int, int) to authenticated;
grant execute on function public.list_platform_users(text, uuid, int, int) to service_role;
