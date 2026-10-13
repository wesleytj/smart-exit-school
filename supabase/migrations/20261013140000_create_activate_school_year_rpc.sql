-- ============================================================
-- Smart Exit School
-- Migration: 20261013140000_create_activate_school_year_rpc.sql
-- Description:
--   Creates transactional activate_school_year RPC to ensure
--   atomic activation of a school year, preventing intermediate
--   states where an institution has 0 active years.
-- ============================================================

create or replace function public.activate_school_year(
    p_year_id uuid,
    p_school_id uuid
)
returns public.school_years
language plpgsql
security definer
set search_path = public
as $$
declare
    v_target public.school_years%rowtype;
begin
    -- 1. Validação defensiva de parâmetros
    if p_year_id is null or p_school_id is null then
        raise exception 'Parâmetros inválidos para ativação de ano letivo.'
            using errcode = '22023'; -- invalid_parameter_value
    end if;

    -- 2. Validação de autorização do chamador
    if auth.role() = 'authenticated' and not (
        public.is_active_school_member(p_school_id) or public.is_platform_admin()
    ) then
        raise exception 'Acesso não autorizado para esta instituição.'
            using errcode = '42501'; -- insufficient_privilege
    end if;

    -- 3. Validação e bloqueio do ano letivo de destino
    select *
    into v_target
    from public.school_years
    where id = p_year_id
      and school_id = p_school_id
    for update;

    if not found then
        raise exception 'Ano letivo não encontrado para esta escola.'
            using errcode = 'P0002'; -- no_data_found
    end if;

    -- 4. Validação de estado atual (rejeitar se já estiver ativo)
    if v_target.is_active = true then
        raise exception 'Este ano letivo já está ativo.'
            using errcode = '23505'; -- unique_violation / state check
    end if;

    -- 5. Desativar quaisquer anos atualmente ativos para a mesma escola
    update public.school_years
    set is_active = false,
        updated_at = now()
    where school_id = p_school_id
      and id <> p_year_id
      and is_active = true;

    -- 6. Ativar o ano solicitado e retornar o registro atualizado
    update public.school_years
    set is_active = true,
        updated_at = now()
    where id = p_year_id
      and school_id = p_school_id
    returning * into v_target;

    return v_target;
end;
$$;

comment on function public.activate_school_year(uuid, uuid) is
    'Transacionalmente desativa o ano vigente e ativa o novo ano letivo informado para a escola, mantendo a invariante de exatamente 1 ano ativo de forma atômica.';

-- Privilégios: concedido para authenticated e service_role, revogado de anon e public
revoke all on function public.activate_school_year(uuid, uuid) from public, anon;
grant execute on function public.activate_school_year(uuid, uuid) to authenticated;
grant execute on function public.activate_school_year(uuid, uuid) to service_role;
