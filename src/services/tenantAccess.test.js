import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  decidePostLogin,
  pickOperationalState,
  resolveTenantAccess,
  toPanelSchool
} from './tenantAccess.js'

const schoolA = { id: 'school-a', name: 'Escola A', plan: 'basic', slug: 'escola-a' }
const schoolB = { id: 'school-b', name: 'Escola B', plan: 'pro', slug: 'escola-b' }

describe('resolveTenantAccess', () => {
  it('returns none when there is no active membership', () => {
    const decision = resolveTenantAccess({
      memberships: [{ school_id: 'school-a', status: 'inactive' }],
      schools: [schoolA],
      selectedSchoolId: 'school-a'
    })

    assert.equal(decision.status, 'none')
    assert.equal(decision.school, null)
  })

  it('resolves the only active school without a client-selected id', () => {
    const decision = resolveTenantAccess({
      memberships: [{ school_id: 'school-a', status: 'active' }],
      schools: [schoolA],
      selectedSchoolId: null
    })

    assert.equal(decision.status, 'ready')
    assert.equal(decision.school.id, 'school-a')
  })

  it('does not accept a school that membership did not authorize', () => {
    const decision = resolveTenantAccess({
      memberships: [{ school_id: 'school-a', status: 'active' }],
      schools: [schoolA, schoolB],
      selectedSchoolId: 'school-b'
    })

    assert.equal(decision.status, 'ready')
    assert.equal(decision.school.id, 'school-a')
  })

  it('asks for an explicit choice when several memberships are active', () => {
    const decision = resolveTenantAccess({
      memberships: [
        { school_id: 'school-a', status: 'active' },
        { school_id: 'school-b', status: 'active' }
      ],
      schools: [schoolA, schoolB],
      selectedSchoolId: null
    })

    assert.equal(decision.status, 'selection')
    assert.equal(decision.school, null)
    assert.deepEqual(decision.schools.map((school) => school.id), ['school-a', 'school-b'])
  })

  it('rejects a school id that is not in the authorized list', () => {
    const decision = resolveTenantAccess({
      memberships: [
        { school_id: 'school-a', status: 'active' },
        { school_id: 'school-b', status: 'active' }
      ],
      schools: [schoolA, schoolB],
      selectedSchoolId: 'school-forged'
    })

    assert.equal(decision.status, 'selection')
    assert.equal(decision.school, null)
  })

  it('accepts an explicit choice that matches an authorized school', () => {
    const decision = resolveTenantAccess({
      memberships: [
        { school_id: 'school-a', status: 'active' },
        { school_id: 'school-b', status: 'active' }
      ],
      schools: [schoolA, schoolB],
      selectedSchoolId: 'school-b'
    })

    assert.equal(decision.status, 'ready')
    assert.equal(decision.school.id, 'school-b')
  })
})

describe('decidePostLogin', () => {
  it('keeps platform admin on the platform route even without membership', () => {
    const decision = decidePostLogin({ isPlatformAdmin: true, tenantStatus: 'none' })

    assert.equal(decision.destination, '/admin/institutions')
    assert.equal(decision.signOut, false)
  })

  it('signs out an authenticated user with no active membership', () => {
    const decision = decidePostLogin({ isPlatformAdmin: false, tenantStatus: 'none' })

    assert.equal(decision.signOut, true)
    assert.equal(decision.destination, '/login')
    assert.match(decision.message, /vínculo ativo/)
  })

  it('sends a single-school user and a multi-school user to the panel without signing out', () => {
    for (const tenantStatus of ['ready', 'selection']) {
      const decision = decidePostLogin({ isPlatformAdmin: false, tenantStatus })
      assert.equal(decision.destination, '/painel')
      assert.equal(decision.signOut, false)
    }
  })
})

describe('toPanelSchool', () => {
  it('uses the authorized school id and drops password material from local operational state', () => {
    const view = toPanelSchool(
      schoolA,
      {
        id: 'forged-school',
        email: 'escola@example.com',
        password: 'secret',
        studentsList: [{ id: 1, name: 'Ana' }],
        primaryColor: '#111111'
      },
      'pessoa@example.com'
    )

    assert.equal(view.id, 'school-a')
    assert.equal(view.name, 'Escola A')
    assert.equal(view.accountEmail, 'pessoa@example.com')
    assert.equal(view.password, undefined)
    assert.equal(view.email, undefined)
    assert.equal(view.studentsList.length, 1)
    assert.equal(view.primaryColor, '#111111')
    assert.deepEqual(pickOperationalState(view).password, undefined)
    assert.equal(pickOperationalState(view).id, undefined)
  })
})
