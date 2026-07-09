import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

/**
 * Shared runtime helpers for Database Auditor v1.
 *
 * Catalog, RLS, and seed checks query local Postgres as the migration owner.
 * Preferred path: `docker exec … psql` (fast).
 * Fallback: `supabase db query --local` with SQL on stdin.
 *
 * Ambiguity: Migration 0005 grants SELECT to `authenticated` only. With local
 * `auto_expose_new_tables` unset/false, PostgREST `service_role` currently
 * gets permission denied on app tables — so v1 does not use the Data API for
 * seed reads. Service-role helpers remain for future authenticated-path checks.
 */

const DB_CONTAINER = 'supabase_db_smart-exit-school'

export function loadEnv() {
  const envLocalPath = path.resolve(process.cwd(), '.env.local')
  const envPath = path.resolve(process.cwd(), '.env')

  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath })
  } else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }
}

/**
 * Resolve local Supabase connection settings.
 * Prefers env vars; falls back to `supabase status -o env` for local defaults.
 */
export function resolveLocalSupabaseEnv() {
  loadEnv()

  let url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || null
  let serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || null

  if (url && serviceRoleKey) {
    return { url, serviceRoleKey, source: 'env' }
  }

  const status = spawnSync('npx', ['supabase', 'status', '-o', 'env'], {
    encoding: 'utf8',
    shell: true,
    cwd: process.cwd()
  })

  if (status.status !== 0) {
    return {
      url,
      serviceRoleKey,
      source: 'partial',
      error:
        status.stderr?.trim() ||
        status.stdout?.trim() ||
        'Unable to read local supabase status. Is `supabase start` running?'
    }
  }

  const parsed = Object.fromEntries(
    status.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.includes('='))
      .map((line) => {
        const idx = line.indexOf('=')
        const key = line.slice(0, idx)
        let value = line.slice(idx + 1)
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        return [key, value]
      })
  )

  url = url || parsed.API_URL || null
  serviceRoleKey = serviceRoleKey || parsed.SERVICE_ROLE_KEY || null

  return { url, serviceRoleKey, source: 'supabase-status', raw: parsed }
}

export function createServiceRoleClient({ url, serviceRoleKey }) {
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Service role client requires SUPABASE URL and SUPABASE_SERVICE_ROLE_KEY (or local supabase status).'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

function queryViaDocker(sql) {
  const result = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      DB_CONTAINER,
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-t',
      '-A',
      '-c',
      `select coalesce(json_agg(row_to_json(q)), '[]'::json) from (${sql}) q;`
    ],
    {
      encoding: 'utf8',
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024
    }
  )

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim()
    throw new Error(detail || 'docker exec psql failed')
  }

  const stdout = (result.stdout || '').trim()
  if (!stdout || stdout === '') {
    return []
  }

  return JSON.parse(stdout)
}

function queryViaSupabaseCli(sql) {
  const wrapped = `select coalesce(json_agg(row_to_json(q)), '[]'::json) as rows from (${sql}) q;`

  const result = spawnSync(
    'npx',
    ['supabase', 'db', 'query', '--local', '-o', 'json'],
    {
      encoding: 'utf8',
      shell: true,
      cwd: process.cwd(),
      input: `${wrapped}\n`,
      maxBuffer: 10 * 1024 * 1024
    }
  )

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim()
    throw new Error(detail || 'supabase db query failed')
  }

  const stdout = (result.stdout || '').trim()
  if (!stdout) {
    return []
  }

  const jsonStart = stdout.indexOf('{')
  if (jsonStart === -1) {
    throw new Error(`Unable to locate JSON in supabase db query output: ${stdout}`)
  }

  const parsed = JSON.parse(stdout.slice(jsonStart))
  const rows = parsed?.rows
  if (!Array.isArray(rows) || rows.length === 0) {
    return []
  }

  // Wrapped query returns one row with a `rows` json array payload.
  const payload = rows[0]?.rows
  if (payload == null) {
    return []
  }
  if (typeof payload === 'string') {
    return JSON.parse(payload)
  }
  if (Array.isArray(payload)) {
    return payload
  }

  return []
}

function dockerDbAvailable() {
  const result = spawnSync(
    'docker',
    ['inspect', '-f', '{{.State.Running}}', DB_CONTAINER],
    { encoding: 'utf8', cwd: process.cwd() }
  )
  return result.status === 0 && String(result.stdout || '').trim() === 'true'
}

/**
 * Execute SQL against the local database.
 * Returns parsed row objects.
 *
 * @param {string} sql  SELECT query (no trailing semicolon required)
 * @returns {Promise<object[]>}
 */
export async function queryLocalSql(sql) {
  const normalized = sql.trim().replace(/;+\s*$/, '')

  if (dockerDbAvailable()) {
    try {
      return queryViaDocker(normalized)
    } catch {
      // Fall through to CLI if docker path fails unexpectedly.
    }
  }

  return queryViaSupabaseCli(normalized)
}

/**
 * Escape a literal for safe inclusion in single-quoted SQL strings.
 * @param {string|number|boolean} value
 */
export function sqlLiteral(value) {
  if (typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  return `'${String(value).replaceAll("'", "''")}'`
}
