import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { pickupEventRepository, activeCallListQuery } from '../repositories/pickupEventRepository.js'
import {
  availableStudents,
  compareCalledAtDesc,
  mapActiveCall,
  pickupService,
  splitActiveQueue
} from './pickupService.js'

const SCHOOL_ID = '76f29d9f-c6fd-4561-89f8-403fef0ccb40'
const OTHER_SCHOOL_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const ENROLLMENT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const GATE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const NOW = new Date('2026-09-28T15:00:00')

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

function enrollmentRow(schoolId = SCHOOL_ID) {
  return {
    id: ENROLLMENT_ID,
    student_id: 'student-1',
    academic_year: 2026,
    status: 'active',
    students: { id: 'student-1', school_id: schoolId, status: 'active' }
  }
}

function gateRow(schoolId = SCHOOL_ID, status = 'active') {
  return { id: GATE_ID, school_id: schoolId, name: 'Portão Norte', status }
}

function nestedCall(overrides = {}) {
  return {
    id: 'event-1',
    school_id: SCHOOL_ID,
    student_enrollment_id: ENROLLMENT_ID,
    gate_id: GATE_ID,
    status: 'called',
    called_at: '2026-09-28T18:10:00.000Z',
    gates: { id: GATE_ID, name: 'Portão Norte' },
    student_enrollments: {
      id: ENROLLMENT_ID,
      student_id: 'student-1',
      students: { id: 'student-1', full_name: 'Ana Souza' },
      student_group_assignments: [
        { status: 'inactive', academic_groups: { name: 'Turma antiga' } },
        { status: 'active', academic_groups: { name: '5º Ano A' } }
      ]
    },
    ...overrides
  }
}

describe('pickupEventRepository query', () => {
  it('lists only called events ordered by called_at descending', () => {
    const query = activeCallListQuery(SCHOOL_ID)

    assert.equal(query.table, 'pickup_events')
    assert.equal(query.schoolId, SCHOOL_ID)
    assert.equal(query.status, 'called')
    assert.equal(query.orderColumn, 'called_at')
    assert.equal(query.ascending, false)
    assert.equal('remove' in pickupEventRepository, false)
    assert.equal('delete' in pickupEventRepository, false)
    assert.equal(typeof pickupEventRepository.complete, 'function')
    assert.equal(typeof pickupEventRepository.create, 'function')
  })
})

describe('pickup queue view', () => {
  it('maps the active assignment and ignores a non-called row in the service list', async () => {
    const restore = stub(pickupEventRepository, {
      listActiveBySchool: async () => ({
        data: [
          nestedCall({ id: 'older', called_at: '2026-09-28T18:00:00.000Z' }),
          nestedCall({ id: 'newer', called_at: '2026-09-28T18:20:00.000Z', status: 'called' }),
          nestedCall({ id: 'done', status: 'completed', called_at: '2026-09-28T18:30:00.000Z' })
        ],
        error: null
      })
    })

    const result = await pickupService.getActiveCallsBySchool(SCHOOL_ID)
    restore()

    assert.equal(result.error, null)
    assert.deepEqual(result.data.map((call) => call.id), ['newer', 'older'])
    assert.equal(result.data[0].name, 'Ana Souza')
    assert.equal(result.data[0].grade, '5º Ano A')
    assert.equal(result.data[0].gateName, 'Portão Norte')
    assert.equal(result.data[0].enrollmentId, ENROLLMENT_ID)
    assert.equal(result.data[0].studentId, 'student-1')
    assert.equal(result.data[0].status, 'called')
  })

  it('orders by called_at descending', () => {
    const ordered = [
      { calledAt: '2026-09-28T12:00:00.000Z' },
      { calledAt: '2026-09-28T18:00:00.000Z' }
    ].sort(compareCalledAtDesc)

    assert.equal(ordered[0].calledAt, '2026-09-28T18:00:00.000Z')
  })

  it('hides a student whose enrollment is already called', () => {
    const students = [
      { id: 'student-1', enrollmentId: ENROLLMENT_ID, name: 'Ana' },
      { id: 'student-2', enrollmentId: 'enrollment-2', name: 'Bruno' }
    ]
    const available = availableStudents(students, [{ enrollmentId: ENROLLMENT_ID }])

    assert.deepEqual(available.map((student) => student.name), ['Bruno'])
  })

  it('uses the first called event as the TV highlight and the rest as the queue', () => {
    const queue = splitActiveQueue([
      mapActiveCall(nestedCall({ id: 'older', called_at: '2026-09-28T18:00:00.000Z' })),
      mapActiveCall(nestedCall({ id: 'newer', called_at: '2026-09-28T18:20:00.000Z' }))
    ])

    assert.equal(queue.current.id, 'newer')
    assert.deepEqual(queue.following.map((call) => call.id), ['older'])
  })
})

describe('pickupService.callStudent', { concurrency: 1 }, () => {
  it('creates a call with school, enrollment and gate ids only', async () => {
    const writes = []
    const restore = stub(pickupEventRepository, {
      findEnrollmentForSchool: async (enrollmentId, schoolId) => {
        assert.equal(enrollmentId, ENROLLMENT_ID)
        assert.equal(schoolId, SCHOOL_ID)
        return { data: enrollmentRow(), error: null }
      },
      findGateForSchool: async (gateId, schoolId) => {
        assert.equal(gateId, GATE_ID)
        assert.equal(schoolId, SCHOOL_ID)
        return { data: gateRow(), error: null }
      },
      findActiveByEnrollment: async () => ({ data: null, error: null }),
      create: async (row) => {
        writes.push(row)
        return {
          data: {
            id: 'event-1',
            status: 'called',
            school_id: row.schoolId,
            student_enrollment_id: row.studentEnrollmentId,
            gate_id: row.gateId,
            called_at: '2026-09-28T18:00:00.000Z'
          },
          error: null
        }
      }
    })

    const result = await pickupService.callStudent({
      schoolId: SCHOOL_ID,
      studentEnrollmentId: ENROLLMENT_ID,
      gateId: GATE_ID,
      name: 'Ana Souza',
      grade: '5º Ano A',
      time: '15:00'
    }, NOW)

    restore()

    assert.equal(result.error, null)
    assert.deepEqual(writes, [{
      schoolId: SCHOOL_ID,
      studentEnrollmentId: ENROLLMENT_ID,
      gateId: GATE_ID
    }])
    assert.equal(result.data.status, 'called')
    assert.equal(Object.hasOwn(writes[0], 'status'), false)
    assert.equal(Object.hasOwn(writes[0], 'name'), false)
    assert.equal(Object.hasOwn(writes[0], 'grade'), false)
    assert.equal(Object.hasOwn(writes[0], 'time'), false)
  })

  it('rejects an enrollment from another school', async () => {
    let created = false
    const restore = stub(pickupEventRepository, {
      findEnrollmentForSchool: async () => ({ data: enrollmentRow(OTHER_SCHOOL_ID), error: null }),
      findGateForSchool: async () => ({ data: gateRow(), error: null }),
      create: async () => {
        created = true
        return { data: null, error: null }
      }
    })

    const result = await pickupService.callStudent({
      schoolId: SCHOOL_ID,
      studentEnrollmentId: ENROLLMENT_ID,
      gateId: GATE_ID
    }, NOW)

    restore()

    assert.equal(created, false)
    assert.equal(result.error.message, 'A matrícula não pertence a esta escola.')
  })

  it('rejects a gate from another school', async () => {
    let created = false
    const restore = stub(pickupEventRepository, {
      findEnrollmentForSchool: async () => ({ data: enrollmentRow(), error: null }),
      findGateForSchool: async () => ({ data: gateRow(OTHER_SCHOOL_ID), error: null }),
      create: async () => {
        created = true
        return { data: null, error: null }
      }
    })

    const result = await pickupService.callStudent({
      schoolId: SCHOOL_ID,
      studentEnrollmentId: ENROLLMENT_ID,
      gateId: GATE_ID
    }, NOW)

    restore()

    assert.equal(created, false)
    assert.equal(result.error.message, 'O portão não pertence a esta escola.')
  })

  it('rejects a second active call for the same enrollment before insert', async () => {
    let created = false
    const restore = stub(pickupEventRepository, {
      findEnrollmentForSchool: async () => ({ data: enrollmentRow(), error: null }),
      findGateForSchool: async () => ({ data: gateRow(), error: null }),
      findActiveByEnrollment: async () => ({ data: { id: 'event-1', status: 'called' }, error: null }),
      create: async () => {
        created = true
        return { data: null, error: null }
      }
    })

    const result = await pickupService.callStudent({
      schoolId: SCHOOL_ID,
      studentEnrollmentId: ENROLLMENT_ID,
      gateId: GATE_ID
    }, NOW)

    restore()

    assert.equal(created, false)
    assert.equal(result.error.message, 'Este aluno já está na fila.')
  })

  it('keeps one called row when two calls race on the same enrollment', async () => {
    const activeByEnrollment = new Map()
    let creates = 0
    const restore = stub(pickupEventRepository, {
      findEnrollmentForSchool: async () => ({ data: enrollmentRow(), error: null }),
      findGateForSchool: async () => ({ data: gateRow(), error: null }),
      findActiveByEnrollment: async () => ({ data: null, error: null }),
      create: async (row) => {
        creates += 1
        if (activeByEnrollment.has(row.studentEnrollmentId)) {
          return {
            data: null,
            error: { code: '23505', message: 'duplicate key value violates pickup_events_active_enrollment_unique' }
          }
        }

        const event = { id: 'event-1', status: 'called', ...row }
        activeByEnrollment.set(row.studentEnrollmentId, event)
        return { data: event, error: null }
      }
    })

    const [first, second] = await Promise.all([
      pickupService.callStudent({ schoolId: SCHOOL_ID, studentEnrollmentId: ENROLLMENT_ID, gateId: GATE_ID }, NOW),
      pickupService.callStudent({ schoolId: SCHOOL_ID, studentEnrollmentId: ENROLLMENT_ID, gateId: GATE_ID }, NOW)
    ])

    restore()

    const successes = [first, second].filter((result) => result.error === null)
    const failures = [first, second].filter((result) => result.error)

    assert.equal(creates, 2)
    assert.equal(successes.length, 1)
    assert.equal(failures.length, 1)
    assert.equal(failures[0].error.message, 'Este aluno já está na fila.')
    assert.equal(activeByEnrollment.size, 1)
  })
})

describe('pickupService.completeCall', { concurrency: 1 }, () => {
  it('marks the event completed and keeps the row out of the active queue', async () => {
    const stored = [
      nestedCall({ id: 'event-1', called_at: '2026-09-28T18:00:00.000Z' })
    ]
    let deleted = 0
    const restore = stub(pickupEventRepository, {
      listActiveBySchool: async () => ({
        data: stored.filter((row) => row.status === 'called'),
        error: null
      }),
      complete: async (eventId) => {
        const row = stored.find((item) => item.id === eventId && item.status === 'called')
        if (!row) {
          return { data: null, error: null }
        }

        row.status = 'completed'
        row.completed_at = '2026-09-28T18:05:00.000Z'
        return { data: { id: row.id, status: row.status, completed_at: row.completed_at }, error: null }
      },
      remove: async () => {
        deleted += 1
        return { error: null }
      }
    })

    const before = await pickupService.getActiveCallsBySchool(SCHOOL_ID)
    const completed = await pickupService.completeCall('event-1')
    const after = await pickupService.getActiveCallsBySchool(SCHOOL_ID)
    restore()

    assert.equal(before.data.length, 1)
    assert.equal(completed.error, null)
    assert.equal(completed.data.status, 'completed')
    assert.ok(completed.data.completed_at)
    assert.equal(after.data.length, 0)
    assert.equal(stored.length, 1)
    assert.equal(stored[0].status, 'completed')
    assert.equal(deleted, 0)
  })

  it('does not complete a row that is no longer called', async () => {
    const restore = stub(pickupEventRepository, {
      complete: async () => ({ data: null, error: null })
    })

    const result = await pickupService.completeCall('event-1')
    restore()

    assert.equal(result.data, null)
    assert.equal(result.error.message, 'Esta chamada já foi confirmada ou não está mais ativa.')
  })

  it('maps an identity rejection from the database error text', async () => {
    const restore = stub(pickupEventRepository, {
      complete: async () => ({
        data: null,
        error: { code: '23514', message: 'pickup event identity fields are immutable' }
      })
    })

    const result = await pickupService.completeCall('event-1')
    restore()

    assert.equal(result.data, null)
    assert.equal(result.error.message, 'A escola, a matrícula, o portão e o horário da chamada não podem ser alterados.')
  })
})

describe('pickup_events insert state machine', () => {
  const sql = readFileSync(
    new URL('../../supabase/migrations/20260928170000_pickup_events_insert_called_only.sql', import.meta.url),
    'utf8'
  )

  it('rejects an insert that is not called and keeps called to completed', () => {
    assert.match(sql, /tg_op = 'INSERT' and new\.status is distinct from 'called'/)
    assert.match(sql, /pickup event insert must start as called/)
    assert.match(sql, /old\.status is distinct from 'called' or new\.status is distinct from 'completed'/)
    assert.match(sql, /pickup event status can only change from called to completed/)
    assert.match(sql, /new\.completed_at := now\(\)/)
    assert.match(sql, /new\.updated_at := now\(\)/)
    assert.match(sql, /pickup_events_share_school/)
    assert.equal(sql.includes('grant delete'), false)
    assert.match(sql, /revoke delete on table public\.pickup_events from authenticated/)
  })

  it('rejects identity changes while the row is called', () => {
    assert.match(sql, /old\.status = 'called'/)
    assert.match(sql, /new\.school_id is distinct from old\.school_id/)
    assert.match(sql, /new\.student_enrollment_id is distinct from old\.student_enrollment_id/)
    assert.match(sql, /new\.gate_id is distinct from old\.gate_id/)
    assert.match(sql, /new\.called_at is distinct from old\.called_at/)
    assert.match(sql, /pickup event identity fields are immutable/)
  })
})

describe('pickup operational source', () => {
  it('does not keep localStorage as the queue authority', () => {
    const service = readFileSync(new URL('./pickupService.js', import.meta.url), 'utf8')
    const repository = readFileSync(new URL('../repositories/pickupEventRepository.js', import.meta.url), 'utf8')
    const panel = readFileSync(new URL('../pages/InstitutionPanel.jsx', import.meta.url), 'utf8')
    const tv = readFileSync(new URL('../pages/TvDisplay.jsx', import.meta.url), 'utf8')

    for (const source of [service, repository, panel, tv]) {
      assert.equal(source.includes('@SmartExit:called:'), false)
      assert.equal(source.includes('callService'), false)
      assert.equal(source.includes('localStorage'), false)
    }

    assert.equal(panel.includes('student.defaultExit'), false)
    assert.equal(tv.includes('exitGate'), false)
  })
})
