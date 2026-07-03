# Banco de Dados — Smart Exit School

## Situação atual (híbrida)

O projeto opera em **dois modelos de persistência simultâneos**:

| Camada | Tecnologia | Status | Uso no runtime |
|--------|------------|--------|----------------|
| **PostgreSQL (Supabase)** | Migrations SQL | Schema parcial implementado | Leitura parcial via `schoolService.getAllSchools()` |
| **localStorage** | `storageClient` + services | Ativo em produção frontend | Sessão, CRUD operacional, chamadas, portões, tema |

A migração para Supabase está **em andamento**. O schema relacional já existe para os domínios de autenticação e núcleo acadêmico; a maior parte do frontend ainda persiste via localStorage.

- Documentação de modelagem de domínio: [arquitetura/modelagem.md](arquitetura/modelagem.md)
- Decisões arquiteturais (ADRs): [arquitetura/decisoes.md](arquitetura/decisoes.md)

---

## PostgreSQL — Schema implementado

Migrations em `supabase/migrations/`:

| Migration | Arquivo | Domínio |
|-----------|---------|---------|
| 0001 | `20260628155403_create_authentication_core.sql` | Authentication Core |
| 0002 | `20260701014657_create_academic_core.sql` | Academic Core |
| 0003 | `20260702204601_create_student_group_assignments.sql` | Academic Enrollment Assignment |

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

### Diagrama ER (PostgreSQL)

```mermaid
erDiagram
    schools ||--o{ school_members : has
    schools ||--o{ academic_levels : has
    schools ||--o{ academic_groups : has
    schools ||--o{ students : has

    profiles ||--o{ school_members : has
    roles ||--o{ school_members : assigns

    academic_levels ||--o{ academic_groups : contains
    academic_shifts ||--o{ academic_groups : schedules

    students ||--o{ student_enrollments : has
    student_enrollments ||--o{ student_group_assignments : assigned_to
    academic_groups ||--o{ student_group_assignments : receives

    schools {
        uuid id PK
        text slug UK
        text name
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
```

### Fluxo de desenvolvimento local

O desenvolvimento de novas alterações no schema utiliza a Supabase CLI em conjunto com o Docker.

**Fluxo padrão:**

```bash
supabase start
supabase db reset
```

- `supabase start` — sobe a stack local do Supabase (PostgreSQL, Studio, Auth e demais serviços necessários)
- `supabase db reset` — recria o banco local, aplica todas as migrations e executa o `seed.sql`

Esse fluxo é **obrigatório** para validar migrations antes de abrir Pull Request.

---

## Tabelas — Authentication Core

### `schools`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `slug` | text | NOT NULL, UNIQUE |
| `name` | text | NOT NULL |
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

**Índices:** `idx_schools_external_id`, `idx_schools_status`, `idx_schools_plan`

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

## O que ainda NÃO existe no PostgreSQL

| Domínio | Entidades previstas |
|---------|---------------------|
| Pickup Core | `gates`, `pickup_events` |
| Audit Core | `audit_logs` |

---

## Segurança do banco

No momento, o schema relacional ainda está em fase de consolidação estrutural. Por isso, alguns itens de segurança e governança ainda não foram implementados.

### Pendências atuais

| Item | Status |
|------|--------|
| RLS (Row Level Security) | Ainda não implementado nas migrations atuais |
| Triggers automáticos de `updated_at` | Ainda não implementados |
| Policies de acesso por escola/usuário | Pendentes |
| Integração completa com Supabase Auth no frontend | Pendente |

### Observação importante

Antes de produção, será obrigatório implementar:

- RLS em tabelas multi-tenant
- Políticas por escola (`school_id`)
- Políticas por papel de usuário (`roles`)
- Revisão do fluxo de autenticação institucional

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

- 1 escola de desenvolvimento
- 1 nível acadêmico
- 2 turmas de exemplo
- 1 aluno de exemplo
- 1 matrícula de exemplo
- 1 vínculo ativo entre matrícula e turma

Essa massa **não representa seed de produção**. Ela existe para facilitar:

- Validação das migrations
- Testes locais no Supabase Studio
- Inspeção manual das relações do domínio acadêmico

---

## localStorage — Persistência runtime (frontend)

Enquanto a migração não conclui, o frontend usa chaves `@SmartExit:*` via `storageClient`.

### Chaves ativas

| Chave | Conteúdo |
|-------|----------|
| `@SmartExit:schools` | Array JSON de escolas (modelo legado com email/password) |
| `@SmartExit:loggedSchool` | Sessão da escola logada |
| `@SmartExit:darkMode` | Preferência de tema |
| `@SmartExit:gates:{schoolId}` | Portões avançados |
| `@SmartExit:called:{schoolId}` | Fila de chamadas |

### Inconsistência crítica: `schoolService`

Atualmente existe um estado híbrido no frontend:

```javascript
// getAllSchools() → Supabase .from('schools')
// saveSchool() / deleteSchool() → localStorage
```

Ou seja, leitura e escrita ainda usam backends diferentes até a conclusão da migração da camada de serviços.

### Gap schema DB ↔ frontend legado

| Conceito | PostgreSQL | Frontend (localStorage) |
|----------|------------|-------------------------|
| Plano | `basic` / `pro` / `enterprise` | Basic / Premium / Diamond / Trial |
| Status escola | `trial` / `active` / `inactive` / `suspended` | Ativo / Inativo |
| ID escola | UUID | number/string timestamp |
| Autenticação | Supabase Auth (ADR-004) | email/password plaintext |
| Turma | `academic_groups` + `student_group_assignments` | `classes[]` |
| Aluno | `students` + `student_enrollments` | `studentsList[]` |
| Portão | (ainda não migrado) | `exits[]` + `gatesList` |
| Chamada de saída | (ainda não migrado) | `called[]` / monitor local |
