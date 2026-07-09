# Database Auditor v1

Technical validator for the Smart Exit School **database foundation** through Migration **0005**.

This tool is **not** the domain Audit Core (`audit_logs`). It only checks that the current schema, RLS foundation, and seed baseline match the contract already defined in:

- `supabase/migrations/` (0001–0005)
- `supabase/seed.sql`

---

## When to run

After a clean local reset:

```bash
npx supabase start
npx supabase db reset
npm run audit:db
```

---

## What v1 validates

| Module | Checks |
|--------|--------|
| `inspect-schema.mjs` | Expected `public` app tables exist |
| `inspect-rls.mjs` | RLS enabled on those tables; expected policies; helper functions |
| `inspect-seed.mjs` | Seed invariants (roles, shifts, dev school, academic mass, gates) |

Result statuses:

- **PASS** — contract satisfied
- **FAIL** — contract violation → process exits `1`
- **WARN** — noteworthy known gap (does not fail the run)
- **SKIP** — check could not run (connection / tooling unavailable)

---

## Connection model

Inspectors query local Postgres as the migration owner:

1. Preferred: `docker exec supabase_db_smart-exit-school psql …`
2. Fallback: `supabase db query --local` (SQL via stdin)

**Why not Data API service_role for seed reads in v1?**  
Migration 0005 grants `SELECT` to `authenticated` only. With the current local config (`auto_expose_new_tables` unset/false), the PostgREST `service_role` key receives `permission denied` on app tables. That grant gap is flagged as a known ambiguity — not silently “fixed” by inventing grants.

`runtime.mjs` still exposes service-role client helpers for future authenticated-path checks once grants are aligned.

Optional env (for future modules / local tooling):

1. `VITE_SUPABASE_URL` / `SUPABASE_URL`
2. `SUPABASE_SERVICE_ROLE_KEY` / `SERVICE_ROLE_KEY`
3. Fallback: `npx supabase status -o env`

---

## Modules

```
scripts/db-auditor/
├── index.mjs                 # CLI orchestrator
├── report.mjs                # PASS/FAIL/WARN/SKIP + printer
├── expected-foundation.mjs   # Declared contract (tables/policies/functions/seed)
├── inspect-schema.mjs
├── inspect-rls.mjs
├── inspect-seed.mjs
├── runtime.mjs               # env + query helpers
└── README.md
```

---

## Known non-assertions (v1)

Flagged intentionally — do not treat as silent success:

- Grant matrix from Migration 0005 (SELECT-only vs write policies) is **not** asserted yet.
- Seed does **not** create Auth users, `profiles`, `school_members`, or `pickup_events` — reported as **WARN**.
- Runtime RLS isolation smoke (multi-tenant JWT tests) remains in `scripts/validate-rls-foundation.mjs` and is **out of scope** for Auditor v1.

---

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | No FAIL items (PASS / WARN / SKIP only) |
| `1` | One or more FAIL items, or unexpected crash |
