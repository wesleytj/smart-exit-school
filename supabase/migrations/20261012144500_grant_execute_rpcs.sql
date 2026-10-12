-- ============================================================
-- Smart Exit School
-- Migration: 20261012144500_grant_execute_rpcs.sql
-- Description:
--   Grant EXECUTE permissions on public.accept_school_invitation
--   for authenticated and anon roles (Ciclo B RPC grants fix).
-- ============================================================

grant execute on function public.accept_school_invitation(text, uuid, text) to authenticated;
grant execute on function public.accept_school_invitation(text, uuid, text) to anon;
grant execute on function public.accept_school_invitation(text, uuid, text) to service_role;
