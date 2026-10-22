import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { supabase } from '../lib/supabase.js'
import { pickupEventRepository, activeCallListQuery } from '../repositories/pickupEventRepository.js'
import {
  availableStudents,
  compareCalledAtDesc,
  mapActiveCall,
  pickupService,
  splitActiveQueue,
  buildExitHistoryCsv,
  formatWaitTime,
  MAX_CSV_EXPORT_ROWS
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

describe('pickupService.cancelCall', { concurrency: 1 }, () => {
  it('marks the event cancelled and keeps the row out of the active queue', async () => {
    const stored = [
      nestedCall({ id: 'event-1', called_at: '2026-09-28T18:00:00.000Z' })
    ]
    let cancelPayload = null
    const restore = stub(pickupEventRepository, {
      listActiveBySchool: async () => ({
        data: stored.filter((row) => row.status === 'called'),
        error: null
      }),
      cancel: async (eventId) => {
        const row = stored.find((item) => item.id === eventId && item.status === 'called')
        if (!row) {
          return { data: null, error: null }
        }

        row.status = 'cancelled'
        row.cancelled_at = '2026-09-28T18:05:00.000Z'
        cancelPayload = { id: row.id, status: row.status, cancelled_at: row.cancelled_at }
        return { data: cancelPayload, error: null }
      }
    })

    const before = await pickupService.getActiveCallsBySchool(SCHOOL_ID)
    const cancelled = await pickupService.cancelCall('event-1')
    const after = await pickupService.getActiveCallsBySchool(SCHOOL_ID)
    restore()

    assert.equal(before.data.length, 1)
    assert.equal(cancelled.error, null)
    assert.equal(cancelled.data.status, 'cancelled')
    assert.ok(cancelled.data.cancelled_at)
    assert.equal(after.data.length, 0)
    assert.equal(stored.length, 1)
    assert.equal(stored[0].status, 'cancelled')
  })

  it('does not cancel a row that is no longer called', async () => {
    const restore = stub(pickupEventRepository, {
      cancel: async () => ({ data: null, error: null })
    })

    const result = await pickupService.cancelCall('event-1')
    restore()

    assert.equal(result.data, null)
    assert.equal(result.error.message, 'Esta chamada já foi cancelada ou não está mais ativa.')
  })

  it('maps an identity rejection from the database error text', async () => {
    const restore = stub(pickupEventRepository, {
      cancel: async () => ({
        data: null,
        error: { code: '23514', message: 'pickup event identity fields are immutable' }
      })
    })

    const result = await pickupService.cancelCall('event-1')
    restore()

    assert.equal(result.data, null)
    assert.equal(result.error.message, 'A escola, a matrícula, o portão e o horário da chamada não podem ser alterados.')
  })

  it('maps a state transition rejection from the database error text', async () => {
    const restore = stub(pickupEventRepository, {
      cancel: async () => ({
        data: null,
        error: { code: '23514', message: 'pickup event status can only transition from called to completed or cancelled' }
      })
    })

    const result = await pickupService.cancelCall('event-1')
    restore()

    assert.equal(result.data, null)
    assert.equal(result.error.message, 'Esta chamada já foi confirmada ou não está mais ativa.')
  })
})

describe('pickup_events insert and transition state machine', () => {
  const sql = readFileSync(
    new URL('../../supabase/migrations/20261003220000_pickup_events_allow_cancellation.sql', import.meta.url),
    'utf8'
  )

  it('rejects an insert that is not called and allows called to completed or cancelled', () => {
    assert.match(sql, /tg_op = 'INSERT' and new\.status is distinct from 'called'/)
    assert.match(sql, /pickup event insert must start as called/)
    assert.match(sql, /old\.status = 'called' and new\.status in \('completed', 'cancelled'\)/)
    assert.match(sql, /pickup event status can only transition from called to completed or cancelled/)
    assert.match(sql, /new\.completed_at := now\(\)/)
    assert.match(sql, /new\.cancelled_at := now\(\)/)
    assert.match(sql, /new\.updated_at := now\(\)/)
    assert.match(sql, /pickup_events_share_school/)
    assert.match(sql, /grant execute on function public\.enforce_pickup_event_coherence\(\) to authenticated/)
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

describe('subscribeActiveCalls (Realtime)', () => {
  let restoreSupabase
  let restoreService
  let channelCalls = []
  let onCalls = []
  let subscribeCalls = []
  let removeChannelCalls = []
  let mockChannel

  beforeEach(() => {
    channelCalls = []
    onCalls = []
    subscribeCalls = []
    removeChannelCalls = []

    mockChannel = {
      on: (event, config, callback) => {
        onCalls.push({ event, config, callback })
        return mockChannel
      },
      subscribe: (callback) => {
        subscribeCalls.push(callback)
        setTimeout(() => callback('SUBSCRIBED'), 10)
        return mockChannel
      },
      unsubscribe: () => Promise.resolve('ok')
    }

    restoreSupabase = stub(supabase, {
      channel: (name) => {
        channelCalls.push(name)
        return mockChannel
      },
      removeChannel: async (ch) => {
        removeChannelCalls.push(ch)
      }
    })

    restoreService = stub(pickupService, {
      getActiveCallsBySchool: async (schoolId) => ({
        data: [{ id: 'call-1', school_id: schoolId }],
        error: null
      })
    })
  })

  afterEach(() => {
    if (restoreSupabase) restoreSupabase()
    if (restoreService) restoreService()
  })

  it('deve criar canal Realtime com filtro de school_id', async () => {
    const schoolId = 'school-123'
    const onResult = () => {}
    const unsubscribe = pickupService.subscribeActiveCalls(schoolId, onResult)

    await new Promise((resolve) => setTimeout(resolve, 50))

    assert.equal(channelCalls.length, 1)
    assert.equal(channelCalls[0], `pickup_events:${schoolId}`)
    assert.equal(onCalls.length, 1)
    assert.equal(onCalls[0].event, 'postgres_changes')
    assert.deepEqual(onCalls[0].config, {
      event: '*',
      schema: 'public',
      table: 'pickup_events',
      filter: `school_id=eq.${schoolId}`
    })
    assert.equal(typeof onCalls[0].callback, 'function')

    unsubscribe()
    await new Promise((resolve) => setTimeout(resolve, 30))
  })

  it('deve chamar onResult após receber evento Realtime', async () => {
    const schoolId = 'school-123'
    const resultCalls = []
    const onResult = (data) => resultCalls.push(data)
    const unsubscribe = pickupService.subscribeActiveCalls(schoolId, onResult, { debounceMs: 20 })

    await new Promise((resolve) => setTimeout(resolve, 50))

    // Simular evento Realtime
    assert.ok(onCalls.length > 0)
    const payloadHandler = onCalls[0].callback
    payloadHandler({ eventType: 'INSERT', new: { id: 'event-1', school_id: schoolId } })

    await new Promise((resolve) => setTimeout(resolve, 100)) // Aguardar debounce

    assert.ok(resultCalls.length >= 1)

    unsubscribe()
    await new Promise((resolve) => setTimeout(resolve, 30))
  })

  it('deve ativar fallback polling se WebSocket desconectar', async () => {
    const schoolId = 'school-123'
    const onResult = () => {}
    const statusCalls = []
    const onStatusChange = (status) => statusCalls.push(status)
    const unsubscribe = pickupService.subscribeActiveCalls(schoolId, onResult, { onStatusChange })

    await new Promise((resolve) => setTimeout(resolve, 50))

    // Simular erro de conexão
    assert.ok(subscribeCalls.length > 0)
    const statusCallback = subscribeCalls[0]
    statusCallback('CHANNEL_ERROR')

    assert.ok(statusCalls.includes('fallback'))

    unsubscribe()
    await new Promise((resolve) => setTimeout(resolve, 30))
  })

  it('deve limpar canal e timers ao desmontar', async () => {
    const schoolId = 'school-123'
    const onResult = () => {}
    const unsubscribe = pickupService.subscribeActiveCalls(schoolId, onResult)

    await new Promise((resolve) => setTimeout(resolve, 50))

    unsubscribe()

    await new Promise((resolve) => setTimeout(resolve, 50))

    assert.equal(removeChannelCalls.length, 1)
    assert.equal(removeChannelCalls[0], mockChannel)
  })
})

function makeHistoryRow(overrides = {}) {
  return {
    id: 'evt-1',
    school_id: SCHOOL_ID,
    student_enrollment_id: 'enr-1',
    gate_id: 'gate-1',
    status: 'completed',
    called_at: '2026-10-22T10:00:00.000Z',
    completed_at: '2026-10-22T10:02:30.000Z',
    cancelled_at: null,
    created_at: '2026-10-22T10:00:00.000Z',
    updated_at: '2026-10-22T10:02:30.000Z',
    gates: { id: 'gate-1', name: 'Portão Principal' },
    student_enrollments: {
      id: 'enr-1',
      student_id: 'std-1',
      student_identifier: 'MAT-101',
      students: { id: 'std-1', full_name: 'Lucas Pereira' },
      student_group_assignments: [
        {
          status: 'active',
          academic_group_id: 'grp-1',
          academic_groups: { id: 'grp-1', name: '5º Ano A' }
        }
      ]
    },
    ...overrides
  }
}

describe('P1 Exit History Repository (pickupEventRepository.listHistoryBySchool)', () => {
  it('returns error when schoolId is missing', async () => {
    const res = await pickupEventRepository.listHistoryBySchool({})
    assert.equal(res.data.length, 0)
    assert.equal(res.error.message, 'Escola autorizada ausente.')

    const countRes = await pickupEventRepository.countHistoryBySchool({})
    assert.equal(countRes.count, 0)
    assert.equal(countRes.error.message, 'Escola autorizada ausente.')
  })

  it('filters by schoolId and excludes called status events', async () => {
    let queriedTables = []
    let statusFilterApplied = null
    let schoolIdFilter = null

    const restore = stub(supabase, {
      from: (table) => {
        queriedTables.push(table)
        const chain = {
          select: () => chain,
          eq: (col, val) => {
            if (col === 'school_id') schoolIdFilter = val
            return chain
          },
          in: (col, val) => {
            if (col === 'status') statusFilterApplied = val
            return chain
          },
          gte: () => chain,
          lte: () => chain,
          order: () => chain,
          range: () => chain,
          then: (resolve) => resolve({ data: [makeHistoryRow()], error: null })
        }
        return chain
      }
    })

    const res = await pickupEventRepository.listHistoryBySchool({
      schoolId: SCHOOL_ID,
      from: '2026-10-22T00:00:00.000Z', // Recent date (< 30 days)
      to: '2026-10-22T23:59:59.999Z'
    })
    restore()

    assert.equal(res.error, null)
    assert.equal(schoolIdFilter, SCHOOL_ID)
    assert.deepEqual(statusFilterApplied, ['completed', 'cancelled'])
    assert.equal(queriedTables.includes('pickup_events'), true)
    // Recent query should not query archive
    assert.equal(queriedTables.includes('pickup_events_archive'), false)
  })

  it('queries both pickup_events and pickup_events_archive when date range includes older than 30 days', async () => {
    let queriedTables = []

    const restore = stub(supabase, {
      from: (table) => {
        queriedTables.push(table)
        const chain = {
          select: () => chain,
          eq: () => chain,
          in: () => chain,
          gte: () => chain,
          lte: () => chain,
          order: () => chain,
          range: () => chain,
          then: (resolve) => {
            if (table === 'pickup_events') {
              return resolve({ data: [makeHistoryRow({ id: 'recent-1' })], error: null })
            }
            return resolve({ data: [makeHistoryRow({ id: 'archived-1', completed_at: '2026-08-01T10:00:00.000Z' })], error: null })
          }
        }
        return chain
      }
    })

    const res = await pickupEventRepository.listHistoryBySchool({
      schoolId: SCHOOL_ID,
      from: '2026-07-01T00:00:00.000Z' // 3+ months ago
    })
    restore()

    assert.equal(res.error, null)
    assert.equal(queriedTables.includes('pickup_events'), true)
    assert.equal(queriedTables.includes('pickup_events_archive'), true)
    assert.equal(res.data.length, 2)
  })

  it('countHistoryBySchool aggregates total count across queried tables', async () => {
    const restore = stub(supabase, {
      from: (table) => {
        const chain = {
          select: () => chain,
          eq: () => chain,
          in: () => chain,
          gte: () => chain,
          lte: () => chain,
          then: (resolve) => {
            if (table === 'pickup_events') return resolve({ count: 15, error: null })
            return resolve({ count: 35, error: null })
          }
        }
        return chain
      }
    })

    const res = await pickupEventRepository.countHistoryBySchool({
      schoolId: SCHOOL_ID,
      from: '2026-06-01T00:00:00.000Z'
    })
    restore()

    assert.equal(res.error, null)
    assert.equal(res.count, 50)
  })
})

describe('P1 Exit History Service (pickupService.getExitHistory)', () => {
  it('maps raw rows to normalized UI exit events and calculates wait time', async () => {
    const mockRow = makeHistoryRow({
      called_at: '2026-10-22T14:00:00.000Z',
      completed_at: '2026-10-22T14:03:45.000Z'
    })

    const restore = stub(pickupEventRepository, {
      listHistoryBySchool: async () => ({ data: [mockRow], error: null }),
      countHistoryBySchool: async () => ({ count: 1, error: null })
    })

    const res = await pickupService.getExitHistory({ schoolId: SCHOOL_ID })
    restore()

    assert.equal(res.error, null)
    assert.equal(res.total, 1)
    assert.equal(res.data.length, 1)

    const item = res.data[0]
    assert.equal(item.studentName, 'Lucas Pereira')
    assert.equal(item.studentIdentifier, 'MAT-101')
    assert.equal(item.groupName, '5º Ano A')
    assert.equal(item.gateName, 'Portão Principal')
    assert.equal(item.status, 'completed')
    assert.equal(item.waitTimeSeconds, 225) // 3 min 45 s
    assert.equal(item.waitTimeFormatted, '3 min 45 s')
  })

  it('filters results by search string matching student name or identifier', async () => {
    const rows = [
      makeHistoryRow({ id: '1', student_enrollments: { student_identifier: 'A1', students: { full_name: 'Beatriz Lima' }, student_group_assignments: [] } }),
      makeHistoryRow({ id: '2', student_enrollments: { student_identifier: 'B2', students: { full_name: 'Carlos Silva' }, student_group_assignments: [] } })
    ]

    const restore = stub(pickupEventRepository, {
      listHistoryBySchool: async () => ({ data: rows, error: null }),
      countHistoryBySchool: async () => ({ count: 2, error: null })
    })

    const searchByName = await pickupService.getExitHistory({ schoolId: SCHOOL_ID, search: 'beatriz' })
    assert.equal(searchByName.data.length, 1)
    assert.equal(searchByName.data[0].studentName, 'Beatriz Lima')

    const searchById = await pickupService.getExitHistory({ schoolId: SCHOOL_ID, search: 'B2' })
    assert.equal(searchById.data.length, 1)
    assert.equal(searchById.data[0].studentName, 'Carlos Silva')

    restore()
  })

  it('filters results by groupId matching active group', async () => {
    const rows = [
      makeHistoryRow({
        id: '1',
        student_enrollments: {
          students: { full_name: 'Aluno 1' },
          student_group_assignments: [{ status: 'active', academic_group_id: 'grp-alpha', academic_groups: { name: 'Alpha' } }]
        }
      }),
      makeHistoryRow({
        id: '2',
        student_enrollments: {
          students: { full_name: 'Aluno 2' },
          student_group_assignments: [{ status: 'active', academic_group_id: 'grp-beta', academic_groups: { name: 'Beta' } }]
        }
      })
    ]

    const restore = stub(pickupEventRepository, {
      listHistoryBySchool: async () => ({ data: rows, error: null }),
      countHistoryBySchool: async () => ({ count: 2, error: null })
    })

    const res = await pickupService.getExitHistory({ schoolId: SCHOOL_ID, groupId: 'grp-beta' })
    restore()

    assert.equal(res.data.length, 1)
    assert.equal(res.data[0].groupName, 'Beta')
  })

  it('supports pagination with limit and offset', async () => {
    const rows = Array.from({ length: 10 }, (_, i) => makeHistoryRow({ id: `evt-${i}` }))

    const restore = stub(pickupEventRepository, {
      listHistoryBySchool: async ({ limit = 25, offset = 0 } = {}) => ({
        data: rows.slice(offset, offset + limit),
        error: null
      }),
      countHistoryBySchool: async () => ({ count: 10, error: null })
    })

    const page1 = await pickupService.getExitHistory({ schoolId: SCHOOL_ID, limit: 3, offset: 0 })
    assert.equal(page1.data.length, 3)
    assert.equal(page1.data[0].id, 'evt-0')

    const page2 = await pickupService.getExitHistory({ schoolId: SCHOOL_ID, limit: 3, offset: 3 })
    assert.equal(page2.data.length, 3)
    assert.equal(page2.data[0].id, 'evt-3')

    restore()
  })
})

describe('P1 Exit Metrics Service (pickupService.getExitMetrics)', () => {
  it('computes totals, cancellation rate, average wait time and breakdown by gate and group', async () => {
    const rows = [
      makeHistoryRow({
        id: '1',
        status: 'completed',
        called_at: '2026-10-22T10:00:00.000Z',
        completed_at: '2026-10-22T10:01:00.000Z', // 60s
        gates: { name: 'Portão Leste' },
        student_enrollments: {
          students: { full_name: 'A' },
          student_group_assignments: [{ status: 'active', academic_groups: { name: '1º Ano' } }]
        }
      }),
      makeHistoryRow({
        id: '2',
        status: 'completed',
        called_at: '2026-10-22T10:00:00.000Z',
        completed_at: '2026-10-22T10:03:00.000Z', // 180s
        gates: { name: 'Portão Leste' },
        student_enrollments: {
          students: { full_name: 'B' },
          student_group_assignments: [{ status: 'active', academic_groups: { name: '2º Ano' } }]
        }
      }),
      makeHistoryRow({
        id: '3',
        status: 'cancelled',
        called_at: '2026-10-22T10:00:00.000Z',
        cancelled_at: '2026-10-22T10:02:00.000Z',
        gates: { name: 'Portão Oeste' },
        student_enrollments: {
          students: { full_name: 'C' },
          student_group_assignments: [{ status: 'active', academic_groups: { name: '1º Ano' } }]
        }
      })
    ]

    const restore = stub(pickupEventRepository, {
      listHistoryBySchool: async () => ({ data: rows, error: null })
    })

    const res = await pickupService.getExitMetrics({ schoolId: SCHOOL_ID })
    restore()

    assert.equal(res.error, null)
    const m = res.data
    assert.equal(m.total, 3)
    assert.equal(m.completed, 2)
    assert.equal(m.cancelled, 1)
    assert.equal(m.cancellationRate, '33.3%')
    assert.equal(m.averageWaitTimeSeconds, 120) // (60 + 180) / 2 = 120
    assert.equal(m.averageWaitTimeFormatted, '2 min')
    assert.equal(m.byGate['Portão Leste'], 2)
    assert.equal(m.byGate['Portão Oeste'], 1)
    assert.equal(m.byGroup['1º Ano'], 2)
    assert.equal(m.byGroup['2º Ano'], 1)
  })

  it('handles zero events gracefully', async () => {
    const restore = stub(pickupEventRepository, {
      listHistoryBySchool: async () => ({ data: [], error: null })
    })

    const res = await pickupService.getExitMetrics({ schoolId: SCHOOL_ID })
    restore()

    assert.equal(res.error, null)
    assert.equal(res.data.total, 0)
    assert.equal(res.data.completed, 0)
    assert.equal(res.data.cancelled, 0)
    assert.equal(res.data.cancellationRate, '0.0%')
    assert.equal(res.data.averageWaitTimeSeconds, 0)
    assert.equal(res.data.averageWaitTimeFormatted, '0 s')
    assert.equal(res.data.byGate.length, 0)
    assert.equal(res.data.byGroup.length, 0)
  })
})

describe('P1 Exit History CSV Export (buildExitHistoryCsv)', () => {
  it('formats rows with UTF-8 BOM, semicolon separator and proper headers', () => {
    const rows = [
      {
        id: 'evt-1',
        studentName: 'Ana Souza',
        studentIdentifier: '2026-001',
        groupName: '5º Ano A',
        gateName: 'Portão Norte',
        status: 'completed',
        dateFormatted: '22/10/2026',
        calledTime: '14:00',
        closedTime: '14:03',
        waitTimeFormatted: '3 min'
      },
      {
        id: 'evt-2',
        studentName: 'Bruno Costa',
        studentIdentifier: '',
        groupName: '6º Ano B',
        gateName: 'Portão Sul',
        status: 'cancelled',
        dateFormatted: '22/10/2026',
        calledTime: '14:10',
        closedTime: '14:12',
        waitTimeFormatted: '2 min'
      }
    ]

    const csv = buildExitHistoryCsv(rows)

    assert.equal(csv.startsWith('\uFEFF'), true, 'Must start with UTF-8 BOM')
    const lines = csv.slice(1).trim().split('\r\n')
    assert.equal(lines.length, 3)

    assert.equal(
      lines[0],
      '"Data";"Horário Chamada";"Horário Saída/Cancelamento";"Tempo de Espera";"Aluno";"Matrícula";"Turma";"Portão";"Status"'
    )
    assert.match(
      lines[1],
      /"22\/10\/2026";"14:00";"14:03";"3 min";"Ana Souza";"2026-001";"5º Ano A";"Portão Norte";"Concluída"/
    )
    assert.match(
      lines[2],
      /"22\/10\/2026";"14:10";"14:12";"2 min";"Bruno Costa";"-";"6º Ano B";"Portão Sul";"Cancelada"/
    )
  })

  it('escapes quotes, semicolons and newlines properly in values', () => {
    const rows = [
      {
        id: 'evt-special',
        studentName: 'José "Zezinho"; Silva',
        studentIdentifier: '',
        groupName: 'Turma\nA',
        gateName: 'Portão Principal',
        status: 'completed',
        dateFormatted: '22/10/2026',
        calledTime: '15:00',
        closedTime: '15:05',
        waitTimeFormatted: '5 min'
      }
    ]

    const csv = buildExitHistoryCsv(rows)
    assert.match(csv, /"José ""Zezinho""; Silva"/)
  })

  it('enforces maximum export cap of 2000 rows', () => {
    assert.equal(MAX_CSV_EXPORT_ROWS, 2000)
    const largeDataset = Array.from({ length: 2500 }, (_, i) => ({
      id: `id-${i}`,
      studentName: `Aluno ${i}`,
      status: 'completed'
    }))

    const csv = buildExitHistoryCsv(largeDataset)
    const dataLines = csv.slice(1).trim().split('\r\n').slice(1) // Drop header
    assert.equal(dataLines.length, 2000)
  })

  it('formatWaitTime handles various duration boundaries', () => {
    assert.equal(formatWaitTime(0), '0 s')
    assert.equal(formatWaitTime(30), '30 s')
    assert.equal(formatWaitTime(60), '1 min')
    assert.equal(formatWaitTime(75), '1 min 15 s')
    assert.equal(formatWaitTime(3600), '60 min')
    assert.equal(formatWaitTime(3690), '61 min 30 s')
    assert.equal(formatWaitTime(null), '-')
    assert.equal(formatWaitTime(undefined), '-')
  })
})


