-- ============================================================
-- Smart Exit School
-- Migration
-- File: 20260925170000_grant_student_writes_to_authenticated.sql
-- Description:
--   Grants the table privileges required by the student
--   registration flow. RLS policies already exist.
--
-- Scope:
--   - INSERT, UPDATE, DELETE on public.students
--   - INSERT on public.student_enrollments
--   - INSERT, UPDATE on public.student_group_assignments
--   - Role: authenticated
--   - Does not repeat existing SELECT grants
--   - Does not change RLS, policies, functions, tables, indexes, or FKs
--
-- Depends on:
--   - Migration 0005 (RLS policies for these tables)
-- ============================================================

grant insert, update, delete on table public.students to authenticated;

grant insert on table public.student_enrollments to authenticated;

grant insert, update on table public.student_group_assignments to authenticated;
