-- ============================================================
-- Smart Exit School
-- Seed Data
-- Description:
--   Inserts default records required by the application.
--
-- Tables:
--   - roles
--   - academic_shifts
-- ============================================================

insert into public.roles (name, description)
values
    ('owner', 'Full access to the platform'),
    ('administrator', 'School administrator'),
    ('secretary', 'School secretary'),
    ('gatekeeper', 'School gate operator')

on conflict (name)
do update
set
    description = excluded.description,
    updated_at = now();

-- ============================================================
-- ACADEMIC SHIFTS
-- ============================================================

insert into public.academic_shifts (name, description)
values
    ('morning', 'Morning shift'),
    ('afternoon', 'Afternoon shift'),
    ('full_time', 'Full-time shift'),
    ('night', 'Night shift')

on conflict (name)
do update
set
    description = excluded.description,
    updated_at = now();