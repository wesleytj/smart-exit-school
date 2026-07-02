# Project Summary — Smart Exit School

## One-liner

SaaS frontend para gestão de saída escolar. DAL em services; runtime localStorage; PostgreSQL Supabase em migração (schema Auth + Academic).

## Owner

AllTech Solutions (AES)

## Version

0.0.0 (package.json)

## Stack

React 19 | Vite 8 | Tailwind 4 | React Router 7 | Lucide | localStorage (runtime) | Supabase PostgreSQL (schema)

## Routes

| Path | Page |
|------|------|
| `/login` | Login |
| `/admin/institutions` | Super Admin |
| `/painel` | School Panel |
| `/tv` | TV Display |

## User Roles

1. **Super Admin** — manages schools/plans
2. **School Operator** — daily exit operations
3. **TV Display** — read-only call queue

No parent/student app exists.

## Plans

Basic → Premium → Diamond (+ Trial label only)

## Core Flow

Register students → Call on monitor → Display on TV → Confirm exit

## Data Store

- **Runtime:** localStorage via DAL (`storageClient`)
- **Schema:** PostgreSQL (Supabase) — migrations 0001–0002
- **Gap:** `schoolService` reads Supabase, writes localStorage

## Key Files

- `src/pages/InstitutionPanel.jsx` — main business logic
- `src/pages/Login.jsx` — auth
- `src/pages/InstitutionsManager.jsx` — admin CRUD
- `src/pages/TvDisplay.jsx` — display sync

## Dead Code (do not extend)

- `src/components/StudentCard.jsx`
- `src/data/students.js`
- `src/App.css`

## Critical Gaps

- No backend/API
- Plaintext passwords
- Hardcoded admin creds
- Two gate models (exits vs gatesList)
- Placeholder features: reports, fleet, i18n, webhooks

## Docs

Full documentation in `/docs/` and `/ai/`.
