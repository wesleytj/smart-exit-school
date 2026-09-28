-- ============================================================
-- Smart Exit School
-- Migration
-- File: 20260925160000_students_optional_identifier_and_birth_date.sql
-- Description:
--   Makes student_identifier and birth_date optional.
--   The school can register a student with full name and group only.
--
-- Scope:
--   - students.birth_date DROP NOT NULL
--   - students.student_identifier DROP NOT NULL
--   - Does not change RLS, grants, other columns, or other tables
--   - Keeps students_school_identifier_unique and the birth_date check
--
-- Depends on:
--   - Migration 0002 (public.students)
-- ============================================================

alter table public.students
    alter column birth_date drop not null;

alter table public.students
    alter column student_identifier drop not null;
