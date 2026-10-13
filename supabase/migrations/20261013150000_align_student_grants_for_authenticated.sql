-- ============================================================
-- Smart Exit School
-- Migration: 20261013150000_align_student_grants_for_authenticated.sql
-- Description:
--   Restores INSERT, UPDATE, DELETE grants on students,
--   student_enrollments, and student_group_assignments for
--   authenticated role, aligning database permissions with the
--   existing RLS policies (Migration 0005) and DAL repositories.
-- ============================================================

grant insert, update, delete on table public.students to authenticated;
grant insert, update, delete on table public.student_enrollments to authenticated;
grant insert, update, delete on table public.student_group_assignments to authenticated;
