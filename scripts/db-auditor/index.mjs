import { inspectSchema } from './inspect-schema.mjs'
import { inspectRls } from './inspect-rls.mjs'
import { inspectGrants } from './inspect-grants.mjs'
import { inspectSeed } from './inspect-seed.mjs'
import { hasFailures, printReport } from './report.mjs'

/**
 * Database Auditor v1
 *
 * Technical validator for the Smart Exit School database foundation
 * through Migration 0005 + current supabase/seed.sql.
 *
 * This is NOT the domain Audit Core (audit_logs).
 *
 * Usage (after local reset):
 *   npx supabase db reset
 *   npm run audit:db
 */

async function run() {
  console.log('\nDatabase Auditor v1 — starting foundation validation...')
  console.log('Prerequisite: local Supabase running with migrations 0001–0005 applied.\n')

  const schemaResults = await inspectSchema()
  const rlsResults = await inspectRls()
  const grantsResults = await inspectGrants()
  const seedResults = await inspectSeed()

  const sections = [
    { name: 'Schema (tables)', results: schemaResults },
    { name: 'RLS foundation', results: rlsResults },
    { name: 'Grants (authenticated)', results: grantsResults },
    { name: 'Seed invariants', results: seedResults }
  ]

  const results = sections.flatMap((section) => section.results)

  printReport({
    title: 'DATABASE AUDITOR v1 — FOUNDATION (Migrations 0001–0005)',
    results,
    sections
  })

  if (hasFailures(results)) {
    process.exit(1)
  }

  process.exit(0)
}

run().catch((error) => {
  console.error('\n❌ Database Auditor crashed unexpectedly:')
  console.error(error)
  process.exit(1)
})
