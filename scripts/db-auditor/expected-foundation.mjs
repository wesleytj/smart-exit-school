/**
 * Database Auditor v1 — expected contract through Migration 0005.
 *
 * Source of truth:
 * - supabase/migrations/20260628155403_create_authentication_core.sql (0001)
 * - supabase/migrations/20260701014657_create_academic_core.sql (0002)
 * - supabase/migrations/20260702204601_create_student_group_assignments.sql (0003)
 * - supabase/migrations/20260703154000_create_pickup_core_foundation.sql (0004)
 * - supabase/migrations/20260706180031_enable-rls-foundation.sql (0005)
 * - supabase/seed.sql
 *
 * Ambiguities / intentional non-assertions (do not guess):
 * - Migration 0005 grants SELECT only on most tables, while several policies
 *   declare INSERT/UPDATE/DELETE. Grant matrix is NOT asserted in v1.
 * - `profiles` has RLS policies but no GRANT in 0005 — not asserted here.
 * - Seed does NOT create auth.users, profiles, school_members, or pickup_events.
 * - Seed creates group EF3TA but only assigns the sample student to EF3MA.
 */

// ------------------------------------------------------------
// Tables introduced by migrations 0001–0004 (RLS enabled in 0005)
// ------------------------------------------------------------

export const APP_TABLES = [
  'schools',
  'roles',
  'profiles',
  'school_members',
  'academic_levels',
  'academic_shifts',
  'academic_groups',
  'students',
  'student_enrollments',
  'student_group_assignments',
  'gates',
  'pickup_events'
]

// ------------------------------------------------------------
// RLS helper functions (Migration 0005)
// ------------------------------------------------------------

export const RLS_HELPER_FUNCTIONS = [
  {
    schema: 'public',
    name: 'is_active_school_member',
    argumentTypes: ['uuid']
  },
  {
    schema: 'public',
    name: 'can_access_student_enrollment',
    argumentTypes: ['uuid']
  },
  {
    schema: 'public',
    name: 'can_access_academic_group',
    argumentTypes: ['uuid']
  },
  {
    schema: 'public',
    name: 'can_access_gate',
    argumentTypes: ['uuid']
  }
]

// ------------------------------------------------------------
// Policies (Migration 0005) — exact names from the migration file
// ------------------------------------------------------------

export const EXPECTED_POLICIES = [
  { table: 'profiles', name: 'profiles_select_own' },
  { table: 'profiles', name: 'profiles_insert_own' },
  { table: 'profiles', name: 'profiles_update_own' },

  { table: 'schools', name: 'schools_select_member' },

  { table: 'roles', name: 'roles_select_authenticated' },

  { table: 'school_members', name: 'school_members_select_same_school' },

  { table: 'academic_shifts', name: 'academic_shifts_select_authenticated' },

  { table: 'academic_levels', name: 'academic_levels_select_member' },
  { table: 'academic_levels', name: 'academic_levels_insert_member' },
  { table: 'academic_levels', name: 'academic_levels_update_member' },
  { table: 'academic_levels', name: 'academic_levels_delete_member' },

  { table: 'academic_groups', name: 'academic_groups_select_member' },
  { table: 'academic_groups', name: 'academic_groups_insert_member' },
  { table: 'academic_groups', name: 'academic_groups_update_member' },
  { table: 'academic_groups', name: 'academic_groups_delete_member' },

  { table: 'students', name: 'students_select_member' },
  { table: 'students', name: 'students_insert_member' },
  { table: 'students', name: 'students_update_member' },
  { table: 'students', name: 'students_delete_member' },

  { table: 'student_enrollments', name: 'student_enrollments_select_member' },
  { table: 'student_enrollments', name: 'student_enrollments_insert_member' },
  { table: 'student_enrollments', name: 'student_enrollments_update_member' },
  { table: 'student_enrollments', name: 'student_enrollments_delete_member' },

  { table: 'student_group_assignments', name: 'student_group_assignments_select_member' },
  { table: 'student_group_assignments', name: 'student_group_assignments_insert_member' },
  { table: 'student_group_assignments', name: 'student_group_assignments_update_member' },
  { table: 'student_group_assignments', name: 'student_group_assignments_delete_member' },

  { table: 'gates', name: 'gates_select_member' },
  { table: 'gates', name: 'gates_insert_member' },
  { table: 'gates', name: 'gates_update_member' },
  { table: 'gates', name: 'gates_delete_member' },

  { table: 'pickup_events', name: 'pickup_events_select_member' },
  { table: 'pickup_events', name: 'pickup_events_insert_member' },
  { table: 'pickup_events', name: 'pickup_events_update_member' },
  { table: 'pickup_events', name: 'pickup_events_delete_member' }
]

// ------------------------------------------------------------
// Seed invariants (supabase/seed.sql)
// ------------------------------------------------------------

export const SEED_INVARIANTS = {
  roles: ['owner', 'administrator', 'secretary', 'gatekeeper'],

  academicShifts: ['morning', 'afternoon', 'full_time', 'night'],

  school: {
    slug: 'smart-exit-dev-school',
    name: 'Smart Exit Development School',
    status: 'active',
    plan: 'basic'
  },

  academicLevel: {
    name: 'Ensino Fundamental',
    displayOrder: 1,
    status: 'active'
  },

  academicGroups: [
    { name: 'EF3MA', shift: 'morning', displayOrder: 1, status: 'active' },
    { name: 'EF3TA', shift: 'afternoon', displayOrder: 2, status: 'active' }
  ],

  student: {
    studentIdentifier: 'STU-0001',
    fullName: 'João Teste',
    status: 'active'
  },

  enrollment: {
    academicYear: 2026,
    status: 'active'
  },

  /** Seed assigns the sample enrollment only to the morning group. */
  groupAssignment: {
    groupName: 'EF3MA',
    status: 'active'
  },

  gates: [
    { name: 'Portão Principal', displayOrder: 1, status: 'active' },
    { name: 'Portão Infantil', displayOrder: 2, status: 'active' },
    { name: 'Portão Lateral', displayOrder: 3, status: 'active' }
  ]
}

/**
 * Known absences in the current seed — reported as informational WARN,
 * not FAIL. These are not contract violations of seed.sql.
 */
export const SEED_KNOWN_ABSENCES = [
  'auth.users (no seeded Auth users)',
  'public.profiles',
  'public.school_members',
  'public.pickup_events'
]
