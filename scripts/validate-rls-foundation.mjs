import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// Load env
// ============================================================

const envLocalPath = path.resolve(process.cwd(), '.env.local')
const envPath = path.resolve(process.cwd(), '.env')

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath })
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const JWT_SECRET = process.env.SUPABASE_LOCAL_JWT_SECRET
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const MEMBERSHIP_MESSAGE =
  'Validação completa da RLS depende das migrations futuras responsáveis pela infraestrutura de memberships.'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !JWT_SECRET) {
  console.error('❌ Variáveis ausentes no .env.local/.env')
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

function printPartialValidation(reason) {
  console.log('⚠️  Validação parcial apenas.')
  console.log(reason)
  console.log(MEMBERSHIP_MESSAGE)
  console.log('\nO seed atual contém apenas dados mínimos da aplicação e não inclui usuários de teste RLS.')
}

async function getActiveMembershipCount() {
  if (!SERVICE_ROLE_KEY) {
    return null
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { count, error } = await adminClient
    .from('school_members')
    .select('*', { head: true, count: 'exact' })
    .eq('status', 'active')

  if (error) {
    if (error.code === '42P01' || /does not exist/i.test(error.message ?? '')) {
      return null
    }

    throw new Error(`Falha ao consultar school_members: ${error.message}`)
  }

  return count ?? 0
}

async function run() {
  console.log('\n============================================================')
  console.log('RLS VALIDATION — MIGRATION 0005')
  console.log('============================================================\n')

  const activeMembershipCount = await getActiveMembershipCount()

  if (activeMembershipCount === null) {
    printPartialValidation(
      'Infraestrutura de memberships indisponível para validação (tabela ausente ou SUPABASE_SERVICE_ROLE_KEY não configurada).'
    )
    process.exit(0)
  }

  if (activeMembershipCount < 2) {
    printPartialValidation(
      `Foram encontrados ${activeMembershipCount} vínculo(s) ativo(s) em public.school_members; são necessários ao menos dois tenants/usuários para validar isolamento.`
    )
    process.exit(0)
  }

  const USER_A = '11111111-1111-1111-1111-111111111111'
  const USER_B = '22222222-2222-2222-2222-222222222222'

  const clientA = createAuthedClient(USER_A)
  const clientB = createAuthedClient(USER_B)

  // ------------------------------------------------------------
  // TESTE 1 — schools visíveis para USER A
  // ------------------------------------------------------------
  const { data: schoolsA, error: schoolsAError } = await clientA
    .from('schools')
    .select('slug, name')
    .order('slug')

  console.log('TESTE 1 — USER A / schools')
  if (schoolsAError) {
    console.error('❌ Erro:', schoolsAError.message)
  } else {
    console.table(schoolsA)
  }

  // ------------------------------------------------------------
  // TESTE 2 — schools visíveis para USER B
  // ------------------------------------------------------------
  const { data: schoolsB, error: schoolsBError } = await clientB
    .from('schools')
    .select('slug, name')
    .order('slug')

  console.log('\nTESTE 2 — USER B / schools')
  if (schoolsBError) {
    console.error('❌ Erro:', schoolsBError.message)
  } else {
    console.table(schoolsB)
  }

  // ------------------------------------------------------------
  // TESTE 3 — students visíveis para USER A
  // ------------------------------------------------------------
  const { data: studentsA, error: studentsAError } = await clientA
    .from('students')
    .select('student_identifier, full_name')
    .order('student_identifier')

  console.log('\nTESTE 3 — USER A / students')
  if (studentsAError) {
    console.error('❌ Erro:', studentsAError.message)
  } else {
    console.table(studentsA)
  }

  // ------------------------------------------------------------
  // TESTE 4 — students visíveis para USER B
  // ------------------------------------------------------------
  const { data: studentsB, error: studentsBError } = await clientB
    .from('students')
    .select('student_identifier, full_name')
    .order('student_identifier')

  console.log('\nTESTE 4 — USER B / students')
  if (studentsBError) {
    console.error('❌ Erro:', studentsBError.message)
  } else {
    console.table(studentsB)
  }

  // ------------------------------------------------------------
  // TESTE 5 — gates visíveis para USER A
  // ------------------------------------------------------------
  const { data: gatesA, error: gatesAError } = await clientA
    .from('gates')
    .select('name')
    .order('name')

  console.log('\nTESTE 5 — USER A / gates')
  if (gatesAError) {
    console.error('❌ Erro:', gatesAError.message)
  } else {
    console.table(gatesA)
  }

  // ------------------------------------------------------------
  // TESTE 6 — gates visíveis para USER B
  // ------------------------------------------------------------
  const { data: gatesB, error: gatesBError } = await clientB
    .from('gates')
    .select('name')
    .order('name')

  console.log('\nTESTE 6 — USER B / gates')
  if (gatesBError) {
    console.error('❌ Erro:', gatesBError.message)
  } else {
    console.table(gatesB)
  }

  console.log('\n✅ Validação finalizada.')
}

run().catch((error) => {
  console.error('\n❌ Falha inesperada ao validar RLS:')
  console.error(error)
  process.exit(1)
})
