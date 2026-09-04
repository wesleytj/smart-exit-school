# Banco de Dados — Smart Exit School

## Situação atual (híbrida)

O projeto opera em **dois modelos de persistência simultâneos**:

| Camada | Tecnologia | Status | Uso no runtime |
|--------|------------|--------|----------------|
| **PostgreSQL (Supabase)** | Migrations SQL | Schema parcial implementado | Catálogo `schools` via `schoolService` (CRUD) |
| **localStorage** | `storageClient` + services | Ativo em produção frontend | Sessão (`loggedSchool`), chamadas, portões, tema |

A migração para Supabase está **em andamento**. O schema relacional já cobre autenticação, núcleo acadêmico, fundação operacional de saída (Pickup Core) e a **fundação de RLS** (Migration 0005). A maior parte do frontend ainda persiste via localStorage.

- Documentação de modelagem de domínio: [arquitetura/modelagem.md](arquitetura/modelagem.md)
- Decisões arquiteturais (ADRs): [arquitetura/decisoes.md](arquitetura/decisoes.md)

---

## PostgreSQL — Schema implementado

A fundação atual do banco vai até a **Migration 0005 — RLS Foundation**.

Migrations em `supabase/migrations/`:

| Migration | Arquivo | Domínio |
|-----------|---------|---------|
| 0001 | `20260628155403_create_authentication_core.sql` | Authentication Core |
| 0002 | `20260701014657_create_academic_core.sql` | Academic Core |
| 0003 | `20260702204601_create_student_group_assignments.sql` | Academic Enrollment Assignment |
| 0004 | `20260703154000_create_pickup_core_foundation.sql` | Pickup Core |
| 0005 | `20260706180031_enable-rls-foundation.sql` | RLS Foundation |
| 0013 | `20260904180000_add_schools_name_unique.sql` | UNIQUE `public.schools.name` |

Migrations 0006–0012 cobrem Platform Admin, policies extras de `schools` e bootstrap de auth; não alteram a unicidade de `name`.

**Seed idempotente:** `supabase/seed.sql`

Atualmente o seed cobre:

- `roles`
- `academic_shifts`
- Massa mínima de desenvolvimento para validação do domínio acadêmico:
  - escola
  - nível acadêmico
  - turmas
  - aluno
  - matrícula
  - vínculo da matrícula com turma
- Portões de exemplo (`gates`) para a escola de desenvolvimento

O seed atual **não cria** `auth.users`, `profiles`, `school_members` nem `pickup_events`. Essa ausência é lacuna conhecida do baseline de desenvolvimento, não violação do contrato do `seed.sql`.

### Diagrama ER (PostgreSQL)

```mermaid
erDiagram
    schools ||--o{ school_members : has
    schools ||--o{ academic_levels : has
    schools ||--o{ academic_groups : has
    schools ||--o{ students : has
    schools ||--o{ gates : has
    schools ||--o{ pickup_events : has

    profiles ||--o{ school_members : has
    roles ||--o{ school_members : assigns

    academic_levels ||--o{ academic_groups : contains
    academic_shifts ||--o{ academic_groups : schedules

    students ||--o{ student_enrollments : has
    student_enrollments ||--o{ student_group_assignments : assigned_to
    student_enrollments ||--o{ pickup_events : triggers
    academic_groups ||--o{ student_group_assignments : receives
    gates ||--o{ pickup_events : receives

    schools {
        uuid id PK
        text slug UK
        text name UK
        text status
        text plan
        text timezone
        text locale
        text currency
        text logo_url
        text primary_color
        text secondary_color
        text external_id
        timestamptz created_at
        timestamptz updated_at
    }

    profiles {
        uuid id PK_FK_auth_users
        text full_name
        text avatar_url
        text phone
    }

    roles {
        uuid id PK
        text name UK
        text description
    }

    school_members {
        uuid id PK
        uuid school_id FK
        uuid profile_id FK
        uuid role_id FK
        text status
    }

    academic_levels {
        uuid id PK
        uuid school_id FK
        text name
        int display_order
        text status
    }

    academic_shifts {
        uuid id PK
        text name UK
        text description
    }

    academic_groups {
        uuid id PK
        uuid school_id FK
        uuid academic_level_id FK
        uuid academic_shift_id FK
        text name
        int display_order
        text status
    }

    students {
        uuid id PK
        uuid school_id FK
        text student_identifier
        text full_name
        date birth_date
        text status
    }

    student_enrollments {
        uuid id PK
        uuid student_id FK
        int academic_year
        text status
    }

    student_group_assignments {
        uuid id PK
        uuid student_enrollment_id FK
        uuid academic_group_id FK
        text status
        timestamptz assigned_at
        timestamptz created_at
        timestamptz updated_at
    }

    gates {
        uuid id PK
        uuid school_id FK
        text name
        text description
        int display_order
        text status
        timestamptz created_at
        timestamptz updated_at
    }

    pickup_events {
        uuid id PK
        uuid school_id FK
        uuid student_enrollment_id FK
        uuid gate_id FK
        text status
        timestamptz called_at
        timestamptz completed_at
        timestamptz cancelled_at
        timestamptz created_at
        timestamptz updated_at
    }
```

### Fluxo de desenvolvimento local

O desenvolvimento de novas alterações no schema utiliza a Supabase CLI em conjunto com o Docker.

**Fluxo padrão:**

```bash
npx supabase start
npx supabase db reset
npm run audit:db
```

- `supabase start` — sobe a stack local do Supabase (PostgreSQL, Studio, Auth e demais serviços necessários)
- `supabase db reset` — recria o banco local, aplica todas as migrations e executa o `seed.sql`
- `npm run audit:db` — valida a fundação do banco local até a Migration 0005 (Database Auditor v1)

Esse fluxo é **obrigatório** para validar migrations antes de abrir Pull Request.

---

## Database Auditor v1

Ferramenta técnica que **valida a fundação do banco local até a Migration 0005**. Implementação em `scripts/db-auditor/`.

**Não confundir com Audit Core:** o Database Auditor v1 verifica o contrato técnico da fundação (migrations **0001–0005** + `seed.sql`). O **Audit Core** (`audit_logs` e afins) é um domínio funcional futuro e ainda não existe no PostgreSQL. O Auditor v1 **não** substitui testes funcionais nem o futuro Audit Core.

### Objetivo

Detectar drift entre a base local e o contrato declarado pelas migrations **0001–0005** e pelo `supabase/seed.sql`, após um `db reset`.

### O que o Auditor v1 valida

- presença das tabelas esperadas da fundação;
- RLS foundation habilitado nas tabelas esperadas;
- existência das policies e helper functions de RLS esperadas (Migration 0005);
- invariantes do seed atual;
- resultados com status `PASS` / `FAIL` / `WARN` / `SKIP` (exit code ≠ 0 apenas com `FAIL`).

### O que o Auditor v1 não valida

- matriz completa de `GRANT`s;
- inventário completo de índices, constraints e FKs;
- isolamento multi-tenant em runtime (JWT / memberships);
- Audit Core / `audit_logs`;
- testes funcionais ou de autorização ponta a ponta da aplicação.

### Comando

```bash
npm run audit:db
```

### Fluxo recomendado

```bash
npx supabase start
npx supabase db reset
npm run audit:db
```

Documentação do módulo: [scripts/db-auditor/README.md](../scripts/db-auditor/README.md).

O script legado `npm run validate:rls` continua disponível como smoke parcial de RLS e **não** substitui o Auditor v1.

---

## Tabelas — Authentication Core

### `schools`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `slug` | text | NOT NULL, UNIQUE |
| `name` | text | NOT NULL, UNIQUE (`schools_name_unique`) |
| `status` | text | NOT NULL, default `trial`, CHECK: `trial` / `active` / `inactive` / `suspended` |
| `plan` | text | NOT NULL, default `basic`, CHECK: `basic` / `pro` / `enterprise` |
| `timezone` | text | NOT NULL, default `America/Sao_Paulo` |
| `locale` | text | NOT NULL, default `pt-BR` |
| `currency` | text | NOT NULL, default `BRL` |
| `logo_url` | text | nullable |
| `primary_color` | text | nullable |
| `secondary_color` | text | nullable |
| `external_id` | text | nullable |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

**Índices:** `idx_schools_external_id`, `idx_schools_status`, `idx_schools_plan`; UNIQUE `schools_name_unique` em `name` (além do UNIQUE de `slug`)

**ADR-005:** a tabela `schools` não armazena e-mail/senha. Credenciais pertencem ao Supabase Auth.

### `roles`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `name` | text | NOT NULL, UNIQUE, CHECK: `owner` / `administrator` / `secretary` / `gatekeeper` |
| `description` | text | nullable |

### `profiles`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `full_name` | text | NOT NULL |

### `school_members`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `school_id` | uuid | FK → `schools(id)` ON DELETE CASCADE |
| `profile_id` | uuid | FK → `profiles(id)` ON DELETE CASCADE |
| `role_id` | uuid | FK → `roles(id)` ON DELETE RESTRICT |
| `status` | text | CHECK: `active` / `inactive` |
| | | UNIQUE `(school_id, profile_id)` → `school_members_school_profile_unique` |

**Índices:** `idx_school_members_school_id`, `idx_school_members_profile_id`, `idx_school_members_role_id`

---

## Tabelas — Academic Core

### `academic_levels`

Representa os níveis acadêmicos disponíveis dentro de uma escola, como Educação Infantil, Ensino Fundamental ou Ensino Médio.

**Regras principais:**

- FK `school_id` → `schools(id)` ON DELETE CASCADE
- UNIQUE `(school_id, name)` → `academic_levels_school_name_unique`
- CHECK `display_order > 0`
- Status padronizado: `active` / `inactive`

### `academic_shifts`

Catálogo global de turnos acadêmicos.

**Valores seedados atualmente:**

- `morning`
- `afternoon`
- `full_time`
- `night`

**Regras principais:**

- UNIQUE em `name`

### `academic_groups`

Representa as turmas da escola.

**Exemplos:** EF3MA, EF3TA

Cada turma pertence a:

- uma escola
- um nível acadêmico
- um turno acadêmico

**Regras principais:**

- FK `school_id` → `schools(id)` ON DELETE CASCADE
- FK `academic_level_id` → `academic_levels(id)` ON DELETE RESTRICT
- FK `academic_shift_id` → `academic_shifts(id)` ON DELETE RESTRICT
- UNIQUE `(school_id, academic_level_id, academic_shift_id, name)`

### `students`

Representa o aluno como entidade acadêmica da escola.

**Regras principais:**

- FK `school_id` → `schools(id)` ON DELETE CASCADE
- UNIQUE `(school_id, student_identifier)` → `students_school_identifier_unique`
- CHECK `birth_date <= current_date`

### `student_enrollments`

Representa a matrícula do aluno em um determinado ano letivo.

A modelagem separa aluno de matrícula, permitindo que um mesmo aluno tenha múltiplas matrículas ao longo dos anos, sem duplicar a entidade `students`.

**Regras principais:**

- FK `student_id` → `students(id)` ON DELETE CASCADE
- UNIQUE `(student_id, academic_year)` → `student_enrollments_student_year_unique`

### `student_group_assignments`

Representa o vínculo entre a matrícula do aluno e a turma acadêmica em que ele está alocado.

Essa tabela foi introduzida na **Migration 0003** para resolver uma lacuna importante do domínio: antes dela, existiam alunos, matrículas e turmas, mas o banco ainda não possuía a ligação formal entre matrícula e turma.

#### Finalidade no Smart Exit School

Para o domínio atual do sistema, o que importa é saber **em qual turma a matrícula está ativa agora**, para que a chamada de saída aconteça na turma correta.

O sistema **não modela histórico de transferências entre turmas** neste momento. Por isso, a tabela foi desenhada para atender o cenário operacional atual do produto, sem introduzir complexidade desnecessária.

#### Colunas principais

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `student_enrollment_id` | uuid | NOT NULL, FK → `student_enrollments(id)` ON DELETE CASCADE |
| `academic_group_id` | uuid | NOT NULL, FK → `academic_groups(id)` ON DELETE RESTRICT |
| `status` | text | NOT NULL, default `active`, CHECK: `active` / `inactive` |
| `assigned_at` | timestamptz | NOT NULL, default `now()` |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

#### Índices

- `idx_student_group_assignments_enrollment_id`
- `idx_student_group_assignments_group_id`

#### Regra central de negócio

A tabela possui um **índice único parcial**:

`student_group_assignments_active_enrollment_unique`

Esse índice garante que **uma mesma matrícula só pode possuir um vínculo ativo com turma por vez**.

Em outras palavras:

- um aluno pode ter uma matrícula em 2026
- essa matrícula precisa apontar para uma turma atual
- o banco impede duas turmas ativas simultâneas para a mesma matrícula

Isso foi validado em ambiente local com tentativa de inserir um segundo vínculo ativo para a mesma matrícula, gerando corretamente erro de violação de unicidade.

---

## Tabelas — Pickup Core

Introduzidas na **Migration 0004**. Modelam a fundação operacional do fluxo de saída escolar: portões físicos/lógicos da instituição e eventos de chamada de alunos.

### `gates`

Representa os portões de saída utilizados no fluxo operacional de liberação de alunos.

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `school_id` | uuid | NOT NULL, FK → `schools(id)` ON DELETE CASCADE |
| `name` | text | NOT NULL |
| `description` | text | nullable |
| `display_order` | integer | NOT NULL, default `1`, CHECK `> 0` |
| `status` | text | NOT NULL, default `active`, CHECK: `active` / `inactive` |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

**Regras principais:**

- UNIQUE `(school_id, name)` → `gates_school_name_unique`
- Índices: `idx_gates_school_id`, `idx_gates_status`

**Seed de desenvolvimento** (escola `smart-exit-dev-school`):

- Portão Principal
- Portão Infantil
- Portão Lateral

### `pickup_events`

Representa eventos operacionais de saída: chamada ativa, conclusão da saída ou cancelamento da chamada.

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `school_id` | uuid | NOT NULL, FK → `schools(id)` ON DELETE CASCADE |
| `student_enrollment_id` | uuid | NOT NULL, FK → `student_enrollments(id)` ON DELETE CASCADE |
| `gate_id` | uuid | NOT NULL, FK → `gates(id)` ON DELETE RESTRICT |
| `status` | text | NOT NULL, default `called`, CHECK: `called` / `completed` / `cancelled` |
| `called_at` | timestamptz | NOT NULL, default `now()` |
| `completed_at` | timestamptz | nullable |
| `cancelled_at` | timestamptz | nullable |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

**Regras principais:**

- CHECK `pickup_events_status_timestamps_check` — coerência entre `status` e timestamps:
  - `called`: `completed_at` e `cancelled_at` nulos
  - `completed`: `completed_at` preenchido, `cancelled_at` nulo
  - `cancelled`: `cancelled_at` preenchido, `completed_at` nulo
- Índice único parcial `pickup_events_active_enrollment_unique` — **no máximo uma chamada ativa** (`status = 'called'`) por matrícula
- Índices: `idx_pickup_events_school_id`, `idx_pickup_events_student_enrollment_id`, `idx_pickup_events_gate_id`, `idx_pickup_events_status`, `idx_pickup_events_called_at`

**Observação:** o seed atual **não inclui** eventos de pickup de exemplo; apenas os portões. Eventos devem ser criados manualmente ou via integração futura dos services.

### Relação atual: `gates`, `pickup_events` e `student_enrollments`

Esta seção descreve o **modelo relacional PostgreSQL vigente** (Academic Core + Pickup Core). Ela não descreve o runtime do frontend. O painel operacional ainda persiste portões e chamadas em `localStorage`; ver a distinção explícita abaixo.

#### Papel de cada entidade

| Entidade | Domínio | Papel |
|----------|---------|--------|
| `student_enrollments` | Academic Core (Migration 0002) | Matrícula do aluno em um ano letivo. Não é a identidade permanente do aluno (`students`) nem a turma (`student_group_assignments`). |
| `gates` | Pickup Core (Migration 0004) | Portão de saída da escola no schema PostgreSQL (`public.gates`). |
| `pickup_events` | Pickup Core (Migration 0004) | Evento operacional de chamada/saída (`public.pickup_events`). |

A chamada **não** aponta para `students`. Aponta para a **matrícula** (`student_enrollment_id`), em linha com a ADR-025: a operação de saída pertence ao vínculo letivo, não à identidade permanente.

#### Como as três se relacionam

```text
students
   └── student_enrollments          (matrícula do ano letivo)
              └── pickup_events     (chamada / conclusão / cancelamento)
schools
   ├── gates                        (portão onde a chamada ocorre)
   │      └── pickup_events
   └── pickup_events                (também referencia a escola)
```

Regras objetivas do schema atual:

1. Cada registro em `pickup_events` **exige** uma matrícula (`student_enrollment_id` NOT NULL, FK com `ON DELETE CASCADE`) e um portão (`gate_id` NOT NULL, FK com `ON DELETE RESTRICT`).
2. Um portão pertence a uma escola (`gates.school_id`). O evento também registra `pickup_events.school_id`.
3. Uma matrícula pode ter histórico de eventos (`completed` / `cancelled`), mas **no máximo uma chamada ativa** (`status = 'called'`) — índice único parcial `pickup_events_active_enrollment_unique`.
4. Excluir a matrícula remove os eventos associados. Excluir um portão **é bloqueado** enquanto existirem `pickup_events` apontando para ele.
5. O seed de desenvolvimento cria portões de exemplo em `public.gates` e **não** cria `pickup_events`.

O diagrama ER no início deste documento já mostra essas FKs. Esta seção apenas torna a relação operacional explícita.

#### PostgreSQL atual vs runtime legado (`localStorage`)

Os nomes se parecem; os modelos **não são o mesmo sistema** e **não estão sincronizados**.

| Conceito | Modelo PostgreSQL atual | Runtime legado (frontend ativo) |
|----------|-------------------------|----------------------------------|
| Portão | Tabela `public.gates` | Dois stores distintos e sem sync: `school.exits` (array de nomes; usado pelo monitor) e `gatesList` em `@SmartExit:gates:{schoolId}` (objetos geridos na aba de portões) |
| Chamada de saída | Tabela `public.pickup_events` | Fila `@SmartExit:called:{schoolId}` via `callService` (objetos da sessão local; sem FK para matrícula nem para `public.gates`) |
| Aluno na chamada | `pickup_events.student_enrollment_id` → `student_enrollments` | Identidade/turma no array `studentsList[]` e no objeto da chamada local; **não existe** entidade de matrícula no `localStorage` |

Consequências do estado atual:

- `gateService` e `callService` leem/escrevem **somente** `localStorage`. Não há persistência operacional de portões ou chamadas em `public.gates` / `public.pickup_events`.
- `public.gates` e `public.pickup_events` existem no schema (Migration 0004) e no seed parcial (`gates` sim, `pickup_events` não). Isso **não** significa que o painel, o monitor ou a TV usem essas tabelas.
- Não tratar `school.exits` nem `gatesList` como equivalentes de `public.gates`.
- Não tratar a fila `@SmartExit:called:{schoolId}` como equivalente de `public.pickup_events`.

A tabela resumida **Gap schema DB ↔ frontend legado**, mais abaixo neste documento, permanece a visão compacta desse desalinhamento. A fonte desta relação de domínio é o schema das migrations 0002 e 0004.

---

## O que ainda NÃO existe no PostgreSQL

| Domínio | Entidades previstas |
|---------|---------------------|
| Audit Core | `audit_logs` (domínio funcional futuro — distinto do Database Auditor v1) |

---

## Segurança do banco

A **fundação de RLS** já existe na Migration 0005: RLS habilitado nas tabelas da fundação, policies de membership/self-access e helper functions. A consolidação de segurança ainda não está completa para produção.

### Status atual

| Item | Status |
|------|--------|
| RLS Foundation (Migration 0005) | ✅ Implementada (enable + policies + helpers) |
| Database Auditor v1 | ✅ Valida a fundação até 0005 (tabelas esperadas, RLS foundation, policies/helpers e seed baseline) |
| Matriz completa de `GRANT`s | ⚠️ Não é foco do Auditor v1; há assimetria conhecida entre policies de escrita e grants `SELECT` |
| Isolamento multi-tenant em runtime | ⚠️ Smoke parcial em `validate:rls`; seed sem usuários/memberships |
| Triggers automáticos de `updated_at` | Ainda não implementados |
| Políticas por papel (`roles`) além de membership ativa | Pendente |
| Integração completa com Supabase Auth no frontend | Pendente |
| Audit Core (`audit_logs`) | Pendente (domínio futuro) |

### Observação importante

Antes de produção, ainda será necessário evoluir:

- fixtures de membership para testes RLS completos;
- alinhamento de grants com as policies;
- políticas por papel de usuário, quando o produto exigir;
- revisão do fluxo de autenticação institucional no frontend.

---

## Seed de desenvolvimento

O arquivo `supabase/seed.sql` possui dois papéis hoje:

### 1. Catálogos globais obrigatórios

Dados necessários para o funcionamento mínimo do domínio:

- `roles`
- `academic_shifts`

### 2. Massa mínima de desenvolvimento

Dados de apoio para validar o núcleo acadêmico localmente após `supabase db reset`.

Atualmente, o seed inclui:

- 1 escola de desenvolvimento (`smart-exit-dev-school`)
- 1 nível acadêmico
- 2 turmas de exemplo (EF3MA, EF3TA)
- 1 aluno de exemplo (João Teste / STU-0001)
- 1 matrícula de exemplo (ano 2026)
- 1 vínculo ativo entre matrícula e turma
- 3 portões de exemplo (Portão Principal, Portão Infantil, Portão Lateral)

**Lacunas conhecidas do seed (não são falha do contrato do `seed.sql`):**

- não cria usuários em `auth.users`
- não cria `profiles`
- não cria `school_members`
- não cria `pickup_events`

O Database Auditor v1 reporta essas ausências como `WARN`.

Essa massa **não representa seed de produção**. Ela existe para facilitar:

- Validação das migrations
- Execução do Database Auditor v1 após reset local
- Testes locais no Supabase Studio
- Inspeção manual das relações dos domínios acadêmico e operacional

---

## localStorage — Persistência runtime (frontend)

Enquanto a migração não conclui, o frontend usa chaves `@SmartExit:*` via `storageClient`.

### Chaves ativas

| Chave | Conteúdo |
|-------|----------|
| `@SmartExit:loggedSchool` | Sessão da escola logada |
| `@SmartExit:darkMode` | Preferência de tema |
| `@SmartExit:gates:{schoolId}` | Portões avançados |
| `@SmartExit:called:{schoolId}` | Fila de chamadas |

### Catálogo `schools` (Issue #16)

`schoolService` (`getAllSchools`, `saveSchool`, `deleteSchool`) persiste exclusivamente em `public.schools` via `schoolRepository`. A chave `@SmartExit:schools` **não existe mais** no frontend.

Ainda no localStorage: sessão `@SmartExit:loggedSchool`, portões, chamadas e tema. `InstitutionPanel` continua gravando dados operacionais (turmas/alunos) na sessão local — fora do escopo do catálogo School.

O formulário de `InstitutionsManager` coleta apenas campos do schema (`name`, `plan`, `status`). E-mail/senha não pertencem a `public.schools` (ADR-005).

`name` é `NOT NULL` e **UNIQUE** (`schools_name_unique`; igualdade exata após o valor persistido). O cadastro rejeita nome vazio ou só espaços na aplicação (`schoolService` + modal); não há CHECK de não-vazio no PostgreSQL. Nome duplicado é rejeitado na aplicação e pela constraint no Supabase.

### Gap schema DB ↔ frontend legado

| Conceito | PostgreSQL | Frontend (localStorage) |
|----------|------------|-------------------------|
| Plano | `basic` / `pro` / `enterprise` | Basic / Premium / Diamond / Trial |
| Status escola | `trial` / `active` / `inactive` / `suspended` | Ativo / Inativo |
| ID escola | UUID | number/string timestamp |
| Autenticação | Supabase Auth (ADR-004) | email/password plaintext |
| Turma | `academic_groups` + `student_group_assignments` | `classes[]` |
| Aluno | `students` + `student_enrollments` | `studentsList[]` |
| Portão | `gates` (schema ✅; frontend ❌) | `exits[]` + `gatesList` |
| Chamada de saída | `pickup_events` (schema ✅; frontend ❌) | `called[]` / monitor local |
