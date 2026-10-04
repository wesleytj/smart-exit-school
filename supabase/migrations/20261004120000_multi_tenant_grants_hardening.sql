-- ============================================================
-- Smart Exit School
-- Migration: 20261004120000_multi_tenant_grants_hardening.sql
-- Description:
--   Hardens multi-tenant permissions by granting missing write
--   privileges (INSERT, UPDATE, DELETE) on gates, academic_groups,
--   and academic_levels to authenticated (aligning with existing
--   RLS policies from Migration 0005), and revoking residual
--   TRUNCATE privilege on all public tables from anon and authenticated.
-- ============================================================

-- 1. Alinhar grants de escrita com policies existentes
grant insert, update, delete on public.gates to authenticated;
grant insert, update, delete on public.academic_groups to authenticated;
grant insert, update, delete on public.academic_levels to authenticated;

-- 2. Revogar TRUNCATE residual em todas as tabelas do schema public
revoke truncate on all tables in schema public from anon, authenticated;
