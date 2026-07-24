import {
  SEED_INVARIANTS,
  SEED_KNOWN_ABSENCES
} from './expected-foundation.mjs'
import { fail, pass, skip, warn } from './report.mjs'
import { queryLocalSql, sqlLiteral } from './runtime.mjs'

/**
 * Seed inspector — invariants from supabase/seed.sql.
 *
 * Uses local Postgres (docker exec / supabase db query).
 * Ambiguity flagged: Data API service_role currently cannot SELECT app
 * tables because Migration 0005 only GRANTs to `authenticated`.
 */

export async function inspectSeed() {
  const results = []

  try {
    const snapshotRows = await queryLocalSql(`
      select
        (select coalesce(json_agg(name order by name), '[]'::json)
           from public.roles) as roles,
        (select coalesce(json_agg(name order by name), '[]'::json)
           from public.academic_shifts) as academic_shifts,
        (select coalesce(json_agg(json_build_object(
            'id', id,
            'slug', slug,
            'name', name,
            'status', status,
            'plan', plan
          )), '[]'::json)
           from public.schools
           where slug = ${sqlLiteral(SEED_INVARIANTS.school.slug)}) as schools,
        (select coalesce(json_agg(json_build_object(
            'id', al.id,
            'name', al.name,
            'display_order', al.display_order,
            'status', al.status,
            'school_slug', s.slug
          )), '[]'::json)
           from public.academic_levels al
           join public.schools s on s.id = al.school_id
           where s.slug = ${sqlLiteral(SEED_INVARIANTS.school.slug)}
             and al.name = ${sqlLiteral(SEED_INVARIANTS.academicLevel.name)}) as academic_levels,
        (select coalesce(json_agg(json_build_object(
            'name', ag.name,
            'display_order', ag.display_order,
            'status', ag.status,
            'shift_name', ash.name
          ) order by ag.name), '[]'::json)
           from public.academic_groups ag
           join public.schools s on s.id = ag.school_id
           join public.academic_shifts ash on ash.id = ag.academic_shift_id
           where s.slug = ${sqlLiteral(SEED_INVARIANTS.school.slug)}) as academic_groups,
        (select coalesce(json_agg(json_build_object(
            'id', st.id,
            'student_identifier', st.student_identifier,
            'full_name', st.full_name,
            'status', st.status
          )), '[]'::json)
           from public.students st
           join public.schools s on s.id = st.school_id
           where s.slug = ${sqlLiteral(SEED_INVARIANTS.school.slug)}
             and st.student_identifier = ${sqlLiteral(SEED_INVARIANTS.student.studentIdentifier)}) as students,
        (select coalesce(json_agg(json_build_object(
            'id', se.id,
            'academic_year', se.academic_year,
            'status', se.status,
            'student_identifier', st.student_identifier
          )), '[]'::json)
           from public.student_enrollments se
           join public.students st on st.id = se.student_id
           join public.schools s on s.id = st.school_id
           where s.slug = ${sqlLiteral(SEED_INVARIANTS.school.slug)}
             and st.student_identifier = ${sqlLiteral(SEED_INVARIANTS.student.studentIdentifier)}
             and se.academic_year = ${sqlLiteral(SEED_INVARIANTS.enrollment.academicYear)}) as enrollments,
        (select coalesce(json_agg(json_build_object(
            'status', sga.status,
            'group_name', ag.name,
            'student_identifier', st.student_identifier,
            'academic_year', se.academic_year
          )), '[]'::json)
           from public.student_group_assignments sga
           join public.student_enrollments se on se.id = sga.student_enrollment_id
           join public.students st on st.id = se.student_id
           join public.schools s on s.id = st.school_id
           join public.academic_groups ag on ag.id = sga.academic_group_id
           where s.slug = ${sqlLiteral(SEED_INVARIANTS.school.slug)}
             and st.student_identifier = ${sqlLiteral(SEED_INVARIANTS.student.studentIdentifier)}
             and se.academic_year = ${sqlLiteral(SEED_INVARIANTS.enrollment.academicYear)}
             and sga.status = ${sqlLiteral(SEED_INVARIANTS.groupAssignment.status)}
             and ag.name = ${sqlLiteral(SEED_INVARIANTS.groupAssignment.groupName)}) as assignments,
        (select coalesce(json_agg(json_build_object(
            'name', g.name,
            'display_order', g.display_order,
            'status', g.status
          ) order by g.display_order), '[]'::json)
           from public.gates g
           join public.schools s on s.id = g.school_id
           where s.slug = ${sqlLiteral(SEED_INVARIANTS.school.slug)}) as gates
    `)

    if (snapshotRows.length !== 1) {
      return [
        fail('seed.snapshot', 'Expected a single seed snapshot row from local database.', {
          count: snapshotRows.length
        })
      ]
    }

    const snapshot = normalizeSnapshot(snapshotRows[0])

    for (const roleName of SEED_INVARIANTS.roles) {
      if (snapshot.roles.includes(roleName)) {
        results.push(pass(`seed.roles.${roleName}`, `Role "${roleName}" is seeded.`))
      } else {
        results.push(fail(`seed.roles.${roleName}`, `Expected role "${roleName}" is missing.`))
      }
    }

    for (const shiftName of SEED_INVARIANTS.academicShifts) {
      if (snapshot.academic_shifts.includes(shiftName)) {
        results.push(
          pass(`seed.academic_shifts.${shiftName}`, `Academic shift "${shiftName}" is seeded.`)
        )
      } else {
        results.push(
          fail(
            `seed.academic_shifts.${shiftName}`,
            `Expected academic shift "${shiftName}" is missing.`
          )
        )
      }
    }

    if (snapshot.schools.length !== 1) {
      results.push(
        fail(
          'seed.schools.smart-exit-dev-school',
          `Expected exactly one school with slug "${SEED_INVARIANTS.school.slug}".`,
          { count: snapshot.schools.length }
        )
      )
      return [...results, ...knownAbsenceWarnings()]
    }

    const school = snapshot.schools[0]
    if (
      school.name === SEED_INVARIANTS.school.name &&
      school.status === SEED_INVARIANTS.school.status &&
      school.plan === SEED_INVARIANTS.school.plan
    ) {
      results.push(
        pass(
          'seed.schools.smart-exit-dev-school',
          `School "${SEED_INVARIANTS.school.slug}" is seeded with expected baseline fields.`
        )
      )
    } else {
      results.push(
        fail(
          'seed.schools.smart-exit-dev-school',
          `School "${SEED_INVARIANTS.school.slug}" exists but baseline fields do not match seed.sql.`,
          {
            expected: SEED_INVARIANTS.school,
            actual: {
              name: school.name,
              status: school.status,
              plan: school.plan
            }
          }
        )
      )
    }

    if (snapshot.academic_levels.length !== 1) {
      results.push(
        fail(
          'seed.academic_levels.ensino-fundamental',
          `Expected exactly one academic level "${SEED_INVARIANTS.academicLevel.name}" for the dev school.`,
          { count: snapshot.academic_levels.length }
        )
      )
      return [...results, ...knownAbsenceWarnings()]
    }

    const level = snapshot.academic_levels[0]
    if (
      Number(level.display_order) === SEED_INVARIANTS.academicLevel.displayOrder &&
      level.status === SEED_INVARIANTS.academicLevel.status
    ) {
      results.push(
        pass(
          'seed.academic_levels.ensino-fundamental',
          `Academic level "${SEED_INVARIANTS.academicLevel.name}" is seeded.`
        )
      )
    } else {
      results.push(
        fail(
          'seed.academic_levels.ensino-fundamental',
          `Academic level "${SEED_INVARIANTS.academicLevel.name}" fields do not match seed.sql.`,
          {
            expected: SEED_INVARIANTS.academicLevel,
            actual: {
              display_order: level.display_order,
              status: level.status
            }
          }
        )
      )
    }

    for (const group of SEED_INVARIANTS.academicGroups) {
      const actual = snapshot.academic_groups.find(
        (row) => row.name === group.name && row.shift_name === group.shift
      )

      if (!actual) {
        results.push(
          fail(
            `seed.academic_groups.${group.name}`,
            `Expected academic group "${group.name}" (${group.shift}) is missing.`
          )
        )
        continue
      }

      if (
        Number(actual.display_order) === group.displayOrder &&
        actual.status === group.status
      ) {
        results.push(
          pass(
            `seed.academic_groups.${group.name}`,
            `Academic group "${group.name}" (${group.shift}) is seeded.`
          )
        )
      } else {
        results.push(
          fail(
            `seed.academic_groups.${group.name}`,
            `Academic group "${group.name}" fields do not match seed.sql.`,
            {
              expected: group,
              actual: {
                display_order: actual.display_order,
                status: actual.status
              }
            }
          )
        )
      }
    }

    if (snapshot.students.length !== 1) {
      results.push(
        fail(
          'seed.students.STU-0001',
          `Expected exactly one student "${SEED_INVARIANTS.student.studentIdentifier}".`,
          { count: snapshot.students.length }
        )
      )
      return [...results, ...knownAbsenceWarnings()]
    }

    const student = snapshot.students[0]
    if (
      student.full_name === SEED_INVARIANTS.student.fullName &&
      student.status === SEED_INVARIANTS.student.status
    ) {
      results.push(
        pass(
          'seed.students.STU-0001',
          `Student "${SEED_INVARIANTS.student.studentIdentifier}" is seeded.`
        )
      )
    } else {
      results.push(
        fail(
          'seed.students.STU-0001',
          `Student "${SEED_INVARIANTS.student.studentIdentifier}" fields do not match seed.sql.`,
          {
            expected: SEED_INVARIANTS.student,
            actual: {
              full_name: student.full_name,
              status: student.status
            }
          }
        )
      )
    }

    if (snapshot.enrollments.length !== 1) {
      results.push(
        fail(
          'seed.student_enrollments.2026',
          `Expected exactly one enrollment for year ${SEED_INVARIANTS.enrollment.academicYear}.`,
          { count: snapshot.enrollments.length }
        )
      )
      return [...results, ...knownAbsenceWarnings()]
    }

    const enrollment = snapshot.enrollments[0]
    if (enrollment.status === SEED_INVARIANTS.enrollment.status) {
      results.push(
        pass(
          'seed.student_enrollments.2026',
          `Enrollment for academic year ${SEED_INVARIANTS.enrollment.academicYear} is seeded.`
        )
      )
    } else {
      results.push(
        fail(
          'seed.student_enrollments.2026',
          'Enrollment status does not match seed.sql.',
          {
            expected: SEED_INVARIANTS.enrollment.status,
            actual: enrollment.status
          }
        )
      )
    }

    if (snapshot.assignments.length === 1) {
      results.push(
        pass(
          'seed.student_group_assignments.active',
          `Active assignment of enrollment → "${SEED_INVARIANTS.groupAssignment.groupName}" is seeded.`
        )
      )
    } else {
      results.push(
        fail(
          'seed.student_group_assignments.active',
          `Expected one active assignment to "${SEED_INVARIANTS.groupAssignment.groupName}".`,
          { count: snapshot.assignments.length }
        )
      )
    }

    for (const gate of SEED_INVARIANTS.gates) {
      const actual = snapshot.gates.find((row) => row.name === gate.name)

      if (!actual) {
        results.push(fail(`seed.gates.${gate.name}`, `Expected gate "${gate.name}" is missing.`))
        continue
      }

      if (
        Number(actual.display_order) === gate.displayOrder &&
        actual.status === gate.status
      ) {
        results.push(pass(`seed.gates.${gate.name}`, `Gate "${gate.name}" is seeded.`))
      } else {
        results.push(
          fail(
            `seed.gates.${gate.name}`,
            `Gate "${gate.name}" fields do not match seed.sql.`,
            {
              expected: gate,
              actual: {
                display_order: actual.display_order,
                status: actual.status
              }
            }
          )
        )
      }
    }

    results.push(...knownAbsenceWarnings())
    return results
  } catch (error) {
    return [
      skip('seed.connection', `Unable to query local database for seed invariants: ${error.message}`)
    ]
  }
}

function parseJsonField(value) {
  if (value == null) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function normalizeSnapshot(row) {
  return {
    roles: parseJsonField(row.roles),
    academic_shifts: parseJsonField(row.academic_shifts),
    schools: parseJsonField(row.schools),
    academic_levels: parseJsonField(row.academic_levels),
    academic_groups: parseJsonField(row.academic_groups),
    students: parseJsonField(row.students),
    enrollments: parseJsonField(row.enrollments),
    assignments: parseJsonField(row.assignments),
    gates: parseJsonField(row.gates)
  }
}

function knownAbsenceWarnings() {
  return SEED_KNOWN_ABSENCES.map((item) =>
    warn(
      'seed.known-absence',
      `Seed intentionally does not include ${item} (not a seed.sql contract violation).`
    )
  )
}
