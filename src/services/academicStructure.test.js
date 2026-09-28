import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { academicLevelRepository } from '../repositories/academicLevelRepository.js'
import { academicLevelService, mapAcademicLevelError } from './academicLevelService.js'
import { academicGroupRepository } from '../repositories/academicGroupRepository.js'
import { academicLevelRepository as levelRepositoryForGroups } from '../repositories/academicLevelRepository.js'
import { academicShiftRepository } from '../repositories/academicShiftRepository.js'
import { academicGroupService, mapAcademicGroupError } from './academicGroupService.js'

const SCHOOL_ID = '76f29d9f-c6fd-4561-89f8-403fef0ccb40'
const OTHER_SCHOOL_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

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

describe('academicLevelService', { concurrency: 1 }, () => {
  it('lists levels for the authorized school', async () => {
    const seen = []
    const restore = stub(academicLevelRepository, {
      listBySchool: async (schoolId) => {
        seen.push(schoolId)
        return { data: [{ id: 'level-1', school_id: schoolId, name: 'Fundamental', status: 'active' }], error: null }
      }
    })

    const result = await academicLevelService.listForSchool(SCHOOL_ID)
    restore()

    assert.deepEqual(seen, [SCHOOL_ID])
    assert.equal(result.error, null)
    assert.equal(result.data[0].name, 'Fundamental')
  })

  it('creates a level with the authorized school_id and ignores a school_id from the form', async () => {
    let inserted = null
    const restore = stub(academicLevelRepository, {
      create: async (row) => {
        inserted = row
        return { data: { id: 'level-1', ...row }, error: null }
      }
    })

    const result = await academicLevelService.createLevel(SCHOOL_ID, {
      name: '  Ensino Médio  ',
      school_id: OTHER_SCHOOL_ID,
      existingLevels: [{ display_order: 2 }]
    })
    restore()

    assert.equal(result.error, null)
    assert.equal(inserted.school_id, SCHOOL_ID)
    assert.notEqual(inserted.school_id, OTHER_SCHOOL_ID)
    assert.equal(inserted.name, 'Ensino Médio')
    assert.equal(inserted.display_order, 3)
    assert.equal(inserted.status, 'active')
  })

  it('updates the level name without changing school or display order', async () => {
    let changes = null
    let scopedSchoolId = null
    const restore = stub(academicLevelRepository, {
      update: async (id, schoolId, next) => {
        scopedSchoolId = schoolId
        changes = next
        return { data: { id, school_id: schoolId, ...next }, error: null }
      }
    })

    const result = await academicLevelService.updateLevel(SCHOOL_ID, 'level-1', {
      name: 'Infantil',
      school_id: OTHER_SCHOOL_ID,
      display_order: 99
    })
    restore()

    assert.equal(result.error, null)
    assert.equal(scopedSchoolId, SCHOOL_ID)
    assert.deepEqual(changes, { name: 'Infantil' })
  })

  it('changes level status between active and inactive', async () => {
    const updates = []
    const restore = stub(academicLevelRepository, {
      update: async (id, schoolId, next) => {
        updates.push({ id, schoolId, next })
        return { data: { id, ...next }, error: null }
      }
    })

    const inactivated = await academicLevelService.setLevelStatus(SCHOOL_ID, 'level-1', 'inactive')
    const activated = await academicLevelService.setLevelStatus(SCHOOL_ID, 'level-1', 'active')
    const invalid = await academicLevelService.setLevelStatus(SCHOOL_ID, 'level-1', 'archived')
    restore()

    assert.equal(inactivated.error, null)
    assert.equal(activated.error, null)
    assert.equal(invalid.error.message, 'Status de nível acadêmico inválido.')
    assert.deepEqual(updates.map((item) => item.next.status), ['inactive', 'active'])
    assert.equal(updates[0].schoolId, SCHOOL_ID)
  })

  it('maps a duplicate level name to a friendly message', () => {
    const error = mapAcademicLevelError({
      code: '23505',
      message: 'duplicate key value violates unique constraint "academic_levels_school_name_unique"'
    })

    assert.equal(error.message, 'Já existe um nível acadêmico com esse nome nesta escola.')
  })
})

describe('academicGroupService', { concurrency: 1 }, () => {
  const levelId = 'level-1'
  const shiftId = 'shift-1'

  function allowReferences() {
    return stub(academicLevelRepository, {
      getByIdForSchool: async (id, schoolId) => {
        if (id === levelId && schoolId === SCHOOL_ID) {
          return { data: { id, school_id: schoolId, name: 'Fundamental' }, error: null }
        }

        return { data: null, error: null }
      }
    })
  }

  it('lists groups for the authorized school', async () => {
    const seen = []
    const restore = stub(academicGroupRepository, {
      listBySchool: async (schoolId) => {
        seen.push(schoolId)
        return { data: [{ id: 'group-1', school_id: schoolId, name: 'EF3MA' }], error: null }
      }
    })

    const result = await academicGroupService.listForSchool(SCHOOL_ID)
    restore()

    assert.deepEqual(seen, [SCHOOL_ID])
    assert.equal(result.data[0].name, 'EF3MA')
  })

  it('creates a group with the authorized school_id and the next display order', async () => {
    let inserted = null
    const restoreLevel = allowReferences()
    const restoreShift = stub(academicShiftRepository, {
      getById: async (id) => ({ data: { id, name: 'morning' }, error: null })
    })
    const restoreGroup = stub(academicGroupRepository, {
      create: async (row) => {
        inserted = row
        return { data: { id: 'group-1', ...row }, error: null }
      }
    })

    const result = await academicGroupService.createGroup(SCHOOL_ID, {
      name: ' 5º Ano A ',
      academicLevelId: levelId,
      academicShiftId: shiftId,
      school_id: OTHER_SCHOOL_ID,
      existingGroups: []
    })

    restoreGroup()
    restoreShift()
    restoreLevel()

    assert.equal(result.error, null)
    assert.equal(inserted.school_id, SCHOOL_ID)
    assert.equal(inserted.name, '5º Ano A')
    assert.equal(inserted.academic_level_id, levelId)
    assert.equal(inserted.academic_shift_id, shiftId)
    assert.equal(inserted.display_order, 1)
    assert.equal(inserted.status, 'active')
  })

  it('rejects a level that does not belong to the authorized school', async () => {
    let created = false
    const restoreLevel = stub(levelRepositoryForGroups, {
      getByIdForSchool: async () => ({ data: null, error: null })
    })
    const restoreGroup = stub(academicGroupRepository, {
      create: async () => {
        created = true
        return { data: null, error: null }
      }
    })

    const result = await academicGroupService.createGroup(SCHOOL_ID, {
      name: 'Turma',
      academicLevelId: 'foreign-level',
      academicShiftId: shiftId,
      school_id: OTHER_SCHOOL_ID
    })

    restoreGroup()
    restoreLevel()

    assert.equal(created, false)
    assert.equal(result.error.message, 'O nível acadêmico não pertence a esta escola.')
  })

  it('updates name, level and shift and keeps display order untouched', async () => {
    let changes = null
    const restoreLevel = allowReferences()
    const restoreShift = stub(academicShiftRepository, {
      getById: async (id) => ({ data: id === shiftId ? { id, name: 'afternoon' } : null, error: null })
    })
    const restoreGroup = stub(academicGroupRepository, {
      update: async (id, schoolId, next) => {
        changes = { id, schoolId, next }
        return { data: { id, school_id: schoolId, ...next }, error: null }
      }
    })

    const result = await academicGroupService.updateGroup(SCHOOL_ID, 'group-1', {
      name: 'EF3TA',
      academicLevelId: levelId,
      academicShiftId: shiftId,
      display_order: 40,
      school_id: OTHER_SCHOOL_ID
    })

    restoreGroup()
    restoreShift()
    restoreLevel()

    assert.equal(result.error, null)
    assert.equal(changes.schoolId, SCHOOL_ID)
    assert.deepEqual(changes.next, {
      name: 'EF3TA',
      academic_level_id: levelId,
      academic_shift_id: shiftId
    })
  })

  it('changes group status between active and inactive', async () => {
    const updates = []
    const restore = stub(academicGroupRepository, {
      update: async (id, schoolId, next) => {
        updates.push({ schoolId, next })
        return { data: { id, ...next }, error: null }
      }
    })

    await academicGroupService.setGroupStatus(SCHOOL_ID, 'group-1', 'inactive')
    await academicGroupService.setGroupStatus(SCHOOL_ID, 'group-1', 'active')
    restore()

    assert.deepEqual(updates.map((item) => item.next), [{ status: 'inactive' }, { status: 'active' }])
    assert.equal(updates[0].schoolId, SCHOOL_ID)
  })

  it('maps a duplicate group to a friendly message', () => {
    const error = mapAcademicGroupError({
      code: '23505',
      details: 'Key (school_id, academic_level_id, academic_shift_id, name) already exists.',
      message: 'duplicate key value violates unique constraint "academic_groups_school_level_shift_name_unique"'
    })

    assert.equal(error.message, 'Já existe uma turma com esse nome neste nível e turno.')
  })
})
