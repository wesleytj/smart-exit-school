-- ============================================================
-- Smart Exit School
-- Migration 0005
-- File: 20260706180031_enable-rls-foundation.sql
-- Description:
--   Enables Row Level Security (RLS) foundation for the current
--   Smart Exit School schema, establishing tenant isolation by
--   school membership and self-access rules for profiles.
--
-- Scope:
--   RLS + helpers on foundation tables (schools, profiles, roles,
--   school_members, academic_*, students, enrollments, assignments,
--   gates, pickup_events)
--
-- Depends on:
--   Migrations 0001–0004
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function public.is_active_school_member(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.school_members sm
        where sm.school_id = target_school_id
          and sm.profile_id = auth.uid()
          and sm.status = 'active'
    );
$$;

comment on function public.is_active_school_member(uuid) is
    'Returns true when the authenticated user is an active member of the provided school.';

create or replace function public.can_access_student_enrollment(target_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.student_enrollments se
        join public.students s
          on s.id = se.student_id
        join public.school_members sm
          on sm.school_id = s.school_id
        where se.id = target_enrollment_id
          and sm.profile_id = auth.uid()
          and sm.status = 'active'
    );
$$;

comment on function public.can_access_student_enrollment(uuid) is
    'Returns true when the authenticated user can access the given student enrollment through active school membership.';

create or replace function public.can_access_academic_group(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.academic_groups ag
        join public.school_members sm
          on sm.school_id = ag.school_id
        where ag.id = target_group_id
          and sm.profile_id = auth.uid()
          and sm.status = 'active'
    );
$$;

comment on function public.can_access_academic_group(uuid) is
    'Returns true when the authenticated user can access the given academic group through active school membership.';

create or replace function public.can_access_gate(target_gate_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.gates g
        join public.school_members sm
          on sm.school_id = g.school_id
        where g.id = target_gate_id
          and sm.profile_id = auth.uid()
          and sm.status = 'active'
    );
$$;

comment on function public.can_access_gate(uuid) is
    'Returns true when the authenticated user can access the given gate through active school membership.';

-- ============================================================
-- ENABLE RLS
-- ============================================================

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.school_members enable row level security;
alter table public.academic_levels enable row level security;
alter table public.academic_shifts enable row level security;
alter table public.academic_groups enable row level security;
alter table public.students enable row level security;
alter table public.student_enrollments enable row level security;
alter table public.student_group_assignments enable row level security;
alter table public.gates enable row level security;
alter table public.pickup_events enable row level security;

-- ============================================================
-- PROFILES
-- Self-access only
-- ============================================================

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (
    id = auth.uid()
);

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (
    id = auth.uid()
);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (
    id = auth.uid()
)
with check (
    id = auth.uid()
);

-- ============================================================
-- SCHOOLS
-- Read only for active school members
-- ============================================================

create policy schools_select_member
on public.schools
for select
to authenticated
using (
    public.is_active_school_member(id)
);

-- ============================================================
-- ROLES
-- Global catalog readable by authenticated users
-- ============================================================

create policy roles_select_authenticated
on public.roles
for select
to authenticated
using (
    true
);

-- ============================================================
-- SCHOOL MEMBERS
-- Read only for active members of the same school
-- ============================================================

create policy school_members_select_same_school
on public.school_members
for select
to authenticated
using (
    public.is_active_school_member(school_id)
);

-- ============================================================
-- ACADEMIC SHIFTS
-- Global catalog readable by authenticated users
-- ============================================================

create policy academic_shifts_select_authenticated
on public.academic_shifts
for select
to authenticated
using (
    true
);

-- ============================================================
-- ACADEMIC LEVELS
-- CRUD for active members of the same school
-- ============================================================

create policy academic_levels_select_member
on public.academic_levels
for select
to authenticated
using (
    public.is_active_school_member(school_id)
);

create policy academic_levels_insert_member
on public.academic_levels
for insert
to authenticated
with check (
    public.is_active_school_member(school_id)
);

create policy academic_levels_update_member
on public.academic_levels
for update
to authenticated
using (
    public.is_active_school_member(school_id)
)
with check (
    public.is_active_school_member(school_id)
);

create policy academic_levels_delete_member
on public.academic_levels
for delete
to authenticated
using (
    public.is_active_school_member(school_id)
);

-- ============================================================
-- ACADEMIC GROUPS
-- CRUD for active members of the same school
-- ============================================================

create policy academic_groups_select_member
on public.academic_groups
for select
to authenticated
using (
    public.is_active_school_member(school_id)
);

create policy academic_groups_insert_member
on public.academic_groups
for insert
to authenticated
with check (
    public.is_active_school_member(school_id)
);

create policy academic_groups_update_member
on public.academic_groups
for update
to authenticated
using (
    public.is_active_school_member(school_id)
)
with check (
    public.is_active_school_member(school_id)
);

create policy academic_groups_delete_member
on public.academic_groups
for delete
to authenticated
using (
    public.is_active_school_member(school_id)
);

-- ============================================================
-- STUDENTS
-- CRUD for active members of the same school
-- ============================================================

create policy students_select_member
on public.students
for select
to authenticated
using (
    public.is_active_school_member(school_id)
);

create policy students_insert_member
on public.students
for insert
to authenticated
with check (
    public.is_active_school_member(school_id)
);

create policy students_update_member
on public.students
for update
to authenticated
using (
    public.is_active_school_member(school_id)
)
with check (
    public.is_active_school_member(school_id)
);

create policy students_delete_member
on public.students
for delete
to authenticated
using (
    public.is_active_school_member(school_id)
);

-- ============================================================
-- STUDENT ENROLLMENTS
-- CRUD through student -> school membership
-- ============================================================

create policy student_enrollments_select_member
on public.student_enrollments
for select
to authenticated
using (
    public.can_access_student_enrollment(id)
);

create policy student_enrollments_insert_member
on public.student_enrollments
for insert
to authenticated
with check (
    exists (
        select 1
        from public.students s
        where s.id = student_id
          and public.is_active_school_member(s.school_id)
    )
);

create policy student_enrollments_update_member
on public.student_enrollments
for update
to authenticated
using (
    public.can_access_student_enrollment(id)
)
with check (
    exists (
        select 1
        from public.students s
        where s.id = student_id
          and public.is_active_school_member(s.school_id)
    )
);

create policy student_enrollments_delete_member
on public.student_enrollments
for delete
to authenticated
using (
    public.can_access_student_enrollment(id)
);

-- ============================================================
-- STUDENT GROUP ASSIGNMENTS
-- CRUD through enrollment + academic group access
-- ============================================================

create policy student_group_assignments_select_member
on public.student_group_assignments
for select
to authenticated
using (
    public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_academic_group(academic_group_id)
);

create policy student_group_assignments_insert_member
on public.student_group_assignments
for insert
to authenticated
with check (
    public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_academic_group(academic_group_id)
);

create policy student_group_assignments_update_member
on public.student_group_assignments
for update
to authenticated
using (
    public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_academic_group(academic_group_id)
)
with check (
    public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_academic_group(academic_group_id)
);

create policy student_group_assignments_delete_member
on public.student_group_assignments
for delete
to authenticated
using (
    public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_academic_group(academic_group_id)
);

-- ============================================================
-- GATES
-- CRUD for active members of the same school
-- ============================================================

create policy gates_select_member
on public.gates
for select
to authenticated
using (
    public.is_active_school_member(school_id)
);

create policy gates_insert_member
on public.gates
for insert
to authenticated
with check (
    public.is_active_school_member(school_id)
);

create policy gates_update_member
on public.gates
for update
to authenticated
using (
    public.is_active_school_member(school_id)
)
with check (
    public.is_active_school_member(school_id)
);

create policy gates_delete_member
on public.gates
for delete
to authenticated
using (
    public.is_active_school_member(school_id)
);

-- ============================================================
-- PICKUP EVENTS
-- CRUD through school + enrollment + gate coherence
-- ============================================================

create policy pickup_events_select_member
on public.pickup_events
for select
to authenticated
using (
    public.is_active_school_member(school_id)
    and public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_gate(gate_id)
);

create policy pickup_events_insert_member
on public.pickup_events
for insert
to authenticated
with check (
    public.is_active_school_member(school_id)
    and public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_gate(gate_id)
);

create policy pickup_events_update_member
on public.pickup_events
for update
to authenticated
using (
    public.is_active_school_member(school_id)
    and public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_gate(gate_id)
)
with check (
    public.is_active_school_member(school_id)
    and public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_gate(gate_id)
);

create policy pickup_events_delete_member
on public.pickup_events
for delete
to authenticated
using (
    public.is_active_school_member(school_id)
    and public.can_access_student_enrollment(student_enrollment_id)
    and public.can_access_gate(gate_id)
);

-- ============================================================
-- GRANTS FOR AUTHENTICATED ROLE
-- ============================================================

grant usage on schema public to authenticated;

grant select on public.schools to authenticated;
grant select on public.roles to authenticated;
grant select on public.school_members to authenticated;
grant select on public.academic_levels to authenticated;
grant select on public.academic_shifts to authenticated;
grant select on public.academic_groups to authenticated;
grant select on public.students to authenticated;
grant select on public.student_enrollments to authenticated;
grant select on public.student_group_assignments to authenticated;
grant select on public.gates to authenticated;
grant select on public.pickup_events to authenticated;