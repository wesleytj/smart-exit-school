# Estrutura do Projeto — Smart Exit School

## Árvore de diretórios

```text
smart-exit-school/
├── .agents/                          # Governança AADS local (regras e skills SES)
│   ├── rules/                        # 01-ses-architecture, 02-ses-qa-governance, 03-ses-database-security
│   └── skills/                       # ses-database-audit, ses-qa-smoke
├── .github/                          # CI workflows (ci.yml), templates de Issue e PR
├── .gitignore
├── AGENTS.md                         # Protocolo operacional compulsório AADS
├── GEMINI.md                         # Contexto de arquitetura e tecnologia
├── eslint.config.js
├── index.html
├── package.json
├── vercel.json                       # Configuração de SPA rewrite fallback para Vercel
├── vite.config.js
├── README.md
│
├── docs/                             # Documentação técnica oficial
│   ├── qa-data-governance.md         # Política de dados de QA (reutilizar antes de criar)
│   ├── qa-inventory.md               # Snapshot read-only de fixtures
│   ├── qa-production-smoke.md        # Roteiro operacional de smoke em produção
│   ├── auditoria-isolamento-multi-tenant.md # Spike #47 — auditoria read-only RLS/tenant
│   └── arquitetura/                  # ADRs, modelagem, padrões
│
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── sounds/call.mp3
│
├── supabase/
│   ├── config.toml
│   ├── migrations/                   # 18 migrations SQL versionadas
│   ├── seed.sql
│   └── README.md
│
├── scripts/
│   ├── validate-rls-foundation.mjs  # Validação de RLS foundation
│   └── db-auditor/                  # Database Auditor v1
│       ├── index.mjs
│       ├── expected-foundation.mjs
│       ├── inspect-schema.mjs
│       ├── inspect-rls.mjs
│       ├── inspect-seed.mjs
│       ├── report.mjs
│       ├── runtime.mjs
│       └── README.md
│
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.css
    ├── index.css
    │
    ├── assets/                       # Logotipos e identidades visuais
    ├── components/
    │   ├── AcademicStructureSection.jsx
    │   └── StudentCard.jsx           # Legado
    │
    ├── contexts/                     # Context Providers de Estado Reativo
    │   ├── PlatformAdminProvider.jsx
    │   ├── platformAdminContext.js
    │   ├── TenantSessionProvider.jsx
    │   └── tenantSessionContext.js
    │
    ├── hooks/                        # Custom React Hooks
    │   ├── usePlatformAdmin.js
    │   └── useTenantSession.js
    │
    ├── lib/
    │   └── supabase.js               # Client Supabase
    │
    ├── pages/
    │   ├── Login.jsx                 # Rota /login (Pública)
    │   ├── InstitutionsManager.jsx   # Rota /admin/institutions (Platform Admin)
    │   ├── TenantPanelGate.jsx       # Rota /painel (Guarda de sessão do tenant)
    │   ├── InstitutionPanel.jsx      # Painel operacional institucional
    │   └── TvDisplay.jsx             # Rota /tv (Monitor público telão)
    │
    ├── repositories/                 # Camada de Acesso a Dados (DAL - Repositories)
    │   ├── academicGroupRepository.js
    │   ├── academicLevelRepository.js
    │   ├── academicShiftRepository.js
    │   ├── gateRepository.js
    │   ├── pickupEventRepository.js
    │   ├── platformAdminRepository.js
    │   ├── schoolMemberRepository.js
    │   ├── schoolRepository.js
    │   ├── studentEnrollmentRepository.js
    │   ├── studentGroupAssignmentRepository.js
    │   └── studentRepository.js
    │
    └── services/                     # Camada de Serviços de Negócio (DAL - Services)
        ├── academicGroupService.js
        ├── academicLevelService.js
        ├── academicShiftLabels.js
        ├── academicYear.js
        ├── authService.js
        ├── gateOrder.js
        ├── gateService.js
        ├── pickupService.js
        ├── platformAdminResolution.js
        ├── platformAdminService.js
        ├── schoolOpsStore.js
        ├── schoolService.js
        ├── studentEnrollmentService.js
        ├── studentGroupAssignmentService.js
        ├── studentService.js
        ├── tenantAccess.js
        ├── tenantSessionService.js
        ├── themeService.js
        └── core/
            ├── keys.js
            ├── storageClient.js
            └── supabaseClient.js
```

---

## Responsabilidade por pasta

### `supabase/`

Infraestrutura de banco PostgreSQL gerenciada via Supabase CLI.

| Item | Responsabilidade |
|------|------------------|
| `migrations/` | 18 migrations SQL versionadas cobrindo Authentication Core, Academic Core, Student Enrollments, Pickup Core, RLS Foundation, Platform Admins, Constraints de Unicidade e Permissões Operacionais |
| `seed.sql` | Dados iniciais idempotentes (roles, academic_shifts, escola e massa dev acadêmica/portões) |
| `config.toml` | Configuração do ambiente local Supabase |

---

### `scripts/db-auditor/`

Ferramenta técnica interna (**Database Auditor v1**) que valida a fundação do banco de dados local.

Verifica a presença das tabelas esperadas, integridade da fundação de RLS, policies/helper functions e invariantes do seed. Execução: `npm run audit:db`.

---

### `src/repositories/`

Camada especializada de persistência relacional. Cada repositório é responsável por interagir diretamente com as tabelas do PostgreSQL no Supabase via `@supabase/supabase-js`, normalizando queries, selects e mutations.

---

### `src/services/`

Camada de abstração de regras de negócio (DAL). **A camada de apresentação (componentes e páginas) nunca acessa diretamente o Supabase ou o localStorage.**

| Service | Persistência Atual | Papel no Domínio |
|---------|-------------------|------------------|
| `authService` | Supabase Auth (`supabase.auth`) | Login, logout, sessão e estado de autenticação |
| `schoolService` | Supabase (`public.schools`) | CRUD de instituições escolares |
| `gateService` | Supabase (`public.gates`) | Gestão e ordenação de portões de saída |
| `academicLevelService` | Supabase (`public.academic_levels`) | Níveis e etapas educacionais |
| `academicGroupService` | Supabase (`public.academic_groups`) | Turmas e agrupamentos acadêmicos |
| `studentService` | Supabase (`public.students`) | Cadastro base de alunos |
| `studentEnrollmentService` | Supabase (`public.student_enrollments`) | Matrículas por ano letivo |
| `studentGroupAssignmentService` | Supabase (`public.student_group_assignments`) | Enturmação de alunos |
| `pickupService` | Supabase (`public.pickup_events`) | Fila operacional de chamadas e conclusões de saída |
| `platformAdminService` | Supabase RPC (`is_platform_admin`) | Validação de autoridade global de plataforma |
| `tenantAccess` / `tenantSessionService` | Supabase (`public.school_members`) | Resolução e validação de contexto da escola ativa |
| `themeService` | localStorage (`@SmartExit:darkMode`) | Preferência de tema visual (claro/escuro) |
| `schoolOpsStore` | localStorage (`@SmartExit:schoolOps:`) | Cache temporário de apoio operacional de interface |

---

### `src/contexts/` & `src/hooks/`

Provedores de estado reativo global e hooks de consumo seguro:
- **`PlatformAdminProvider` / `usePlatformAdmin`:** gerencia o estado de privilégio de plataforma e previne acessos indevidos a `/admin/institutions`.
- **`TenantSessionProvider` / `useTenantSession`:** resolve a sessão do usuário escolar, identifica as memberships ativas em `school_members` e gerencia a seleção de escolas.

---

### `docs/arquitetura/`

| Arquivo | Conteúdo |
|---------|----------|
| `decisoes.md` | ADRs congeladas 001–028 (fonte de verdade arquitetural permanente) |
| `modelagem.md` | Entidades e relacionamentos de domínio |
| `padroes.md` | Convenções de código, banco e commits |
| `checklist-modelagem.md` | Checklist antes de novas migrations |
| `workflow.md` | Fluxo de trabalho de engenharia |
| `arquitetura-futura.md` | Roadmap arquitetural |
