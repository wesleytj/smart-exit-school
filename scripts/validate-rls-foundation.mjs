import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// Load environment
// ============================================================

const envLocalPath = path.resolve(process.cwd(), '.env.local')
const envPath = path.resolve(process.cwd(), '.env')

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath })
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
const JWT_SECRET = process.env.SUPABASE_LOCAL_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long'

const TENANT_A_SCHOOL_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const TENANT_B_SCHOOL_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const USER_A_ID = '11111111-1111-1111-1111-111111111111'
const USER_B_ID = '22222222-2222-2222-2222-222222222222'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !JWT_SECRET) {
  console.error('❌ Variáveis essenciais ausentes no .env.local/.env')
  console.error('Necessárias:')
  console.error('- VITE_SUPABASE_URL')
  console.error('- VITE_SUPABASE_ANON_KEY')
  console.error('- SUPABASE_LOCAL_JWT_SECRET')
  process.exit(1)
}

// ============================================================
// Helpers
// ============================================================

function createAccessToken(userId) {
  return jwt.sign(
    {
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      sub: userId,
      email: `${userId}@smart-exit.local`,
      role: 'authenticated'
    },
    JWT_SECRET
  )
}

function createAuthedClient(userId) {
  const token = createAccessToken(userId)

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })
}

function ensureMultiTenantFixtures() {
  const seedPath = path.resolve(process.cwd(), 'supabase', 'seed-multi-tenant.sql')
  if (!fs.existsSync(seedPath)) {
    return
  }

  const sqlContent = fs.readFileSync(seedPath, 'utf8')
  const res = spawnSync('docker', ['exec', '-i', 'supabase_db_smart-exit-school', 'psql', '-U', 'postgres', '-d', 'postgres'], {
    input: sqlContent,
    encoding: 'utf8'
  })

  if (res.status !== 0 && res.stderr) {
    console.warn('⚠️ Nota sobre aplicação de fixtures via docker:', res.stderr.trim())
  }
}

async function run() {
  console.log('\n============================================================')
  console.log('RLS FOUNDATION VALIDATION — MULTI-TENANT RUNTIME')
  console.log('============================================================\n')

  const clientA = createAuthedClient(USER_A_ID)
  const clientB = createAuthedClient(USER_B_ID)

  // 1. Verificar se as fixtures multi-tenant já existem ou precisam ser carregadas
  const { data: initialCheckA } = await clientA
    .from('schools')
    .select('id')
    .eq('id', TENANT_A_SCHOOL_ID)

  if (!initialCheckA || initialCheckA.length === 0) {
    console.log('📦 Carregando fixtures multi-tenant de supabase/seed-multi-tenant.sql...')
    ensureMultiTenantFixtures()
  }

  let failedTests = 0

  // ------------------------------------------------------------
  // TESTE 1 — schools visíveis para USER A (Tenant Alpha)
  // ------------------------------------------------------------
  const { data: schoolsA, error: schoolsAError } = await clientA
    .from('schools')
    .select('id, slug, name')
    .order('slug')

  console.log('TESTE 1 — USER A / schools (esperado: apenas Tenant Alpha)')
  if (schoolsAError) {
    console.error('❌ Erro:', schoolsAError.message)
    failedTests++
  } else if (!schoolsA || schoolsA.length !== 1 || schoolsA[0].id !== TENANT_A_SCHOOL_ID) {
    console.error('❌ Falha: USER A deveria ver exclusivamente Tenant Alpha School.', schoolsA)
    failedTests++
  } else {
    console.table(schoolsA)
  }

  // ------------------------------------------------------------
  // TESTE 2 — schools visíveis para USER B (Tenant Beta)
  // ------------------------------------------------------------
  const { data: schoolsB, error: schoolsBError } = await clientB
    .from('schools')
    .select('id, slug, name')
    .order('slug')

  console.log('\nTESTE 2 — USER B / schools (esperado: apenas Tenant Beta)')
  if (schoolsBError) {
    console.error('❌ Erro:', schoolsBError.message)
    failedTests++
  } else if (!schoolsB || schoolsB.length !== 1 || schoolsB[0].id !== TENANT_B_SCHOOL_ID) {
    console.error('❌ Falha: USER B deveria ver exclusivamente Tenant Beta School.', schoolsB)
    failedTests++
  } else {
    console.table(schoolsB)
  }

  // ------------------------------------------------------------
  // TESTE 3 — students visíveis para USER A
  // ------------------------------------------------------------
  const { data: studentsA, error: studentsAError } = await clientA
    .from('students')
    .select('student_identifier, full_name, school_id')
    .order('student_identifier')

  console.log('\nTESTE 3 — USER A / students (esperado: apenas alunos de Alpha)')
  if (studentsAError) {
    console.error('❌ Erro:', studentsAError.message)
    failedTests++
  } else if (!studentsA || studentsA.length === 0 || studentsA.some((s) => s.school_id !== TENANT_A_SCHOOL_ID)) {
    console.error('❌ Falha: alunos de outros tenants vazaram para USER A.', studentsA)
    failedTests++
  } else {
    console.table(studentsA)
  }

  // ------------------------------------------------------------
  // TESTE 4 — students visíveis para USER B
  // ------------------------------------------------------------
  const { data: studentsB, error: studentsBError } = await clientB
    .from('students')
    .select('student_identifier, full_name, school_id')
    .order('student_identifier')

  console.log('\nTESTE 4 — USER B / students (esperado: apenas alunos de Beta)')
  if (studentsBError) {
    console.error('❌ Erro:', studentsBError.message)
    failedTests++
  } else if (!studentsB || studentsB.length === 0 || studentsB.some((s) => s.school_id !== TENANT_B_SCHOOL_ID)) {
    console.error('❌ Falha: alunos de outros tenants vazaram para USER B.', studentsB)
    failedTests++
  } else {
    console.table(studentsB)
  }

  // ------------------------------------------------------------
  // TESTE 5 — gates visíveis para USER A
  // ------------------------------------------------------------
  const { data: gatesA, error: gatesAError } = await clientA
    .from('gates')
    .select('id, name, school_id')
    .order('name')

  console.log('\nTESTE 5 — USER A / gates (esperado: apenas portões de Alpha)')
  if (gatesAError) {
    console.error('❌ Erro:', gatesAError.message)
    failedTests++
  } else if (!gatesA || gatesA.length === 0 || gatesA.some((g) => g.school_id !== TENANT_A_SCHOOL_ID)) {
    console.error('❌ Falha: portões de outros tenants vazaram para USER A.', gatesA)
    failedTests++
  } else {
    console.table(gatesA)
  }

  // ------------------------------------------------------------
  // TESTE 6 — gates visíveis para USER B
  // ------------------------------------------------------------
  const { data: gatesB, error: gatesBError } = await clientB
    .from('gates')
    .select('id, name, school_id')
    .order('name')

  console.log('\nTESTE 6 — USER B / gates (esperado: apenas portões de Beta)')
  if (gatesBError) {
    console.error('❌ Erro:', gatesBError.message)
    failedTests++
  } else if (!gatesB || gatesB.length === 0 || gatesB.some((g) => g.school_id !== TENANT_B_SCHOOL_ID)) {
    console.error('❌ Falha: portões de outros tenants vazaram para USER B.', gatesB)
    failedTests++
  } else {
    console.table(gatesB)
  }

  // ------------------------------------------------------------
  // TESTE 7 — Isolamento de leitura cruzada (USER A tentando filtrar Beta)
  // ------------------------------------------------------------
  const { data: crossRead, error: crossReadError } = await clientA
    .from('schools')
    .select('id, name')
    .eq('id', TENANT_B_SCHOOL_ID)

  console.log('\nTESTE 7 — Cross-Tenant Read Check (USER A tentando ler dados de Beta)')
  if (crossReadError) {
    console.error('❌ Erro inesperado:', crossReadError.message)
    failedTests++
  } else if (crossRead && crossRead.length > 0) {
    console.error('❌ VAZAMENTO: USER A conseguiu ler dados de Tenant Beta!', crossRead)
    failedTests++
  } else {
    console.log('✅ PASS: Retornou 0 linhas (isolamento estrito preservado).')
  }

  // ------------------------------------------------------------
  // TESTE 8 — Bloqueio de escrita cruzada (USER A tentando inserir em Beta)
  // ------------------------------------------------------------
  const { data: crossWriteData, error: crossWriteError } = await clientA
    .from('students')
    .insert({
      school_id: TENANT_B_SCHOOL_ID,
      student_identifier: 'MALICIOUS-SCRIPT-001',
      full_name: 'Tentativa Ilegal de Inserção',
      birth_date: '2016-01-01',
      status: 'active'
    })
    .select()

  console.log('\nTESTE 8 — Cross-Tenant Write Check (USER A tentando inserir aluno em Beta)')
  if (!crossWriteError || crossWriteError.code !== '42501') {
    console.error('❌ FALHA: Tentativa de inserção cruzada não foi bloqueada com 42501!', {
      crossWriteData,
      crossWriteError
    })
    failedTests++
  } else {
    console.log(`✅ PASS: Bloqueado pelo RLS com erro ${crossWriteError.code} (${crossWriteError.message}).`)
  }

  // ------------------------------------------------------------
  // TESTE 9 — Proteção de privilégios de plataforma
  // ------------------------------------------------------------
  const { data: rpcData, error: rpcError } = await clientA.rpc('list_platform_users')

  console.log('\nTESTE 9 — Platform Privilege Check (USER A chamando RPC list_platform_users)')
  if (!rpcError || rpcError.code !== '42501') {
    console.error('❌ FALHA: Chamada a RPC de plataforma não foi bloqueada com 42501!', {
      rpcData,
      rpcError
    })
    failedTests++
  } else {
    console.log(`✅ PASS: Bloqueado pelo RLS com erro ${rpcError.code} (${rpcError.message}).`)
  }

  console.log('\n------------------------------------------------------------')
  if (failedTests > 0) {
    console.error(`❌ Validação RLS falhou com ${failedTests} erro(s).`)
    process.exit(1)
  }

  console.log('✅ Validação completa de isolamento RLS multi-tenant executada com sucesso.')
  console.log('Todos os 9 testes de isolamento passaram sem aviso de validação parcial.')
}

run().catch((error) => {
  console.error('\n❌ Falha inesperada ao validar RLS:')
  console.error(error)
  process.exit(1)
})
