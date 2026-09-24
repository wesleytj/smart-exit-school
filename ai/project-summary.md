# Project Summary — Smart Exit School

## One-liner

SaaS frontend para gestão de saída escolar. Identidade no Supabase Auth; tenant via membership ativa em `school_members`. Cache operacional ainda pode usar localStorage. Release da Feature #49 ainda não realizado.

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
| `/admin/institutions` | Platform Admin (`is_platform_admin()`) |
| `/painel` | School Panel |
| `/tv` | TV Display |

## User Roles

1. **Platform Admin** — `is_platform_admin()`; não é tenant de escola
2. **Usuário de escola** — membership ativa em `school_members`
3. **TV Display** — fila local; não autoriza o tenant

No parent/student app exists.

## Plans

Basic → Premium → Diamond (+ Trial label only)

## Core Flow

Register students → Call on monitor → Display on TV → Confirm exit

## Data Store

- **Identidade:** Supabase Auth. Logout encerra a sessão.
- **Tenant:** `school_members` ativo. Zero memberships não abre contexto de escola.
- **Banco:** RLS é a autoridade. A Feature #49 não alterou policies.
- **Cache:** localStorage e `@SmartExit:loggedSchool` não autorizam.
- **Gap conhecido:** `school_members = 0`. Isolamento runtime com dois JWTs ainda não certificado. Portões, chamadas e alunos do painel ainda podem ficar no browser.

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
