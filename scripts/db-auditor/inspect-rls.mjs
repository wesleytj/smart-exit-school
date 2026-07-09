import {
  APP_TABLES,
  EXPECTED_POLICIES,
  RLS_HELPER_FUNCTIONS
} from './expected-foundation.mjs'
import { fail, pass, skip } from './report.mjs'
import { queryLocalSql } from './runtime.mjs'

/**
 * RLS inspector — Migration 0005 foundation.
 * Checks:
 * - RLS enabled on expected app tables
 * - expected policy names present
 * - expected helper functions present
 */

function normalizeIdentityArgs(identityArgs) {
  return String(identityArgs || '')
    .split(',')
    .map((part) => {
      const tokens = part.trim().toLowerCase().split(/\s+/).filter(Boolean)
      return tokens.at(-1) || ''
    })
    .filter(Boolean)
    .join(',')
}

export async function inspectRls() {
  const results = []

  let rlsRows
  let policyRows
  let functionRows

  try {
    rlsRows = await queryLocalSql(`
      select c.relname as table_name, c.relrowsecurity as rls_enabled
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
      order by c.relname
    `)

    policyRows = await queryLocalSql(`
      select tablename as table_name, policyname as policy_name
      from pg_policies
      where schemaname = 'public'
      order by tablename, policyname
    `)

    functionRows = await queryLocalSql(`
      select
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_function_identity_arguments(p.oid) as identity_args
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in (
          'is_active_school_member',
          'can_access_student_enrollment',
          'can_access_academic_group',
          'can_access_gate'
        )
      order by p.proname
    `)
  } catch (error) {
    return [
      skip(
        'rls.connection',
        `Unable to query local catalog for RLS foundation: ${error.message}`
      )
    ]
  }

  const rlsByTable = new Map(
    rlsRows.map((row) => [row.table_name, row.rls_enabled === true || row.rls_enabled === 't'])
  )

  for (const table of APP_TABLES) {
    if (!rlsByTable.has(table)) {
      results.push(
        fail(`rls.enabled.${table}`, `Table public.${table} not found while checking RLS.`)
      )
      continue
    }

    if (rlsByTable.get(table)) {
      results.push(pass(`rls.enabled.${table}`, `RLS is enabled on public.${table}.`))
    } else {
      results.push(fail(`rls.enabled.${table}`, `RLS is NOT enabled on public.${table}.`))
    }
  }

  const policySet = new Set(
    policyRows.map((row) => `${row.table_name}::${row.policy_name}`)
  )

  for (const policy of EXPECTED_POLICIES) {
    const key = `${policy.table}::${policy.name}`
    if (policySet.has(key)) {
      results.push(
        pass(
          `rls.policy.${policy.name}`,
          `Policy ${policy.name} exists on public.${policy.table}.`
        )
      )
    } else {
      results.push(
        fail(
          `rls.policy.${policy.name}`,
          `Expected policy ${policy.name} is missing on public.${policy.table}.`
        )
      )
    }
  }

  // pg_get_function_identity_arguments may return "target_school_id uuid"
  // or just "uuid". Normalize to type-only tokens before comparing.
  const functionSet = new Set(
    functionRows.map((row) => {
      const args = normalizeIdentityArgs(row.identity_args)
      return `${row.schema_name}.${row.function_name}(${args})`
    })
  )

  for (const fn of RLS_HELPER_FUNCTIONS) {
    const expectedArgs = fn.argumentTypes.map((t) => t.toLowerCase()).join(',')
    const key = `${fn.schema}.${fn.name}(${expectedArgs})`

    if (functionSet.has(key)) {
      results.push(
        pass(
          `rls.function.${fn.name}`,
          `Helper function ${fn.schema}.${fn.name}(${fn.argumentTypes.join(', ')}) exists.`
        )
      )
    } else {
      results.push(
        fail(
          `rls.function.${fn.name}`,
          `Expected helper function ${fn.schema}.${fn.name}(${fn.argumentTypes.join(', ')}) is missing.`,
          { found: [...functionSet] }
        )
      )
    }
  }

  return results
}
