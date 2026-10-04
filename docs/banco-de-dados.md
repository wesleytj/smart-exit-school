# Banco de Dados — Smart Exit School

## Situação atual da persistência

Todas as entidades principais de negócio estão integradas e consolidadas no **PostgreSQL (Supabase)**:

| Camada | Tecnologia | Status | Uso no runtime |
|--------|------------|--------|----------------|
| **PostgreSQL (Supabase)** | Migrations SQL + Services DAL | Fonte de verdade consolidada | Escolas (`schools`), Portões (`gates`), Níveis e Turmas (`academic_levels`, `academic_groups`), Alunos e Matrículas (`students`, `student_enrollments`, `student_group_assignments`) e Chamadas de Saída (`pickup_events`) |
| **localStorage** | `storageClient` | Cache operacional e preferências de UI | Tema (`@SmartExit:darkMode`) e gatilhos de sincronização cross-tab (`@SmartExit:schoolOps:`). Nenhuma entidade de negócio utiliza localStorage como fonte de verdade |

A persistência do Smart Exit School está consolidada no Supabase PostgreSQL através da Data Access Layer (DAL). O schema relacional cobre autenticação, Platform Admins, núcleo acadêmico, portões operacionais, alunos, matrículas, eventos de chamada (`public.pickup_events`) e fundação completa de Row Level Security (RLS). O `localStorage` atua exclusivamente como cache volátil de interface e preferências locais de navegação.

- Documentação de modelagem de domínio: [arquitetura/modelagem.md](arquitetura/modelagem.md)
- Decisões arquiteturais (ADRs): [arquitetura/decisoes.md](arquitetura/decisoes.md)

---

## PostgreSQL — Schema implementado

O banco de dados relacional é governado por **18 migrations versionadas** sequenciais em `supabase/migrations/`:

| Migration | Arquivo | Domínio / Descrição |
|-----------|---------|---------------------|
| 0001 | `20260628155403_create_authentication_core.sql` | Authentication Core (`schools`, `roles`, `profiles`, `school_members`) |
| 0002 | `20260701014657_create_academic_core.sql` | Academic Core (`academic_levels`, `academic_shifts`, `academic_groups`, `students`, `student_enrollments`) |
| 0003 | `20260702204601_create_student_group_assignments.sql` | Academic Enrollment Assignment (`student_group_assignments`) |
| 0004 | `20260703154000_create_pickup_core_foundation.sql` | Pickup Core Foundation (`gates`, `guardians`, `pickup_authorizations`, `pickup_events`) |
| 0005 | `20260706180031_enable-rls-foundation.sql` | RLS Foundation (Políticas e funções auxiliares de isolamento multi-tenant) |
| 0006 | `20260727150000_create_platform_admins.sql` | Platform Admins Core (`public.platform_admins`) |
| 0007 | `20260727160000_extend_schools_policies_for_platform_admin.sql` | Extend Schools Policies for Platform Admin (`SELECT`, `UPDATE`) |
| 0008 | `20260727170000_bootstrap_platform_admin.sql` | Bootstrap Platform Admin RPC / Seeds |
| 0009 | `20260727180000_sync_auth_users_with_profiles.sql` | Trigger de sincronização de `auth.users` com `public.profiles` |
| 0010 | `20260728140000_enable_rls_platform_admins.sql` | Enable RLS em `public.platform_admins` |
| 0011 | `20260728150000_schools_insert_delete_for_platform_admin.sql` | Permissões de `INSERT` e `DELETE` em `public.schools` para Platform Admins |
| 0012 | `20260904180000_add_schools_name_unique.sql` | UNIQUE constraint em `public.schools.name` (`schools_name_unique`) |
| 0013 | `20260925160000_students_optional_identifier_and_birth_date.sql` | Campos opcionais em `students` (`student_identifier`, `birth_date`) |
| 0014 | `20260925170000_grant_student_writes_to_authenticated.sql` | Concessão de permissões de escrita em alunos e matrículas para `authenticated` |
| 0015 | `20260925180000_revoke_unused_student_writes_from_authenticated.sql` | Revogação de escritas desnecessárias de alunos para `authenticated` |
| 0016 | `20260928140000_pickup_events_operational_writes.sql` | Permissões e validação de escrita operacional em `public.pickup_events` |
| 0017 | `20260928170000_pickup_events_insert_called_only.sql` | Restrição de inserção em `pickup_events` (`status = 'called'` exclusivo) |
| 0018 | `20260928190000_revoke_pickup_events_truncate.sql` | Revogação de TRUNCATE em `public.pickup_events` |

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

Esta seção descreve o **modelo relacional PostgreSQL vigente** (Academic Core + Pickup Core). A fila operacional do Monitor e da TV é `public.pickup_events`. Os portões operacionais estão em `public.gates`.

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

#### Fila operacional

`public.pickup_events` é a fila do Monitor e da TV.

- A consulta ativa é `status = 'called'`, ordenada por `called_at` descendente.
- Chamar insere `school_id`, `student_enrollment_id` e `gate_id`. O status nasce `called`.
- Confirmar atualiza a mesma linha para `completed` e preenche `completed_at`. A linha não é apagada.
- A migration `20260928140000_pickup_events_operational_writes.sql` concede `INSERT` e `UPDATE` a `authenticated`. `SELECT` continua o da Migration 0005. `DELETE` não foi concedido.
- A migration `20260928170000_pickup_events_insert_called_only.sql` exige que o INSERT nasça `called`, permite só a transição `called` → `completed`, rejeita alteração de `school_id`, `student_enrollment_id`, `gate_id` e `called_at` enquanto a linha está `called`, e revoga `DELETE` de `authenticated`.
- `pickup_events_share_school` e o trigger `pickup_events_coherence` exigem a mesma escola no evento, na matrícula e no portão. As policies de `pickup_events` repetem essa checagem.
- O índice único parcial `pickup_events_active_enrollment_unique` continua impedindo duas linhas `called` para a mesma matrícula.
- `@SmartExit:called:{schoolId}` não é a fila.

`public.gates` segue como fonte dos portões. A vertical Gates está `CLOSED / PRODUCTION VERIFIED` (`8cb71ac`).

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
| Isolamento multi-tenant em runtime | ⚠️ Um tenant escolar real foi resolvido em produção. Ainda não houve teste com duas escolas e dois usuários distintos. O seed local continua sem usuários e sem memberships |
| Triggers automáticos de `updated_at` | Ainda não implementados |
| Políticas por papel (`roles`) além de membership ativa | ⚠️ `UPDATE` de `schools` distingue `owner` e `administrator`. O login não consulta a role |
| Integração com Supabase Auth no frontend | ✅ Feature #49 publicada. Profile via trigger. Membership não é criada pela aplicação |
| Audit Core (`audit_logs`) | Pendente (domínio futuro) |

### Observação importante

Produção já tem frontend na Vercel e migrations aplicadas. Ainda falta evoluir:

- teste de isolamento com duas escolas e duas identidades;
- alinhamento de grants com as policies;
- políticas por papel de usuário, quando o produto exigir além da policy atual de `UPDATE` em `schools`;
- UI de convite ou provisionamento de `school_members` (hoje o vínculo é SQL privilegiado).

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

Essa massa **não representa seed de produção**. Em produção o `supabase/seed.sql` completo **não** foi executado. Foram inseridas apenas as quatro roles, o catálogo exigido por `school_members.role_id`, para não criar a escola, os alunos e os portões de desenvolvimento. Ela existe no repositório para facilitar:

- Validação das migrations
- Execução do Database Auditor v1 após reset local
- Testes locais no Supabase Studio
- Inspeção manual das relações dos domínios acadêmico e operacional

---

## localStorage — Persistência runtime (frontend)

O frontend utiliza o `localStorage` exclusivamente para preferências visuais e eventos operacionais locais de interface. Nenhuma entidade de negócio utiliza o `localStorage` como fonte de verdade.

### Chaves ativas

| Chave | Conteúdo |
|-------|----------|
| `@SmartExit:loggedSchool` | Chave legada. Não autoriza acesso e não escolhe o tenant |
| `@SmartExit:darkMode` | Preferência de tema |
| `@SmartExit:schoolOps:{schoolId}` | Gatilho operacional de eventos cross-tab de interface |

### Entidades de domínio consolidadas no Supabase

Todas as entidades principais de negócio estão integradas ao Supabase PostgreSQL via Data Access Layer (DAL):

- **Escolas (`public.schools`):** Gerenciadas via `schoolService` e `schoolRepository`. A chave legada `@SmartExit:schools` foi removida.
- **Portões (`public.gates`):** Gerenciados via `gateService` e `gateRepository`. Não usam `@SmartExit:gates:{schoolId}`.
- **Turmas e Níveis (`public.academic_levels`, `public.academic_groups`):** Gerenciados via `academicLevelService` e `academicGroupService`.
- **Alunos e Matrículas (`public.students`, `public.student_enrollments`, `public.student_group_assignments`):** Gerenciados via `studentService` e `studentEnrollmentService`.
- **Chamadas de Saída (`public.pickup_events`):** Fila operacional gerenciada via `pickupService`. Não usa `@SmartExit:called:{schoolId}`.

O formulário de `InstitutionsManager` coleta apenas campos do schema (`name`, `plan`, `status`). E-mail/senha pertencem ao Supabase Auth e não a `public.schools` (ADR-005).

`name` é `NOT NULL` e **UNIQUE** (`schools_name_unique`; igualdade exata após o valor persistido). O cadastro rejeita nome vazio ou só espaços na aplicação (`schoolService` + modal); nome duplicado é rejeitado na aplicação e pela constraint no Supabase.

### Gap schema DB ↔ frontend (Status da convergência)

| Conceito | PostgreSQL | Frontend / DAL | Status de Convergência |
|----------|------------|----------------|------------------------|
| Plano | `basic` / `pro` / `enterprise` | Basic / Premium / Diamond / Trial | Mapeamento no frontend |
| Status escola | `trial` / `active` / `inactive` / `suspended` | Ativo / Inativo | Mapeamento no frontend |
| ID escola | UUID | UUID | ✅ Alinhado |
| Autenticação | Supabase Auth + `school_members` | `authService` + `tenantAccess` | ✅ Supabase Auth |
| Turma | `academic_levels` + `academic_groups` + `student_group_assignments` | `academicGroupService` | ✅ Supabase PostgreSQL |
| Aluno | `students` + `student_enrollments` | `studentService` + `studentEnrollmentService` | ✅ Supabase PostgreSQL |
| Portão | `gates` (schema ✅; frontend ✅) | `gateService` | ✅ Supabase PostgreSQL |
| Chamada de saída | `pickup_events` (`called` / `completed`) | `pickupService` | ✅ Supabase PostgreSQL (`public.pickup_events`) |
