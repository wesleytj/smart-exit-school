-- ============================================================
-- Smart Exit School
-- Seed Data
-- Description:
--   Inserts default records required by the application.
--
-- Tables:
--   - roles
--   - academic_shifts
--   - schools
--   - academic_levels
--   - academic_groups
--   - students
--   - student_enrollments
--   - student_group_assignments
-- ============================================================

-- ============================================================
-- ROLES
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

-- ============================================================
-- DEVELOPMENT BASE DATA
-- Minimal academic structure for local development and migration validation
-- ============================================================

with
seed_school as (
    insert into public.schools (
        slug,
        name,
        status,
        plan,
        timezone,
        locale,
        currency
    )
    values (
        'smart-exit-dev-school',
        'Smart Exit Development School',
        'active',
        'basic',
        'America/Sao_Paulo',
        'pt-BR',
        'BRL'
    )
    on conflict (slug)
    do update
    set
        name = excluded.name,
        status = excluded.status,
        plan = excluded.plan,
        timezone = excluded.timezone,
        locale = excluded.locale,
        currency = excluded.currency,
        updated_at = now()
    returning id
),
resolved_school as (
    select id from seed_school
    union all
    select s.id
    from public.schools s
    where s.slug = 'smart-exit-dev-school'
    limit 1
),
seed_level as (
    insert into public.academic_levels (
        school_id,
        name,
        display_order,
        status
    )
    select
        rs.id,
        'Ensino Fundamental',
        1,
        'active'
    from resolved_school rs
    on conflict (school_id, name)
    do update
    set
        display_order = excluded.display_order,
        status = excluded.status,
        updated_at = now()
    returning id, school_id
),
resolved_level as (
    select id, school_id from seed_level
    union all
    select al.id, al.school_id
    from public.academic_levels al
    join resolved_school rs on rs.id = al.school_id
    where al.name = 'Ensino Fundamental'
    limit 1
),
morning_shift as (
    select id
    from public.academic_shifts
    where name = 'morning'
),
afternoon_shift as (
    select id
    from public.academic_shifts
    where name = 'afternoon'
),
seed_group_morning as (
    insert into public.academic_groups (
        school_id,
        academic_level_id,
        academic_shift_id,
        name,
        display_order,
        status
    )
    select
        rl.school_id,
        rl.id,
        ms.id,
        'EF3MA',
        1,
        'active'
    from resolved_level rl
    cross join morning_shift ms
    on conflict (school_id, academic_level_id, academic_shift_id, name)
    do update
    set
        display_order = excluded.display_order,
        status = excluded.status,
        updated_at = now()
    returning id
),
seed_group_afternoon as (
    insert into public.academic_groups (
        school_id,
        academic_level_id,
        academic_shift_id,
        name,
        display_order,
        status
    )
    select
        rl.school_id,
        rl.id,
        afs.id,
        'EF3TA',
        2,
        'active'
    from resolved_level rl
    cross join afternoon_shift afs
    on conflict (school_id, academic_level_id, academic_shift_id, name)
    do update
    set
        display_order = excluded.display_order,
        status = excluded.status,
        updated_at = now()
    returning id
),
resolved_group_morning as (
    select id from seed_group_morning
    union all
    select ag.id
    from public.academic_groups ag
    join resolved_level rl on rl.id = ag.academic_level_id
    join public.academic_shifts ash on ash.id = ag.academic_shift_id
    where ag.name = 'EF3MA'
      and ash.name = 'morning'
      and ag.school_id = rl.school_id
    limit 1
),
seed_student as (
    insert into public.students (
        school_id,
        student_identifier,
        full_name,
        birth_date,
        status
    )
    select
        rs.id,
        'STU-0001',
        'João Teste',
        date '2015-03-10',
        'active'
    from resolved_school rs
    on conflict (school_id, student_identifier)
    do update
    set
        full_name = excluded.full_name,
        birth_date = excluded.birth_date,
        status = excluded.status,
        updated_at = now()
    returning id
),
resolved_student as (
    select id from seed_student
    union all
    select s.id
    from public.students s
    join resolved_school rs on rs.id = s.school_id
    where s.student_identifier = 'STU-0001'
    limit 1
),
seed_enrollment as (
    insert into public.student_enrollments (
        student_id,
        academic_year,
        status
    )
    select
        rs.id,
        2026,
        'active'
    from resolved_student rs
    on conflict (student_id, academic_year)
    do update
    set
        status = excluded.status,
        updated_at = now()
    returning id
),
resolved_enrollment as (
    select id from seed_enrollment
    union all
    select se.id
    from public.student_enrollments se
    join resolved_student rs on rs.id = se.student_id
    where se.academic_year = 2026
    limit 1
)
insert into public.student_group_assignments (
    student_enrollment_id,
    academic_group_id,
    status,
    assigned_at
)
select
    re.id,
    rgm.id,
    'active',
    now()
from resolved_enrollment re
cross join resolved_group_morning rgm
on conflict do nothing;