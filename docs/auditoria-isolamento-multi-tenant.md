# Spike — Auditoria read-only de isolamento multi-tenant, RLS e contexto de escola

**Tipo:** Research / Spike  
**Issue:** #47  
**Data:** 2026-09-22  
**HEAD de `main` na base:** `878b35db3273e1065cfe0a816a5de1b0b30aaeeb`  
**Workflow:** `ai/aads/workflows/research-spike-workflow.md`  
**Template:** `ai/aads/templates/research-template.md`  
**ADR nesta atividade:** não  

Este relatório é o artefato do Spike. Não altera schema, RLS, Auth, produto ou dados de domínio.

## 1. Escopo e limites

### 1.1 Objetivo

Verificar, com evidência de implementação e configuração reais, se o isolamento multi-tenant do Smart Exit School (SES) está coerente entre:

- schema e migrations;
- RLS, grants e funções auxiliares;
- Auth, sessão e contexto de escola;
- queries da aplicação;
- fluxos de Platform Admin e pickup core;
- ADRs e documentação.

### 1.2 Read-only

Read-only aplica-se a banco, schema, migrations, RLS, Auth, Supabase, dados de domínio, dados de QA e configurações funcionais do produto.

Permitido: inspeção, consultas de catálogo, lint, build e artefatos Git/documentais do Spike.

### 1.3 Fora de escopo (respeitado)

Não houve alteração de código funcional, schema, migrations, RLS, grants, Auth, seed, CI ou dados. Não houve `db reset`. Não foram investigados como bug o `plan` live versus seed nem `updated_at`. Não houve Browser E2E.

### 1.4 Decisão de workflow e branch

- Classificação: **Spike** (investigação; entrega documental; sem código de produção).
- `branch-strategy.md` define `feature/`, `fix/`, `hotfix/`, `docs/`, `refactor/`, `chore/`. **Não define** `research/`.
- Como a entrega é somente documentação técnica em `docs/`, a branch usada é `docs/47-tenant-isolation-audit`.
- Caminho canônico do relatório: `docs/` (`standards/documentation-standard.md`). Relatórios em `ai/aads/reports/` são de auditoria do padrão AADS, não do produto SES.

### 1.5 Política QA

Reutilizar antes de criar. Nenhum dado QA foi criado, alterado ou removido. Consulta excepcional: apenas `COUNT` da instituição canônica por ID + slug já públicos em `docs/qa-inventory.md`.

Registros protegidos não foram tocados: `qa-temp-save-pending`, `smart-exit-dev-school`, `qa-cursor-escola-teste`.

## 2. Fontes inspecionadas

### 2.1 AADS e processo

- `ai/aads/constitution/constitution.md`
- `ai/aads/engine/aads-operating-model.md`
- `ai/aads/engine/automatic-checks.md`
- `ai/aads/standards/work-item-classification.md`
- `ai/aads/workflows/research-spike-workflow.md`
- `ai/aads/templates/research-template.md`
- `ai/aads/standards/git-workflow.md`
- `ai/aads/standards/branch-strategy.md`
- `ai/aads/standards/documentation-standard.md`
- `ai/aads/standards/testing-standard.md`
- `ai/aads/standards/artifact-lifecycles.md`
- `ai/aads/checklists/git-checklist.md`
- `ai/aads/checklists/definition-of-done.md`
- `ai/aads/adr/adr-001.md`, `adr-002.md`, `adr-003.md`

### 2.2 ADRs e docs do produto

- `docs/arquitetura/decisoes.md` (em especial ADR-028 — Platform vs Tenant)
- `docs/banco-de-dados.md`
- `docs/autenticacao.md`
- `docs/permissoes.md`
- `docs/qa-data-governance.md`
- `docs/qa-inventory.md`
- `docs/ci.md`, `.github/workflows/ci.yml`, `package.json`

### 2.3 Ciclos recentes (referência, não reexecução)

#33 unicidade de nome; #36 persistência de plano; #38 save pending; #41 CI remoto; #43 governança QA; #45 instituição QA canônica.

### 2.4 Código e schema

- `supabase/migrations/` (12 arquivos)
- `supabase/seed.sql` (somente leitura de conteúdo versionado)
- `supabase/config.toml`
- `src/App.jsx`, `Login.jsx`, `InstitutionsManager.jsx`, `InstitutionPanel.jsx`, `TvDisplay.jsx`
- `src/contexts/PlatformAdminProvider.jsx`, `src/hooks/usePlatformAdmin.js`
- `src/services/*`, `src/repositories/*`, `src/lib/supabase.js`
- `scripts/db-auditor/*`, `scripts/validate-rls-foundation.mjs`

Documentação **não** foi tratada como prova suficiente. Cada conclusão relevante aponta migration, policy aplicada, grant, arquivo de código ou consulta read-only.

## 3. Auditoria Git inicial

| Item | Resultado |
|---|---|
| Branch na auditoria inicial | `main` |
| HEAD | `878b35db3273e1065cfe0a816a5de1b0b30aaeeb` |
| `origin/main` | idêntico |
| Worktrees | somente o worktree principal |
| Untracked preservados (fora de escopo) | `.cursor/rules.rar`, `.cursor/rules/rules/`, `CONSOLIDADO-*.md` |
| Issue/PR duplicada desta auditoria | nenhuma |

## 4. Mapa das entidades relevantes

Legenda de vínculo: **escola** = `schools.id`; **perfil** = `profiles.id` = `auth.users.id`; **membership** = `school_members`.

| Tabela | Ownership / vínculo | RLS aplicada (live + migrations) | Superfície da aplicação |
|---|---|---|---|
| `schools` | Tenant raiz (`slug` unique, `name` unique #33) | SELECT: membro ativo **ou** Platform Admin. UPDATE: owner/administrator **ou** Platform Admin. INSERT/DELETE: **somente** Platform Admin | `schoolRepository` / `schoolService` / `InstitutionsManager` |
| `profiles` | 1:1 com `auth.users` | SELECT/INSERT/UPDATE próprios (`id = auth.uid()`). Sem DELETE policy | Trigger `handle_new_user`. App **não** consulta a tabela |
| `school_members` | `(school_id, profile_id)` unique; `role_id` → `roles` | SELECT se `is_active_school_member(school_id)`. Sem policies de escrita para `authenticated` | App **não** consulta nem grava |
| `roles` | Catálogo global de papéis de tenant | SELECT para `authenticated` | Não usado no frontend |
| `platform_admins` | `profile_id` PK; autoridade Platform (ADR-028) | SELECT da própria linha. Sem INSERT/UPDATE/DELETE para cliente | App usa RPC `is_platform_admin()`, não a tabela |
| `academic_levels`, `academic_groups` | `school_id` | CRUD se membro ativo | Não usado no frontend |
| `academic_shifts` | Catálogo global | SELECT autenticado | Não usado no frontend |
| `students` | `school_id` | CRUD se membro ativo | Não usado. Painel usa `studentsList` na sessão local |
| `student_enrollments` | `student_id` → `students` | CRUD via `can_access_student_enrollment` / membership do aluno | Não usado |
| `student_group_assignments` | enrollment + `academic_groups` | CRUD se acesso a ambos | Não usado |
| `gates` | `school_id` | CRUD se membro ativo | Schema exist; UI usa `gateService` → localStorage |
| `pickup_events` | `school_id` + enrollment + `gate_id`; unique parcial de chamada ativa | CRUD se membership **e** acesso a enrollment **e** gate | Schema exist; UI usa `callService` → localStorage |

### 4.1 Catálogo live (2026-09-22, Postgres local)

Consulta: `docker exec supabase_db_smart-exit-school psql` — apenas `SELECT` de catálogo e `COUNT`. Sem dump de linhas de domínio.

- 12 migrations aplicadas, da `20260628155403` até `20260904180000`.
- 13 tabelas `public` de aplicação; **RLS habilitado em todas**; `FORCE RLS` = false.
- 39 policies; nomes coincidem com as migrations 0005 + Platform Admin.
- Contagens: `schools=3`, `profiles=1`, `school_members=0`, `platform_admins=1`, `students=1`, `gates=3`, `pickup_events=0`.
- Instituição QA canônica: `COUNT(*) = 1` para `id = 76f29d9f-c6fd-4561-89f8-403fef0ccb40` **e** `slug = qa-cursor-escola-teste`.

### 4.2 Grants live (`authenticated` / `anon` / `service_role`)

Comprovado no catálogo:

- `authenticated` tem `SELECT` nas tabelas de fundação **exceto** `profiles` (sem GRANT de tabela para `authenticated`).
- `authenticated` tem `SELECT, INSERT, UPDATE, DELETE` **somente** em `schools` (além de metadados `REFERENCES/TRIGGER/TRUNCATE`).
- `authenticated` tem `SELECT` em `platform_admins`.
- Tabelas acadêmicas e de pickup **não** têm GRANT de `INSERT/UPDATE/DELETE` para `authenticated`, apesar das policies de escrita da 0005.
- `anon` não tem `SELECT` nas tabelas de aplicação.
- `service_role` **não** tem `SELECT/INSERT/UPDATE/DELETE` nas tabelas de aplicação (alinhado a `auto_expose_new_tables` não definido em `config.toml` e ao README do Database Auditor).

### 4.3 Funções auxiliares (live)

Todas `SECURITY DEFINER`: `is_active_school_member(uuid)`, `can_access_student_enrollment(uuid)`, `can_access_academic_group(uuid)`, `can_access_gate(uuid)`, `is_platform_admin()`, `handle_new_user()`.

`EXECUTE` em `PUBLIC` para as helpers; `is_platform_admin` também tem `GRANT EXECUTE` explícito a `authenticated` (migration 0011).

## 5. Mapa do fluxo de tenant context

```text
Login.jsx
  → supabase.auth.signInWithPassword
      → platformAdminService.isPlatformAdmin(user.id)
          → RPC public.is_platform_admin()  [SECURITY DEFINER, auth.uid()]
              → se true: /admin/institutions
              → se false: signOut + erro de permissão Platform
  → fallback authService.login(email, password)
      → schoolService.getAllSchools()  [PostgREST public.schools]
      → match school.email === email && school.password === password
      → storageClient.set('@SmartExit:loggedSchool')
      → /painel
```

### 5.1 Obtenção de sessão

| Canal | Implementação comprovada | Sessão |
|---|---|---|
| Platform Admin | `supabase.auth` em `Login.jsx` + `PlatformAdminProvider` (`getSession` + `onAuthStateChange`) | JWT Auth |
| Operador de escola (pickup UI) | `authService` + `storageClient` (`@SmartExit:loggedSchool`) | JSON no `localStorage` |
| Telão `/tv` | lê a mesma chave de `localStorage`; rota sem guard de Auth | JSON no `localStorage` |

### 5.2 Identificação de usuário/perfil

- Platform: `session.user.id` tratado como `profiles.id` (FK da 0001). Sync de signup: trigger `on_auth_user_created` → `handle_new_user()`.
- Tenant UI: não há `auth.uid()` no painel. O “usuário” é o objeto escola persistido no browser, não um `profile` / `school_members`.

### 5.3 Associação a escola

- Banco: `school_members` (status `active`) é o único vínculo tenant↔perfil nas policies.
- Live: **zero** linhas em `school_members`. Isolamento por membership **não pode ser exercido** no ambiente local sem criar dados (proibido neste Spike).
- App Platform: associação é cross-tenant via `is_platform_admin()`, sem membership (ADR-028).
- App pickup: associação é o `id` da escola no objeto de `localStorage`.

### 5.4 Propagação para queries e rotas

- `App.jsx`: rotas públicas de roteamento (`/login`, `/admin/institutions`, `/painel`, `/tv`). **Não** há `ProtectedRoute` global.
- Guard Platform: somente em `InstitutionsManager.jsx` (`usePlatformAdmin`; redirect para `/login` se não-admin).
- Guard painel: `InstitutionPanel` exige `@SmartExit:loggedSchool`; se ausente, navega para `/login`.
- `schoolRepository` não filtra `school_id` no cliente: `select('*')` / `insert` / `update` / `delete` em `schools`. Isolamento, se houver, depende de RLS + papel da sessão Auth.
- Pickup: `gateService` / `callService` prefixam chaves com `schoolId` no `localStorage`. Não há query Supabase.

## 6. Análise por fluxo

### 6.1 Platform Admin

**Comprovado no código e no banco:**

1. Login tenta Auth primeiro (`Login.jsx`).
2. Autoridade vem de `platform_admins` via RPC, não de `school_members` (ADR-028 implementada nesse ponto).
3. Policies de ciclo de vida de `schools` incluem `is_platform_admin()` (migrations 0008 e 0012).
4. UI de instituições só carrega lista após `isPlatformAdmin === true` e persiste via `schoolService` → PostgREST.
5. Logout Platform: `supabase.auth.signOut()`.

**Parcialmente comprovado / limitações:**

- Guard é só de página, não de rota no `App.jsx`. A proteção efetiva de dados de `schools` para quem **tem** JWT ainda depende de RLS; quem **não** tem sessão Auth não recebe `SELECT` (`anon` sem SELECT).
- `platformAdminService.isPlatformAdmin(profileId)` recebe `profileId` mas a RPC ignora o argumento e usa `auth.uid()`. O parâmetro é cosmética; o comportamento real está na sessão.
- Impersonation (ADR-028) **ausente** na aplicação e nas policies de tabelas de tenant. Platform Admin **não** tem `is_platform_admin()` nas policies de `students`, `gates` ou `pickup_events`. Isso é coerente com “Platform não é membership”, mas também significa que o admin de plataforma **não** lê pickup acadêmico via API autenticada.

**Documentação desatualizada (não é prova da implementação atual):**

- `docs/autenticacao.md` e `docs/permissoes.md` ainda descrevem Super Admin hardcoded (`admin@alltech.com` / `admin123`) e catálogo `@SmartExit:schools`. O código de `Login.jsx` já usa Supabase Auth + RPC.

### 6.2 Fluxo de instituições

Alinhado ao ciclo #16/#31/#33/#36/#38:

- Unicidade de nome: constraint `schools_name_unique` aplicada no catálogo.
- Persistência só em Supabase para o catálogo (`schoolRepository`).
- Save pending e nome vazio: no formulário de `InstitutionsManager` (não reauditados como Feature aqui).

Isolamento: um Platform Admin autenticado, pelas policies atuais, **vê e pode mutar todas as escolas**. Isso é autoridade de plataforma, não vazamento entre tenants.

### 6.3 Pickup core

**Schema (comprovado):** `gates` e `pickup_events` com FKs para escola, matrícula e portão; índice único parcial de chamada ativa; RLS de membership + coerência enrollment/gate.

**Aplicação (comprovado):** o painel e a TV **não** leem `public.gates` nem `public.pickup_events`. `grep` em `src/` não encontra `.from('gates')` nem `.from('pickup_events')`. Chamadas e portões operacionais estão em `@SmartExit:gates:{schoolId}` e `@SmartExit:called:{schoolId}`.

`InstitutionPanel.jsx` ainda contém `MOCK_SCHOOLS` (email/senha em constante de frontend). `schoolService.seedInitialMock` **não** grava esses mocks: apenas `getAllSchools()`. O fallback `authService.login` procura `email`/`password` em linhas de `schools`; essas colunas **não existem** no schema 0001. Portanto o login tenant por e-mail/senha de escola **não tem base no banco atual**.

Isolamento do pickup na UI é **por chave de `localStorage` no mesmo browser**, não por RLS. Não há evidência, neste Spike, de que a UI escreva `pickup_events` de outro tenant no Postgres — porque ela não escreve `pickup_events`.

## 7. Matriz de evidências

| Controle | Classificação | Evidência |
|---|---|---|
| RLS habilitado nas 13 tabelas de aplicação | **Comprovado** | `pg_class.relrowsecurity`; Auditor v1 PASS |
| Policies de membership (0005) presentes | **Comprovado** | `pg_policies` + migrations; Auditor v1 PASS |
| Helpers `SECURITY DEFINER` de membership | **Comprovado** | catálogo `pg_proc` + migration 0005 |
| Isolamento SELECT entre dois tenants via JWT | **Não comprovado nesta auditoria** | `school_members = 0`; `validate:rls` saiu em modo parcial (sem smoke JWT). Criar memberships/usuários foi proibido |
| Grants SELECT da fundação (exceto `profiles`) | **Comprovado** | `role_table_grants` + Auditor PASS |
| `profiles` com policy e sem GRANT `authenticated` | **Comprovado** (postura conhecida) | Auditor WARN; catálogo live |
| Policies de escrita acadêmica/pickup sem GRANT de escrita | **Comprovado** | 0005 vs grants live |
| Platform Admin fora de `school_members` | **Comprovado** | tabela `platform_admins`, RPC, ADR-028, `Login.jsx` |
| CRUD RLS de `schools` para Platform Admin | **Comprovado** (definição + grants) | migrations 0008/0012; grants INSERT/UPDATE/DELETE; código `schoolRepository` |
| Isolamento runtime Platform vs não-admin na API `schools` | **Parcialmente comprovado** | código de guard + policies; sem teste JWT autenticado neste Spike |
| Contexto tenant via `school_members` na UI | **Ausente** | nenhum uso da tabela no `src/` |
| Sessão tenant Auth (não-Platform) | **Ausente** (fallback localStorage) | `authService.js` |
| Pickup persistido em `pickup_events` | **Ausente** na aplicação atual | `callService.js`; docs/banco-de-dados.md confirma o gap |
| Isolamento pickup no Postgres | **Documentado, mas não comprovado em runtime** | policies existem; `pickup_events = 0`; app não exercita |
| Docs `autenticacao.md` / `permissoes.md` = implementação | **Documentado, mas não comprovado** (divergência) | hardcoded admin vs Auth real |
| Impersonation Platform → tenant | **Ausente** | ADR-028 conceitual; sem código/policies |
| Vazamento comprovado de dados de um tenant para outro via API | **Não encontrado** | sem memberships, pickup não vai ao banco, Platform vê todas as escolas por desenho |
| Database Auditor v1 como prova da fundação 0001–0005 | **Parcialmente comprovado** | schema/RLS/grants PASS; 1 FAIL de seed `plan`/`name` em `smart-exit-dev-school` — **fora de escopo** deste Spike (política #45 / inventário QA) |

## 8. Achados, hipóteses e limitações

### 8.1 Achados confirmados (fatos, não “bugs inventados”)

1. A fundação RLS por membership está versionada, aplicada e coerente internamente para SELECT de dados de tenant.
2. O produto que hoje fala com o banco autenticado é o **Platform Admin do catálogo `schools`**.
3. O pickup core da UI é **legado `localStorage`**, desalinhado do schema (já descrito em `docs/banco-de-dados.md`).
4. Não há memberships no banco local; o smoke `validate:rls` não chegou a comparar dois JWTs.
5. A documentação de autenticação/permissões do frontend está atrás do código de login Platform.

### 8.2 Hipóteses descartadas

- **“O Spike precisa achar uma falha de RLS para valer.”** Descartada. Não há evidência de vazamento API tenant-a-tenant no caminho que a aplicação realmente usa.
- **“Platform Admin ver todas as escolas é quebra de isolamento.”** Descartada como falha: é o modelo ADR-028.
- **“Auditor FAIL de seed prova regressão de isolamento.”** Descartada neste ciclo: divergência de `plan`/`name` do seed está explicitamente fora de escopo.

### 8.3 Limitações

- Sem fixtures de dois usuários/tenants, isolamento JWT permanece não demonstrado.
- `validate:rls` não obteve `SUPABASE_SERVICE_ROLE_KEY` no `.env` da máquina (mensagem de “infraestrutura indisponível”); a tabela `school_members` **existe**. Não foram lidos segredos para forçar o teste.
- Não houve exercício Browser do login (proibido criar/usar dados QA funcionalmente).
- Grants de `service_role` sem DML nas tabelas de app: o Data API privilegiado local não é caminho de prova deste Spike.

## 9. Alternativas para o próximo ciclo

| Opção | Prós | Contras |
|---|---|---|
| A. Não abrir correção imediata | Respeita evidência: sem vazamento comprovado; RLS de fundação coerente; produto Platform Admin alinhado | Deixa o gap tenant Auth / pickup localStorage para depois |
| B. Feature: Auth tenant + `school_members` na sessão | Fecha o maior desalinhamento app↔ADR | Trabalho grande; exige dados/fixtures; G-SEC / G-DB |
| C. Feature: persistir pickup em `gates` / `pickup_events` | Usa o schema já existente | Sem Auth tenant, RLS de membership não tem ator; grants de escrita ainda faltam |
| D. “Corrigir RLS” agora (grants, FORCE RLS, Platform em tabelas de tenant) | — | **Não justificado** por vazamento comprovado; misturaria Platform e tenant sem impersonation |

### Critérios

Não criar Feature só para ocupar o backlog. Priorizar o caminho que o produto realmente executa. Não tratar gap de documentação histórica como incidente de segurança.

## 10. Recomendação

**Opção A — não abrir correção imediata de RLS, schema, Auth ou policies.**

Justificativa: os controles que o SES **usa hoje** (Auth Platform + RLS de `schools` + RPC `is_platform_admin`) estão implementados de forma coerente com ADR-028. Os controles de membership do pickup **existem no banco** e **não são usados pela UI**. Não há evidência de falha de isolamento no caminho em produção atual do catálogo.

Quando a equipe escolher evoluir o produto, o próximo ciclo deve ser **uma** Feature (Issue nova), não um “fix de auditoria”:

1. **Preferência:** autenticação/contexto de usuário de escola (Supabase Auth + `school_members`), **ou**
2. persistência operacional de pickup no schema, **depois** que existir ator autenticado de tenant.

Não implementar nenhuma dessas opções nesta Issue/PR.

**ADR necessária?** Não para este relatório.

## 11. Confirmações de não escrita

- Comandos de banco: apenas `SELECT` via `psql` e leitores do Auditor / `validate:rls` (este último em modo parcial, sem mutação).
- Nenhum `INSERT`/`UPDATE`/`DELETE`/`db reset`.
- Nenhum dado QA criado, alterado ou removido.
- Instituição canônica: apenas `COUNT` por ID e slug já documentados.
