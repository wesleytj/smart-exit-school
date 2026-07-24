import {
  EXPECTED_SCHEMA_GRANTS,
  EXPECTED_TABLE_GRANTS,
  TABLES_WITHOUT_AUTHENTICATED_GRANTS
} from './expected-foundation.mjs'
import { fail, pass, skip, warn } from './report.mjs'
import { queryLocalSql, sqlLiteral } from './runtime.mjs'

/**
 * Grants inspector — Migration 0005 privileges for role `authenticated`.
 * Checks:
 * - expected schema USAGE
 * - expected table SELECT grants
 * - WARN for foundation tables intentionally left without grants (profiles)
 */

function asBoolean(value) {
  return value === true || value === 't' || value === 'true'
}

export async function inspectGrants() {
  const results = []

  try {
    for (const grant of EXPECTED_SCHEMA_GRANTS) {
      const rows = await queryLocalSql(`
        select has_schema_privilege(
          ${sqlLiteral(grant.role)},
          ${sqlLiteral(grant.schema)},
          ${sqlLiteral(grant.privilege)}
        ) as allowed
      `)

      const allowed = asBoolean(rows[0]?.allowed)
      if (allowed) {
        results.push(
          pass(
            `grants.schema.${grant.schema}.${grant.privilege.toLowerCase()}`,
            `Role ${grant.role} has ${grant.privilege} on schema ${grant.schema}.`
          )
        )
      } else {
        results.push(
          fail(
            `grants.schema.${grant.schema}.${grant.privilege.toLowerCase()}`,
            `Expected ${grant.privilege} on schema ${grant.schema} for role ${grant.role} is missing.`
          )
        )
      }
    }

    const tableNames = EXPECTED_TABLE_GRANTS.map((grant) => grant.table)
    const privilegeNames = [
      ...new Set(EXPECTED_TABLE_GRANTS.flatMap((grant) => grant.privileges))
    ]

    const privilegeSelects = privilegeNames
      .map(
        (privilege) =>
          `has_table_privilege(${sqlLiteral('authenticated')}, format('%I.%I', n.nspname, c.relname), ${sqlLiteral(privilege)}) as has_${privilege.toLowerCase()}`
      )
      .join(',\n          ')

    const tableListSql = tableNames.map((name) => sqlLiteral(name)).join(', ')

    const privilegeRows = await queryLocalSql(`
      select
          c.relname as table_name,
          ${privilegeSelects}
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
        and c.relname in (${tableListSql})
      order by c.relname
    `)

    const privilegesByTable = new Map(
      privilegeRows.map((row) => [row.table_name, row])
    )

    for (const grant of EXPECTED_TABLE_GRANTS) {
      const row = privilegesByTable.get(grant.table)

      if (!row) {
        results.push(
          fail(
            `grants.table.${grant.table}`,
            `Table public.${grant.table} not found while checking grants for ${grant.role}.`
          )
        )
        continue
      }

      for (const privilege of grant.privileges) {
        const column = `has_${privilege.toLowerCase()}`
        const allowed = asBoolean(row[column])

        if (allowed) {
          results.push(
            pass(
              `grants.table.${grant.table}.${privilege.toLowerCase()}`,
              `Role ${grant.role} has ${privilege} on public.${grant.table}.`
            )
          )
        } else {
          results.push(
            fail(
              `grants.table.${grant.table}.${privilege.toLowerCase()}`,
              `Expected ${privilege} on public.${grant.table} for role ${grant.role} is missing.`
            )
          )
        }
      }
    }

    if (TABLES_WITHOUT_AUTHENTICATED_GRANTS.length > 0) {
      const absentListSql = TABLES_WITHOUT_AUTHENTICATED_GRANTS.map((name) =>
        sqlLiteral(name)
      ).join(', ')

      const absentRows = await queryLocalSql(`
        select
            c.relname as table_name,
            has_table_privilege('authenticated', format('%I.%I', n.nspname, c.relname), 'SELECT') as has_select,
            has_table_privilege('authenticated', format('%I.%I', n.nspname, c.relname), 'INSERT') as has_insert,
            has_table_privilege('authenticated', format('%I.%I', n.nspname, c.relname), 'UPDATE') as has_update,
            has_table_privilege('authenticated', format('%I.%I', n.nspname, c.relname), 'DELETE') as has_delete
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relkind = 'r'
          and c.relname in (${absentListSql})
        order by c.relname
      `)

      const absentByTable = new Map(absentRows.map((row) => [row.table_name, row]))

      for (const table of TABLES_WITHOUT_AUTHENTICATED_GRANTS) {
        const row = absentByTable.get(table)

        if (!row) {
          results.push(
            warn(
              `grants.table.${table}.none`,
              `Table public.${table} is listed without authenticated grants, but was not found in the catalog.`
            )
          )
          continue
        }

        const hasAny =
          asBoolean(row.has_select) ||
          asBoolean(row.has_insert) ||
          asBoolean(row.has_update) ||
          asBoolean(row.has_delete)

        if (!hasAny) {
          results.push(
            warn(
              `grants.table.${table}.none`,
              `public.${table} has no table grants for authenticated (matches Migration 0005; policies exist without GRANT).`
            )
          )
        } else {
          results.push(
            warn(
              `grants.table.${table}.unexpected`,
              `public.${table} has authenticated privileges not declared in Migration 0005.`,
              {
                SELECT: asBoolean(row.has_select),
                INSERT: asBoolean(row.has_insert),
                UPDATE: asBoolean(row.has_update),
                DELETE: asBoolean(row.has_delete)
              }
            )
          )
        }
      }
    }

    return results
  } catch (error) {
    return [
      skip(
        'grants.connection',
        `Unable to query local catalog for grants: ${error.message}`
      )
    ]
  }
}
