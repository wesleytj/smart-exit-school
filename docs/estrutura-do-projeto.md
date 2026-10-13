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
│   ├── adr/                          # Architecture Decision Records
│   │   └── 0029-impersonation-user-level-jwt.md
│   ├── infra/                        # Guias de infraestrutura e serviços
│   │   └── smtp-brevo-setup.md
│   ├── impersonation-support-flow.md # Guia operacional do fluxo de impersonation
│   ├── qa-data-governance.md         # Política de dados de QA (reutilizar antes de criar)
│   ├── qa-inventory.md               # Snapshot read-only de fixtures
│   ├── qa-production-smoke.md        # Roteiro operacional de smoke em produção
│   ├── auditoria-isolamento-multi-tenant.md # Spike #47 — auditoria read-only RLS/tenant
│   └── arquitetura/                  # ADRs 001–028, modelagem, padrões
│
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── sounds/call.mp3
│
├── supabase/
│   ├── config.toml
│   ├── functions/                    # Supabase Edge Functions (Deno 2 runtime)
│   │   ├── _shared/                  # Módulos compartilhados (cors.ts, jwt.ts)
│   │   ├── end-impersonation/        # Encerramento de auditoria de impersonation
│   │   │   └── index.ts
│   │   ├── impersonate-user/         # Validação e cunhagem de JWT de suporte
│   │   │   └── index.ts
│   │   └── deno.json                 # Configuração do compilador Deno
│   ├── migrations/                   # 22 migrations SQL versionadas
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
    │   ├── PasswordInput.jsx         # Input de senha com toggle mostrar/ocultar
    │   ├── SchoolYearsSection.jsx    # Gestão de anos letivos configuráveis
    │   ├── StudentCard.jsx           # Card com dados e foto do aluno
    │   ├── SupportBanner.jsx         # Banner global persistente de impersonation
    │   └── TeamManagementSection.jsx # Gestão de equipe e convite de novos membros
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
    │   ├── AcceptInvite.jsx          # Rota /accept-invite (Onboarding e aceite de convite)
    │   ├── ForgotPassword.jsx        # Rota /forgot-password (Recuperação de senha)
    │   ├── InstitutionPanel.jsx      # Painel operacional institucional
    │   ├── InstitutionsManager.jsx   # Rota /admin/institutions (Platform Admin)
    │   ├── Login.jsx                 # Rota /login (Pública)
    │   ├── TenantPanelGate.jsx       # Rota /painel (Guarda de sessão do tenant)
    │   ├── TvDisplay.jsx             # Rota /tv (Monitor público telão)
    │   └── UpdatePassword.jsx        # Rota /update-password (Redefinição de senha)
    │
    ├── repositories/                 # Camada de Acesso a Dados (DAL - Repositories)
    │   ├── academicGroupRepository.js
    │   ├── academicLevelRepository.js
    │   ├── academicShiftRepository.js
    │   ├── gateRepository.js
    │   ├── pickupEventRepository.js
    │   ├── platformAdminRepository.js
    │   ├── schoolInvitationRepository.js
    │   ├── schoolMemberRepository.js
    │   ├── schoolRepository.js
    │   ├── schoolYearRepository.js
    │   ├── studentEnrollmentRepository.js
    │   ├── studentGroupAssignmentRepository.js
    │   └── studentRepository.js
    │
    └── services/                     # Camada de Serviços de Negócio (DAL - Services)
        ├── academicGroupService.js
        ├── academicLevelService.js
        ├── academicShiftLabels.js
        ├── academicStructure.test.js
        ├── academicYear.js
        ├── authPasswordFlows.test.js
        ├── authService.js
        ├── authValidation.js
        ├── cancelCallDialog.js       # Máquina de estados do diálogo de cancelamento
        ├── cancelCallDialog.test.js
        ├── gateOrder.js
        ├── gateService.js
        ├── gateService.test.js
        ├── impersonationEdgeFunctions.test.js
        ├── impersonationFoundation.test.js
        ├── impersonationSecurityAudit.test.js
        ├── impersonationService.js
        ├── impersonationService.test.js
        ├── invitationService.js      # Validação e confirmação de convites institucionais
        ├── memberInvitation.test.js
        ├── multiTenantIsolation.test.js
        ├── passwordVisibility.js
        ├── pickupArchive.test.js
        ├── pickupArchiveService.js   # Invocação da RPC archive_old_pickup_events
        ├── pickupCallFilter.js       # Ordenação e filtros da fila de chamadas
        ├── pickupCallFilter.test.js
        ├── pickupService.js
        ├── pickupService.test.js
        ├── platformAdminResolution.js
        ├── platformAdminResolution.test.js
        ├── platformAdminService.js
        ├── schoolOpsStore.js
        ├── schoolService.js
        ├── schoolYearService.js
        ├── schoolYearService.test.js
        ├── studentEnrollmentService.js
        ├── studentFlow.test.js
        ├── studentGroupAssignmentService.js
        ├── studentService.js
        ├── tenantAccess.js
        ├── tenantAccess.test.js
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

Infraestrutura de banco PostgreSQL e Serverless Edge Functions gerenciada via Supabase CLI.

| Item | Responsabilidade |
|------|------------------|
| `functions/` | Supabase Edge Functions executadas sob runtime **Deno 2**. Contém `impersonate-user`, `end-impersonation`, `invite-member`, `accept-invite` e `_shared/` (`brevo.ts`, `cors.ts`, `jwt.ts`). |
| `migrations/` | 25 migrations SQL versionadas cobrindo Authentication Core, Academic Core, Student Enrollments, Pickup Core, RLS Foundation, Platform Admins, Unicidade, Permissões Operacionais, Cancelamento de Chamadas (`pickup_events_allow_cancellation`), Anos Letivos Configuráveis (`school_years_configurable`), Endurecimento de Grants Multi-Tenant (`multi_tenant_grants_hardening`), Fundação de Impersonation (`create_impersonation_foundation`), Convites de Membros (`create_school_invitations`), Grants RPC (`grant_execute_rpcs`) e Arquivamento de Chamadas (`create_pickup_events_archive`). |
| `seed.sql` | Dados iniciais idempotentes (roles, academic_shifts, escola e massa dev acadêmica/portões). |
| `config.toml` | Configuração do ambiente local Supabase. |

---

### `scripts/db-auditor/`

Ferramenta técnica interna (**Database Auditor v1**) que valida a fundação do banco de dados local.

Verifica a presença das tabelas esperadas, integridade da fundação de RLS, policies/helper functions e invariantes do seed. Execução: `npm run audit:db`.

---

### `src/repositories/`

Camada especializada de persistência relacional. Cada repositório é responsável por interagir diretamente com as tabelas do PostgreSQL no Supabase via `@supabase/supabase-js`, normalizando queries, selects e mutations.

* `schoolYearRepository.js`: queries e mutações de anos letivos (`public.school_years`).
* `pickupEventRepository.js`: acionamento, transição para concluído e cancelamento operacional de chamadas com preenchimento de `cancelled_at`.
* `schoolRepository.js`, `gateRepository.js`, `studentRepository.js`, etc.

---

### `src/services/`

Camada de abstração de regras de negócio (DAL). **A camada de apresentação (componentes e páginas) nunca acessa diretamente o Supabase ou o localStorage.**

| Service | Persistência Atual | Papel no Domínio |
|---------|-------------------|------------------|
| `authService` | Supabase Auth (`supabase.auth`) | Login, logout, sessão e estado de autenticação |
| `impersonationService` | Edge Functions + `sessionStorage` | Orquestração do ciclo de personificação de usuário, sentinela de token, parada de auto-refresh e backup/restauração de sessão |
| `schoolYearService` | Supabase (`public.school_years`) | Gestão de anos letivos configuráveis e alternância atômica do ano ativo |
| `schoolService` | Supabase (`public.schools`) | CRUD de instituições escolares |
| `gateService` | Supabase (`public.gates`) | Gestão e ordenação de portões de saída |
| `academicLevelService` | Supabase (`public.academic_levels`) | Níveis e etapas educacionais |
| `academicGroupService` | Supabase (`public.academic_groups`) | Turmas e agrupamentos acadêmicos |
| `studentService` | Supabase (`public.students`) | Cadastro base de alunos |
| `studentEnrollmentService` | Supabase (`public.student_enrollments`) | Matrículas por ano letivo |
| `studentGroupAssignmentService` | Supabase (`public.student_group_assignments`) | Enturmação de alunos |
| `pickupService` | Supabase (`public.pickup_events`) | Fila operacional de chamadas, cancelamento e conclusões de saída |
| `platformAdminService` | Supabase RPC (`is_platform_admin`) | Validação de autoridade global de plataforma |
| `tenantAccess` / `tenantSessionService` | Supabase (`public.school_members`) | Resolução e validação de contexto da escola ativa |
| `themeService` | localStorage (`@SmartExit:darkMode`) | Preferência de tema visual (claro/escuro) |
| `schoolOpsStore` | localStorage (`@SmartExit:schoolOps:`) | Cache temporário de apoio operacional de interface |

---

### `src/components/` & `src/pages/`

Camada de apresentação puramente declarativa:
- **`SupportBanner.jsx`:** banner fixo no topo da aplicação exibido durante sessões de impersonation, com indicação do usuário alvo, timer regressivo (45 min) e botão de saída.
- **`SchoolYearsSection.jsx`:** interface para cadastro e ativação de anos letivos no painel institucional.
- **`PasswordInput.jsx`:** componente de input com alternância visual entre texto e senha oculta.
- **`ForgotPassword.jsx` & `UpdatePassword.jsx`:** fluxo de recuperação e redefinição de senhas com links mágicos e tokens de e-mail transacional.
- **`InstitutionsManager.jsx`:** painel administrativo do Super Admin com catálogo global de usuários e botão de personificação.

---

### `src/contexts/` & `src/hooks/`

Provedores de estado reativo global e hooks de consumo seguro:
- **`PlatformAdminProvider` / `usePlatformAdmin`:** gerencia o estado de privilégio de plataforma e previne acessos indevidos a `/admin/institutions`.
- **`TenantSessionProvider` / `useTenantSession`:** resolve a sessão do usuário escolar, identifica as memberships ativas em `school_members` e gerencia a seleção de escolas.

---

### `docs/` & `docs/adr/`

| Arquivo / Diretório | Conteúdo |
|---------------------|----------|
| `docs/adr/0029-impersonation-user-level-jwt.md` | ADR-029: Impersonation User-Level com JWT Manual assinado em Edge Function (Deno) |
| `docs/impersonation-support-flow.md` | Guia de suporte operacional de ponta a ponta para impersonation |
| `docs/infra/smtp-brevo-setup.md` | Configuração de relay SMTP transacional com Brevo |
| `docs/arquitetura/decisoes.md` | ADRs congeladas 001–028 (fonte de verdade arquitetural permanente) |
| `docs/arquitetura/modelagem.md` | Entidades e relacionamentos de domínio |
| `docs/arquitetura/padroes.md` | Convenções de código, banco e commits |
| `docs/arquitetura/checklist-modelagem.md` | Checklist antes de novas migrations |
| `docs/arquitetura/workflow.md` | Fluxo de trabalho de engenharia |
| `docs/arquitetura/arquitetura-futura.md` | Roadmap arquitetural |
