import { APP_TABLES } from './expected-foundation.mjs'
import { fail, pass, skip } from './report.mjs'
import { queryLocalSql } from './runtime.mjs'

/**
 * Schema inspector — Migration 0001–0004 table presence.
 * v1 scope: table existence in public schema.
 */

export async function inspectSchema() {
  const results = []

  let existing
  try {
    const rows = await queryLocalSql(`
      select tablename
      from pg_tables
      where schemaname = 'public'
      order by tablename
    `)
    existing = new Set(rows.map((row) => row.tablename))
  } catch (error) {
    return [
      skip(
        'schema.connection',
        `Unable to query local catalog for table existence: ${error.message}`
      )
    ]
  }

  for (const table of APP_TABLES) {
    if (existing.has(table)) {
      results.push(pass(`schema.table.${table}`, `Table public.${table} exists.`))
    } else {
      results.push(fail(`schema.table.${table}`, `Expected table public.${table} is missing.`))
    }
  }

  return results
}
