-- ============================================================
-- Smart Exit School
-- Migration: 20261011180000_create_school_invitations.sql
-- Description:
--   Member Invitation Foundation (Ciclo B / Feature #49 / G-DB).
--   Creates public.school_invitations with strict RLS and
--   an atomic acceptance RPC function for service_role.
-- ============================================================

-- 1. TABELA DE CONVITES ESCOLARES
create table if not exists public.school_invitations (
    id uuid primary key default gen_random_uuid(),
    school_id uuid not null references public.schools(id) on delete cascade,
    email text not null,
    role_id uuid not null references public.roles(id) on delete restrict,
    invited_by uuid not null references public.profiles(id) on delete restrict,
    token_hash text not null unique,
    status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
    expires_at timestamptz not null default (now() + interval '7 days'),
    accepted_at timestamptz,
    accepted_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.school_invitations is
    'Registro de convites de novos membros para instituições escolares (Ciclo B).';

-- 2. ÍNDICES DE PERFORMANCE E UNICIDADE
create unique index if not exists idx_school_invitations_unique_pending
    on public.school_invitations (school_id, lower(email))
    where status = 'pending';

create index if not exists idx_school_invitations_school_id
    on public.school_invitations (school_id);

create index if not exists idx_school_invitations_token_hash
    on public.school_invitations (token_hash);

create index if not exists idx_school_invitations_invited_by
    on public.school_invitations (invited_by);

-- 3. ROW LEVEL SECURITY (RLS) & POLICIES
alter table public.school_invitations enable row level security;

-- Platform Admin ou Gestor Escolar (owner/administrator) tem permissão de leitura
create policy school_invitations_select
    on public.school_invitations
    for select
    to authenticated
    using (
        public.is_platform_admin()
        or (
            public.is_active_school_member(school_id)
            and exists (
                select 1
                from public.school_members sm
                join public.roles r on r.id = sm.role_id
                where sm.school_id = public.school_invitations.school_id
                  and sm.profile_id = auth.uid()
                  and sm.status = 'active'
                  and r.name in ('owner', 'administrator')
            )
        )
    );

-- Modificações e criações restritas à service_role (Edge Functions)
revoke all on public.school_invitations from anon, authenticated;
grant select on public.school_invitations to authenticated;
grant select, insert, update on public.school_invitations to service_role;

-- 4. RPC ATÔMICA DE ACEITE DE CONVITE (SERVICE_ROLE ONLY)
create or replace function public.accept_school_invitation(
    p_token_hash text,
    p_user_id uuid,
    p_user_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_invitation record;
    v_existing_status text;
begin
    -- 1. Lock da linha do convite para evitar condições de corrida (C5)
    select *
    into v_invitation
    from public.school_invitations
    where token_hash = p_token_hash
    for update;

    if not found then
        return jsonb_build_object(
            'ok', false,
            'code', 'INVITATION_NOT_FOUND',
            'message', 'Convite não encontrado.'
        );
    end if;

    -- 2. Validar status do convite
    if v_invitation.status = 'accepted' then
        return jsonb_build_object(
            'ok', false,
            'code', 'ALREADY_ACCEPTED',
            'message', 'Este convite já foi aceito anteriormente.'
        );
    end if;

    if v_invitation.status = 'revoked' then
        return jsonb_build_object(
            'ok', false,
            'code', 'INVITATION_REVOKED',
            'message', 'Este convite foi revogado pela administração escolar.'
        );
    end if;

    if v_invitation.status <> 'pending' or v_invitation.expires_at <= now() then
        return jsonb_build_object(
            'ok', false,
            'code', 'INVITATION_EXPIRED',
            'message', 'Este convite está expirado.'
        );
    end if;

    -- 3. Validar casamento de e-mail (C1)
    if lower(v_invitation.email) <> lower(trim(p_user_email)) then
        return jsonb_build_object(
            'ok', false,
            'code', 'EMAIL_MISMATCH',
            'message', 'O e-mail da conta não corresponde ao e-mail deste convite.'
        );
    end if;

    -- 4. Verificar existência de vínculo prévio com a escola
    select status
    into v_existing_status
    from public.school_members
    where school_id = v_invitation.school_id
      and profile_id = p_user_id;

    if found then
        if v_existing_status = 'active' then
            return jsonb_build_object(
                'ok', false,
                'code', 'ALREADY_ACTIVE_MEMBER',
                'message', 'Este usuário já é membro ativo desta instituição de ensino.'
            );
        else
            -- C2: Membro inativo não é reativado automaticamente
            return jsonb_build_object(
                'ok', false,
                'code', 'INACTIVE_MEMBER',
                'message', 'Este usuário possui vínculo inativo com a escola. Entre em contato com a administração.'
            );
        end if;
    end if;

    -- 5. Inserir membership ativa
    begin
        insert into public.school_members (
            school_id,
            profile_id,
            role_id,
            status,
            created_at,
            updated_at
        ) values (
            v_invitation.school_id,
            p_user_id,
            v_invitation.role_id,
            'active',
            now(),
            now()
        );
    exception
        when unique_violation then
            return jsonb_build_object(
                'ok', false,
                'code', 'CONCURRENT_MEMBERSHIP',
                'message', 'Vínculo com a escola já foi registrado simultaneamente.'
            );
    end;

    -- 6. Transicionar convite para accepted
    update public.school_invitations
    set status = 'accepted',
        accepted_at = now(),
        accepted_by = p_user_id,
        updated_at = now()
    where id = v_invitation.id;

    return jsonb_build_object(
        'ok', true,
        'school_id', v_invitation.school_id,
        'role_id', v_invitation.role_id,
        'message', 'Convite aceito com sucesso.'
    );
end;
$$;

comment on function public.accept_school_invitation(text, uuid, text) is
    'Efetua o aceite atômico de convite escolar sob lock FOR UPDATE e insere membership (Ciclo B).';

revoke all on function public.accept_school_invitation(text, uuid, text) from anon, authenticated, public;
grant execute on function public.accept_school_invitation(text, uuid, text) to service_role;
