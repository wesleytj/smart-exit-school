import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  decidePostLogin,
  isSchoolActive,
  pickOperationalState,
  resolveTenantAccess,
  resolveTenantPanelAccess,
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

  it('allows access to an active school (regression)', () => {
    const activeSchool = { id: 'school-act', name: 'Escola Ativa', status: 'active' }
    const decision = resolveTenantAccess({
      memberships: [{ school_id: 'school-act', status: 'active' }],
      schools: [activeSchool]
    })

    assert.equal(decision.status, 'ready')
    assert.equal(decision.school.id, 'school-act')
  })

  it('blocks access and returns inactive_school when the only authorized school is inactive', () => {
    const inactiveSchool = { id: 'school-inact', name: 'Escola Inativa', status: 'inactive' }
    const decision = resolveTenantAccess({
      memberships: [{ school_id: 'school-inact', status: 'active' }],
      schools: [inactiveSchool]
    })

    assert.equal(decision.status, 'inactive_school')
    assert.equal(decision.school, null)
    assert.deepEqual(decision.schools, [])
  })

  it('blocks access and returns inactive_school when the authorized school is suspended', () => {
    const suspendedSchool = { id: 'school-susp', name: 'Escola Suspensa', status: 'suspended' }
    const decision = resolveTenantAccess({
      memberships: [{ school_id: 'school-susp', status: 'active' }],
      schools: [suspendedSchool]
    })

    assert.equal(decision.status, 'inactive_school')
    assert.equal(decision.school, null)
  })

  it('filters out inactive schools and selects only the active school when multiple memberships exist', () => {
    const activeSchool = { id: 'school-act', name: 'Escola Ativa', status: 'active' }
    const inactiveSchool = { id: 'school-inact', name: 'Escola Inativa', status: 'inactive' }

    const decision = resolveTenantAccess({
      memberships: [
        { school_id: 'school-act', status: 'active' },
        { school_id: 'school-inact', status: 'active' }
      ],
      schools: [activeSchool, inactiveSchool]
    })

    assert.equal(decision.status, 'ready')
    assert.equal(decision.school.id, 'school-act')
    assert.deepEqual(decision.schools.map((s) => s.id), ['school-act'])
  })

  it('returns inactive_school when all authorized schools are inactive', () => {
    const inactive1 = { id: 'school-1', name: 'Escola 1', status: 'inactive' }
    const inactive2 = { id: 'school-2', name: 'Escola 2', status: 'suspended' }

    const decision = resolveTenantAccess({
      memberships: [
        { school_id: 'school-1', status: 'active' },
        { school_id: 'school-2', status: 'active' }
      ],
      schools: [inactive1, inactive2]
    })

    assert.equal(decision.status, 'inactive_school')
    assert.equal(decision.school, null)
    assert.deepEqual(decision.schools, [])
  })

  it('allows access to an inactive school during impersonation session (Alternativa A)', () => {
    const inactiveSchool = { id: 'school-inact', name: 'Escola Inativa', status: 'inactive' }
    const decision = resolveTenantAccess({
      memberships: [{ school_id: 'school-inact', status: 'active' }],
      schools: [inactiveSchool],
      isImpersonating: true
    })

    assert.equal(decision.status, 'ready')
    assert.equal(decision.school.id, 'school-inact')
  })
})

describe('decidePostLogin', () => {
  it('keeps platform admin on the platform route even without membership', () => {
    const decision = decidePostLogin({ isPlatformAdmin: true, tenantStatus: 'none' })

    assert.equal(decision.destination, '/admin/institutions')
    assert.equal(decision.signOut, false)
  })

  it('does not send a platform admin to the tenant panel when memberships exist', () => {
    for (const tenantStatus of ['ready', 'selection']) {
      const decision = decidePostLogin({ isPlatformAdmin: true, tenantStatus })
      assert.equal(decision.destination, '/admin/institutions')
      assert.equal(decision.signOut, false)
    }
  })

  it('signs out an authenticated user with no active membership', () => {
    const decision = decidePostLogin({ isPlatformAdmin: false, tenantStatus: 'none' })

    assert.equal(decision.signOut, true)
    assert.equal(decision.destination, '/login')
    assert.match(decision.message, /vínculo ativo/)
  })

  it('signs out an authenticated user whose school is inactive with informative message', () => {
    const decision = decidePostLogin({ isPlatformAdmin: false, tenantStatus: 'inactive_school' })

    assert.equal(decision.signOut, true)
    assert.equal(decision.destination, '/login')
    assert.match(decision.message, /inativa/)
  })

  it('sends a single-school user and a multi-school user to the panel without signing out', () => {
    for (const tenantStatus of ['ready', 'selection']) {
      const decision = decidePostLogin({ isPlatformAdmin: false, tenantStatus })
      assert.equal(decision.destination, '/painel')
      assert.equal(decision.signOut, false)
    }
  })
})

describe('resolveTenantPanelAccess', () => {
  it('keeps platform admin out of the tenant panel even when membership is ready', () => {
    for (const tenantStatus of ['ready', 'selection', 'none', 'error', 'inactive_school']) {
      const decision = resolveTenantPanelAccess({ isPlatformAdmin: true, tenantStatus })

      assert.equal(decision.view, 'platform')
      assert.equal(decision.destination, '/admin/institutions')
      assert.equal(decision.signOut, false)
    }
  })

  it('signs out user from tenant panel when school is inactive', () => {
    const decision = resolveTenantPanelAccess({ isPlatformAdmin: false, tenantStatus: 'inactive_school' })

    assert.equal(decision.view, 'login')
    assert.equal(decision.destination, '/login')
    assert.equal(decision.signOut, true)
    assert.match(decision.message, /inativa/)
  })

  it('does not grant platform authority from tenant status', () => {
    const readyTenant = resolveTenantPanelAccess({ isPlatformAdmin: false, tenantStatus: 'ready' })
    const selectedTenant = resolveTenantPanelAccess({ isPlatformAdmin: false, tenantStatus: 'selection' })
    const noMembership = resolveTenantPanelAccess({ isPlatformAdmin: false, tenantStatus: 'none' })

    assert.equal(readyTenant.view, 'panel')
    assert.equal(selectedTenant.view, 'selection')
    assert.equal(noMembership.view, 'login')
    assert.notEqual(readyTenant.view, 'platform')
    assert.notEqual(selectedTenant.view, 'platform')
    assert.notEqual(noMembership.view, 'platform')
  })

  it('does not treat a client school id as platform or tenant authority', () => {
    const decision = resolveTenantPanelAccess({
      isPlatformAdmin: false,
      tenantStatus: 'none',
      localSchoolId: 'school-a'
    })

    assert.equal(decision.view, 'login')
    assert.equal(decision.signOut, true)
    assert.notEqual(decision.view, 'platform')
    assert.notEqual(decision.view, 'panel')
  })
})

describe('isSchoolActive', () => {
  it('identifies active, trial, and default statuses as active', () => {
    assert.equal(isSchoolActive({ status: 'active' }), true)
    assert.equal(isSchoolActive({ status: 'ACTIVE' }), true)
    assert.equal(isSchoolActive({ status: 'ativo' }), true)
    assert.equal(isSchoolActive({ status: 'trial' }), true)
    assert.equal(isSchoolActive({}), true)
    assert.equal(isSchoolActive(null), true)
  })

  it('identifies inactive and suspended statuses as inactive', () => {
    assert.equal(isSchoolActive({ status: 'inactive' }), false)
    assert.equal(isSchoolActive({ status: 'INACTIVE' }), false)
    assert.equal(isSchoolActive({ status: 'inativo' }), false)
    assert.equal(isSchoolActive({ status: 'suspended' }), false)
    assert.equal(isSchoolActive({ status: 'suspenso' }), false)
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
