-- ============================================================
-- Smart Exit School
-- Migration
-- File: 20260925180000_revoke_unused_student_writes_from_authenticated.sql
-- Description:
--   Removes authenticated privileges that the student
--   registration flow does not use.
--
-- Scope:
--   - REVOKE UPDATE, DELETE on public.student_enrollments
--   - REVOKE DELETE on public.student_group_assignments
--   - Role: authenticated
--   - Does not change anon, service_role, default privileges,
--     RLS, policies, functions, or tables
--
-- Depends on:
--   - 20260925170000_grant_student_writes_to_authenticated.sql
--
-- Debt:
--   - DEBT — PUBLIC DEFAULT PRIVILEGES TOO BROAD
-- ============================================================

revoke update, delete on table public.student_enrollments from authenticated;

revoke delete on table public.student_group_assignments from authenticated;
