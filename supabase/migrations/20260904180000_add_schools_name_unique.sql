-- ============================================================
-- Smart Exit School
-- Migration 0013
-- File: 20260904180000_add_schools_name_unique.sql
-- Description:
--   Enforces unique institution names on public.schools
--   (Issue #33). Application-level trim/required (Issue #31)
--   remains; this constraint is the Supabase source of truth.
--
-- Scope:
--   - UNIQUE constraint schools_name_unique on public.schools(name)
--   - Does not alter RLS, grants, other columns, or other tables
--   - Comparison is exact after persisted value (case-sensitive)
--
-- Depends on:
--   - Migration 0001 (public.schools)
-- ============================================================

alter table public.schools
    add constraint schools_name_unique unique (name);
