-- ============================================================
-- Smart Exit School
-- Seed: supabase/seed-multi-tenant.sql
-- Description:
--   Multi-tenant QA test fixtures (Tenant Alpha & Tenant Beta)
--   used for runtime RLS isolation validation (Ciclo D - D-07).
--   Completely isolated from dev baseline seed (smart-exit-dev-school).
-- ============================================================

-- 1. Usuários Auth (para satisfazer FK de public.profiles)
insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
)
values
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'alpha-user@smart-exit.local',
    crypt('SenhaForte123!', gen_salt('bf')),
    now(),
    '{"full_name": "Operador Tenant Alpha"}'::jsonb,
    now(),
    now()
),
(
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'beta-user@smart-exit.local',
    crypt('SenhaForte123!', gen_salt('bf')),
    now(),
    '{"full_name": "Operador Tenant Beta"}'::jsonb,
    now(),
    now()
)
on conflict (id) do nothing;

-- 2. Perfis (Profiles)
insert into public.profiles (id, full_name)
values
    ('11111111-1111-1111-1111-111111111111', 'Operador Tenant Alpha'),
    ('22222222-2222-2222-2222-222222222222', 'Operador Tenant Beta')
on conflict (id) do update set full_name = excluded.full_name;

-- 3. Escolas (Tenants)
insert into public.schools (id, name, slug, status, plan, primary_color, secondary_color)
values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tenant Alpha School', 'tenant-alpha-school', 'active', 'pro', '#10b981', '#059669'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tenant Beta School', 'tenant-beta-school', 'active', 'pro', '#6366f1', '#4f46e5')
on conflict (id) do update set
    name = excluded.name,
    slug = excluded.slug,
    status = excluded.status;

-- 4. Vínculos de Membros (School Members)
insert into public.school_members (id, school_id, profile_id, role_id, status)
select
    'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    r.id,
    'active'
from public.roles r where r.name = 'administrator'
on conflict (school_id, profile_id) do update set status = 'active';

insert into public.school_members (id, school_id, profile_id, role_id, status)
select
    'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    r.id,
    'active'
from public.roles r where r.name = 'administrator'
on conflict (school_id, profile_id) do update set status = 'active';

-- 5. Anos Letivos (School Years)
insert into public.school_years (id, school_id, year, is_active, starts_at, ends_at)
values
    ('aaaaaaaa-1000-0000-0000-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2026, true, '2026-01-01', '2026-12-31'),
    ('bbbbbbbb-1000-0000-0000-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2026, true, '2026-01-01', '2026-12-31')
on conflict (school_id, year) do update set is_active = true;

-- 6. Níveis Acadêmicos (Academic Levels)
insert into public.academic_levels (id, school_id, name, display_order, status)
values
    ('aaaaaaaa-2000-0000-0000-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ensino Fundamental Alpha', 1, 'active'),
    ('bbbbbbbb-2000-0000-0000-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Ensino Fundamental Beta', 1, 'active')
on conflict (id) do nothing;

-- 7. Turmas Acadêmicas (Academic Groups)
insert into public.academic_groups (id, school_id, academic_level_id, academic_shift_id, school_year_id, name, display_order, status)
select
    'aaaaaaaa-3000-0000-0000-aaaaaaaaaaaa'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'aaaaaaaa-2000-0000-0000-aaaaaaaaaaaa'::uuid,
    s.id,
    'aaaaaaaa-1000-0000-0000-aaaaaaaaaaaa'::uuid,
    'Turma Alpha 1',
    1,
    'active'
from public.academic_shifts s where s.name = 'morning'
on conflict (id) do nothing;

insert into public.academic_groups (id, school_id, academic_level_id, academic_shift_id, school_year_id, name, display_order, status)
select
    'bbbbbbbb-3000-0000-0000-bbbbbbbbbbbb'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    'bbbbbbbb-2000-0000-0000-bbbbbbbbbbbb'::uuid,
    s.id,
    'bbbbbbbb-1000-0000-0000-bbbbbbbbbbbb'::uuid,
    'Turma Beta 1',
    1,
    'active'
from public.academic_shifts s where s.name = 'morning'
on conflict (id) do nothing;

-- 8. Portões (Gates)
insert into public.gates (id, school_id, name, display_order, status)
values
    ('aaaaaaaa-0003-0000-0000-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Portão Alpha', 1, 'active'),
    ('bbbbbbbb-0003-0000-0000-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Portão Beta', 1, 'active')
on conflict (id) do update set name = excluded.name, status = excluded.status;

-- 9. Alunos (Students)
insert into public.students (id, school_id, student_identifier, full_name, birth_date, status)
values
    ('aaaaaaaa-5000-0000-0000-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ALPHA-001', 'Aluno Alpha', '2015-05-10', 'active'),
    ('bbbbbbbb-5000-0000-0000-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BETA-001', 'Aluno Beta', '2015-05-10', 'active')
on conflict (id) do nothing;

-- 10. Matrículas (Student Enrollments)
insert into public.student_enrollments (id, student_id, school_year_id, academic_year, status)
values
    ('aaaaaaaa-6000-0000-0000-aaaaaaaaaaaa', 'aaaaaaaa-5000-0000-0000-aaaaaaaaaaaa', 'aaaaaaaa-1000-0000-0000-aaaaaaaaaaaa', 2026, 'active'),
    ('bbbbbbbb-6000-0000-0000-bbbbbbbbbbbb', 'bbbbbbbb-5000-0000-0000-bbbbbbbbbbbb', 'bbbbbbbb-1000-0000-0000-bbbbbbbbbbbb', 2026, 'active')
on conflict (id) do nothing;

-- 11. Enturmação (Student Group Assignments)
insert into public.student_group_assignments (id, student_enrollment_id, academic_group_id, status)
values
    ('aaaaaaaa-7000-0000-0000-aaaaaaaaaaaa', 'aaaaaaaa-6000-0000-0000-aaaaaaaaaaaa', 'aaaaaaaa-3000-0000-0000-aaaaaaaaaaaa', 'active'),
    ('bbbbbbbb-7000-0000-0000-bbbbbbbbbbbb', 'bbbbbbbb-6000-0000-0000-bbbbbbbbbbbb', 'bbbbbbbb-3000-0000-0000-bbbbbbbbbbbb', 'active')
on conflict (id) do nothing;

-- 12. Chamadas Operacionais (Pickup Events)
insert into public.pickup_events (id, school_id, student_enrollment_id, gate_id, status, called_at)
values
    ('aaaaaaaa-8000-0000-0000-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-6000-0000-0000-aaaaaaaaaaaa', 'aaaaaaaa-0003-0000-0000-aaaaaaaaaaaa', 'called', now()),
    ('bbbbbbbb-8000-0000-0000-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-6000-0000-0000-bbbbbbbbbbbb', 'bbbbbbbb-0003-0000-0000-bbbbbbbbbbbb', 'called', now())
on conflict (id) do nothing;
