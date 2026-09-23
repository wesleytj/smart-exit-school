const UI_PLANS = {
  pro: 'Premium',
  premium: 'Premium',
  enterprise: 'Diamond',
  diamond: 'Diamond'
}

const BLOCKED_OPERATIONAL_FIELDS = new Set([
  'email',
  'password',
  'id',
  'name',
  'slug',
  'status',
  'plan',
  'accountEmail',
  'primary_color',
  'secondary_color',
  'logo_url',
  'locale'
])

export function toUiPlan(plan) {
  const normalized = String(plan || '').toLowerCase()
  return UI_PLANS[normalized] || 'Basic'
}

function activeSchoolIds(memberships) {
  const ids = []

  for (const membership of memberships || []) {
    if (membership?.status !== 'active' || !membership.school_id) {
      continue
    }

    if (!ids.includes(membership.school_id)) {
      ids.push(membership.school_id)
    }
  }

  return ids
}

export function resolveTenantAccess({ memberships, schools, selectedSchoolId }) {
  const allowedIds = new Set(activeSchoolIds(memberships))
  const schoolsById = new Map(
    (schools || [])
      .filter((school) => school?.id && allowedIds.has(school.id))
      .map((school) => [school.id, school])
  )
  const orderedSchools = activeSchoolIds(memberships)
    .map((schoolId) => schoolsById.get(schoolId))
    .filter(Boolean)

  if (orderedSchools.length === 0) {
    return { status: 'none', school: null, schools: [] }
  }

  if (orderedSchools.length === 1) {
    return { status: 'ready', school: orderedSchools[0], schools: orderedSchools }
  }

  const chosen = orderedSchools.find((school) => school.id === selectedSchoolId)

  if (!chosen) {
    return { status: 'selection', school: null, schools: orderedSchools }
  }

  return { status: 'ready', school: chosen, schools: orderedSchools }
}

export function resolveTenantPanelAccess({ isPlatformAdmin, tenantStatus }) {
  if (isPlatformAdmin) {
    return {
      view: 'platform',
      destination: '/admin/institutions',
      signOut: false,
      message: ''
    }
  }

  if (tenantStatus === 'anonymous') {
    return { view: 'login', destination: '/login', signOut: false, message: '' }
  }

  if (tenantStatus === 'none') {
    return {
      view: 'login',
      destination: '/login',
      signOut: true,
      message: 'Esta conta não possui vínculo ativo com uma escola.'
    }
  }

  if (tenantStatus === 'selection') {
    return { view: 'selection', destination: '', signOut: false, message: '' }
  }

  if (tenantStatus === 'ready') {
    return { view: 'panel', destination: '', signOut: false, message: '' }
  }

  return {
    view: 'login',
    destination: '/login',
    signOut: false,
    message: 'Não foi possível confirmar o vínculo com a escola.'
  }
}

export function decidePostLogin({ isPlatformAdmin, tenantStatus }) {
  if (isPlatformAdmin) {
    return { destination: '/admin/institutions', signOut: false, message: '' }
  }

  if (tenantStatus === 'ready' || tenantStatus === 'selection') {
    return { destination: '/painel', signOut: false, message: '' }
  }

  if (tenantStatus === 'none') {
    return {
      destination: '/login',
      signOut: true,
      message: 'Esta conta não possui vínculo ativo com uma escola.'
    }
  }

  return {
    destination: '/login',
    signOut: false,
    message: 'Não foi possível confirmar o vínculo com a escola.'
  }
}

export function pickOperationalState(schoolState) {
  const operationalState = {}

  for (const [key, value] of Object.entries(schoolState || {})) {
    if (!BLOCKED_OPERATIONAL_FIELDS.has(key)) {
      operationalState[key] = value
    }
  }

  return operationalState
}

export function toPanelSchool(authorizedSchool, operationalState, accountEmail) {
  const operational = pickOperationalState(operationalState)

  return {
    ...operational,
    id: authorizedSchool.id,
    name: authorizedSchool.name,
    slug: authorizedSchool.slug,
    status: authorizedSchool.status,
    plan: toUiPlan(authorizedSchool.plan),
    accountEmail: accountEmail || '',
    primaryColor: operational.primaryColor || authorizedSchool.primary_color || '#f97316',
    secondaryColor: operational.secondaryColor || authorizedSchool.secondary_color || '#3b82f6',
    customLogo: operational.customLogo ?? authorizedSchool.logo_url ?? null,
    studentsList: Array.isArray(operational.studentsList) ? operational.studentsList : [],
    classes: Array.isArray(operational.classes) ? operational.classes : [],
    exits: Array.isArray(operational.exits) ? operational.exits : [],
    email: undefined,
    password: undefined
  }
}
