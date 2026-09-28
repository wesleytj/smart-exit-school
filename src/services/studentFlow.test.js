import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { academicGroupRepository } from '../repositories/academicGroupRepository.js'
import { studentRepository } from '../repositories/studentRepository.js'
import { studentEnrollmentRepository } from '../repositories/studentEnrollmentRepository.js'
import { studentGroupAssignmentRepository } from '../repositories/studentGroupAssignmentRepository.js'
import { currentAcademicYear } from './academicYear.js'
import { studentService, mapStudentError } from './studentService.js'
import { studentGroupAssignmentService } from './studentGroupAssignmentService.js'

const SCHOOL_ID = '76f29d9f-c6fd-4561-89f8-403fef0ccb40'
const OTHER_SCHOOL_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const NOW = new Date('2026-09-25T12:00:00')

function stub(target, methods) {
  const originals = {}

  for (const [name, implementation] of Object.entries(methods)) {
    originals[name] = target[name]
    target[name] = implementation
  }

  return () => {
    for (const [name, implementation] of Object.entries(originals)) {
      target[name] = implementation
    }
  }
}

function allowGroup(schoolId = SCHOOL_ID) {
  return stub(academicGroupRepository, {
    getByIdForSchool: async (id, requestedSchoolId) => {
      if (requestedSchoolId !== schoolId) {
        return { data: null, error: null }
      }

      return { data: { id, school_id: schoolId, name: '5º Ano A', status: 'active' }, error: null }
    },
    listBySchool: async () => ({ data: [{ id: 'group-1', school_id: schoolId, name: '5º Ano A', status: 'active' }], error: null })
  })
}

describe('currentAcademicYear', { concurrency: 1 }, () => {
  it('uses the calendar year of the provided clock', () => {
    assert.equal(currentAcademicYear(new Date('2026-01-02T00:00:00')), 2026)
    assert.equal(currentAcademicYear(new Date('2027-12-31T00:00:00')), 2027)
  })
})

describe('studentService', { concurrency: 1 }, () => {
  it('creates a student without an identifier and enrolls them in the current year', async () => {
    const writes = []
    const restoreStudent = stub(studentRepository, {
      create: async (row) => {
        writes.push(['student', row])
        return { data: { id: 'student-1', ...row }, error: null }
      },
      remove: async () => ({ error: null })
    })
    const restoreEnrollment = stub(studentEnrollmentRepository, {
      create: async (row) => {
        writes.push(['enrollment', row])
        return { data: null, error: null }
      },
      findByStudentAndYear: async () => ({
        data: { id: 'enrollment-1', student_id: 'student-1', academic_year: 2026, status: 'active' },
        error: null
      })
    })
    const restoreGroup = allowGroup()
    const restoreAssignment = stub(studentGroupAssignmentRepository, {
      create: async (row) => {
        writes.push(['assignment', row])
        return { data: { id: 'assignment-1', ...row }, error: null }
      }
    })

    const result = await studentService.registerStudent(SCHOOL_ID, {
      fullName: '  Ana Souza  ',
      studentIdentifier: '   ',
      academicGroupId: 'group-1',
      school_id: OTHER_SCHOOL_ID
    }, NOW)

    restoreAssignment()
    restoreGroup()
    restoreEnrollment()
    restoreStudent()

    assert.equal(result.error, null)
    assert.equal(writes[0][1].school_id, SCHOOL_ID)
    assert.equal(writes[0][1].student_identifier, null)
    assert.equal(writes[0][1].full_name, 'Ana Souza')
    assert.equal(writes[0][1].status, 'active')
    assert.equal(writes[1][1].academic_year, 2026)
    assert.equal(writes[1][1].student_id, 'student-1')
    assert.equal(writes[2][1].student_enrollment_id, 'enrollment-1')
    assert.equal(writes[2][1].academic_group_id, 'group-1')
    assert.equal(writes[2][1].status, 'active')
  })

  it('creates a student with an identifier', async () => {
    let identifier = null
    const restoreStudent = stub(studentRepository, {
      create: async (row) => {
        identifier = row.student_identifier
        return { data: { id: 'student-2', ...row }, error: null }
      },
      remove: async () => ({ error: null })
    })
    const restoreEnrollment = stub(studentEnrollmentRepository, {
      create: async () => ({ data: null, error: null }),
      findByStudentAndYear: async () => ({
        data: { id: 'enrollment-2', student_id: 'student-2', academic_year: 2026, status: 'active' },
        error: null
      })
    })
    const restoreGroup = allowGroup()
    const restoreAssignment = stub(studentGroupAssignmentRepository, {
      create: async (row) => ({ data: { id: 'assignment-2', ...row }, error: null })
    })

    const result = await studentService.registerStudent(SCHOOL_ID, {
      fullName: 'Bruno',
      studentIdentifier: ' MAT-10 ',
      academicGroupId: 'group-1'
    }, NOW)

    restoreAssignment()
    restoreGroup()
    restoreEnrollment()
    restoreStudent()

    assert.equal(result.error, null)
    assert.equal(identifier, 'MAT-10')
  })

  it('removes the student when the enrollment cannot be read after insert', async () => {
    const removed = []
    let assignmentCreated = false
    const restoreStudent = stub(studentRepository, {
      create: async (row) => ({ data: { id: 'student-read', ...row }, error: null }),
      remove: async (id, schoolId) => {
        removed.push({ id, schoolId })
        return { error: null }
      }
    })
    const restoreEnrollment = stub(studentEnrollmentRepository, {
      create: async () => ({ data: null, error: null }),
      findByStudentAndYear: async () => ({ data: null, error: new Error('enrollment unreadable') })
    })
    const restoreAssignment = stub(studentGroupAssignmentRepository, {
      create: async () => {
        assignmentCreated = true
        return { data: { id: 'assignment-read' }, error: null }
      }
    })

    const result = await studentService.registerStudent(SCHOOL_ID, {
      fullName: 'Diana',
      academicGroupId: 'group-1'
    }, NOW)

    restoreAssignment()
    restoreEnrollment()
    restoreStudent()

    assert.equal(assignmentCreated, false)
    assert.equal(result.error.message, 'enrollment unreadable')
    assert.deepEqual(removed, [{ id: 'student-read', schoolId: SCHOOL_ID }])
  })

  it('maps a duplicate identifier to a friendly message and does not create an enrollment', async () => {
    let enrollmentCreated = false
    const restoreStudent = stub(studentRepository, {
      create: async () => ({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint "students_school_identifier_unique"' }
      })
    })
    const restoreEnrollment = stub(studentEnrollmentRepository, {
      create: async () => {
        enrollmentCreated = true
        return { data: null, error: null }
      }
    })

    const result = await studentService.registerStudent(SCHOOL_ID, {
      fullName: 'Bruno',
      studentIdentifier: 'MAT-10',
      academicGroupId: 'group-1'
    }, NOW)

    restoreEnrollment()
    restoreStudent()

    assert.equal(enrollmentCreated, false)
    assert.equal(result.error.message, 'Já existe um aluno com essa matrícula nesta escola.')
    assert.equal(mapStudentError({
      code: '23505',
      message: 'students_school_identifier_unique'
    }).message, 'Já existe um aluno com essa matrícula nesta escola.')
  })

  it('rejects a group from another school and removes the student', async () => {
    const removed = []
    const restoreStudent = stub(studentRepository, {
      create: async (row) => ({ data: { id: 'student-3', ...row }, error: null }),
      remove: async (id, schoolId) => {
        removed.push({ id, schoolId })
        return { error: null }
      }
    })
    const restoreEnrollment = stub(studentEnrollmentRepository, {
      create: async () => ({ data: null, error: null }),
      findByStudentAndYear: async () => ({
        data: { id: 'enrollment-3', student_id: 'student-3', academic_year: 2026, status: 'active' },
        error: null
      })
    })
    const restoreGroup = stub(academicGroupRepository, {
      getByIdForSchool: async () => ({ data: null, error: null })
    })
    const restoreAssignment = stub(studentGroupAssignmentRepository, {
      create: async () => {
        throw new Error('should not create assignment')
      }
    })

    const result = await studentService.registerStudent(SCHOOL_ID, {
      fullName: 'Carla',
      academicGroupId: 'foreign-group',
      school_id: OTHER_SCHOOL_ID
    }, NOW)

    restoreAssignment()
    restoreGroup()
    restoreEnrollment()
    restoreStudent()

    assert.equal(result.error.message, 'A turma não pertence a esta escola.')
    assert.deepEqual(removed, [{ id: 'student-3', schoolId: SCHOOL_ID }])
  })

  it('changes the group by inactivating the current assignment before creating one active assignment', async () => {
    const assignmentWrites = []
    const restoreStudent = stub(studentRepository, {
      update: async (id, schoolId, changes) => ({ data: { id, school_id: schoolId, full_name: changes.full_name, student_identifier: changes.student_identifier, status: 'active' }, error: null })
    })
    const restoreGroup = allowGroup()
    const restoreAssignment = stub(studentGroupAssignmentRepository, {
      update: async (id, changes) => {
        assignmentWrites.push(['update', id, changes])
        return { data: { id, ...changes }, error: null }
      },
      create: async (row) => {
        assignmentWrites.push(['create', row])
        return { data: { id: 'assignment-new', ...row }, error: null }
      }
    })

    const result = await studentService.updateStudent(SCHOOL_ID, 'student-1', {
      fullName: 'Ana',
      academicGroupId: 'group-2',
      currentAcademicGroupId: 'group-1',
      enrollmentId: 'enrollment-1',
      assignmentId: 'assignment-1',
      school_id: OTHER_SCHOOL_ID
    })

    restoreAssignment()
    restoreGroup()
    restoreStudent()

    assert.equal(result.error, null)
    assert.deepEqual(assignmentWrites[0], ['update', 'assignment-1', { status: 'inactive' }])
    assert.equal(assignmentWrites[1][1].status, 'active')
    assert.equal(assignmentWrites[1][1].academic_group_id, 'group-2')
    assert.equal(assignmentWrites.filter((write) => write[0] === 'create' && write[1].status === 'active').length, 1)
  })

  it('inactivates a student without deleting the row', async () => {
    let changes = null
    const restore = stub(studentRepository, {
      update: async (id, schoolId, next) => {
        changes = { id, schoolId, next }
        return { data: { id, ...next }, error: null }
      }
    })

    const result = await studentService.setStudentStatus(SCHOOL_ID, 'student-1', 'inactive')
    restore()

    assert.equal(result.error, null)
    assert.deepEqual(changes, { id: 'student-1', schoolId: SCHOOL_ID, next: { status: 'inactive' } })
  })

  it('lists students with the active group name', async () => {
    const restoreStudent = stub(studentRepository, {
      listBySchool: async (schoolId) => ({
        data: [{ id: 'student-1', school_id: schoolId, full_name: 'Ana', student_identifier: null, status: 'active' }],
        error: null
      })
    })
    const restoreEnrollment = stub(studentEnrollmentRepository, {
      listByStudentIds: async () => ({
        data: [{ id: 'enrollment-1', student_id: 'student-1', academic_year: 2026, status: 'active' }],
        error: null
      })
    })
    const restoreAssignment = stub(studentGroupAssignmentRepository, {
      listByEnrollmentIds: async () => ({
        data: [
          { id: 'assignment-old', student_enrollment_id: 'enrollment-1', academic_group_id: 'group-old', status: 'inactive' },
          { id: 'assignment-1', student_enrollment_id: 'enrollment-1', academic_group_id: 'group-1', status: 'active' }
        ],
        error: null
      })
    })
    const restoreGroup = stub(academicGroupRepository, {
      listBySchool: async () => ({ data: [{ id: 'group-1', name: '5º Ano A', school_id: SCHOOL_ID }], error: null })
    })

    const result = await studentService.listForSchool(SCHOOL_ID, NOW)
    restoreGroup()
    restoreAssignment()
    restoreEnrollment()
    restoreStudent()

    assert.equal(result.error, null)
    assert.equal(result.data[0].grade, '5º Ano A')
    assert.equal(result.data[0].assignmentId, 'assignment-1')
    assert.equal(result.data[0].schoolId, SCHOOL_ID)
  })
})

describe('studentGroupAssignmentService', { concurrency: 1 }, () => {
  it('does not create an assignment when the group belongs to another school', async () => {
    let created = false
    const restoreGroup = stub(academicGroupRepository, {
      getByIdForSchool: async () => ({ data: { id: 'group-x', school_id: OTHER_SCHOOL_ID, status: 'active' }, error: null })
    })
    const restoreAssignment = stub(studentGroupAssignmentRepository, {
      create: async () => {
        created = true
        return { data: { id: 'assignment-x' }, error: null }
      }
    })

    const result = await studentGroupAssignmentService.createActive(SCHOOL_ID, {
      enrollmentId: 'enrollment-1',
      academicGroupId: 'group-x'
    })

    restoreAssignment()
    restoreGroup()

    assert.equal(created, false)
    assert.equal(result.error.message, 'A turma não pertence a esta escola.')
  })
})
