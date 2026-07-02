# Banco de Dados — Smart Exit School

## Situação atual (híbrida)

O projeto opera em **dois modelos de persistência simultâneos**:

| Camada | Tecnologia | Status | Uso no runtime |
|--------|------------|--------|----------------|
| **PostgreSQL (Supabase)** | Migrations SQL | Schema parcial implementado | Leitura parcial via `schoolService.getAllSchools()` |
| **localStorage** | `storageClient` + services | Ativo em produção frontend | Sessão, CRUD operacional, chamadas, portões, tema |

A migração para Supabase está **em andamento**. O schema relacional já existe; a maior parte do frontend ainda persiste via localStorage.

Documentação de modelagem de domínio: [arquitetura/modelagem.md](arquitetura/modelagem.md)  
Decisões arquiteturais (ADRs): [arquitetura/decisoes.md](arquitetura/decisoes.md)

---

## PostgreSQL — Schema implementado

Migrations em `supabase/migrations/`:

| Migration | Arquivo | Domínio |
|-----------|---------|---------|
| 0001 | `20260628155403_create_authentication_core.sql` | Authentication Core |
| 0002 | `20260701014657_create_academic_core.sql` | Academic Core |

Seed idempotente: `supabase/seed.sql` (roles, academic_shifts)

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
```

### Tabelas — Authentication Core

#### `schools`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `slug` | text | NOT NULL, UNIQUE |
| `name` | text | NOT NULL |
| `status` | text | NOT NULL, default `trial`, CHECK: trial/active/inactive/suspended |
| `plan` | text | NOT NULL, default `basic`, CHECK: basic/pro/enterprise |
| `timezone` | text | NOT NULL, default `America/Sao_Paulo` |
| `locale` | text | NOT NULL, default `pt-BR` |
| `currency` | text | NOT NULL, default `BRL` |
| `logo_url` | text | nullable |
| `primary_color` | text | nullable |
| `secondary_color` | text | nullable |
| `external_id` | text | nullable |
| `created_at` | timestamptz | NOT NULL, default now() |
| `updated_at` | timestamptz | NOT NULL, default now() |

Índices: `idx_schools_external_id`, `idx_schools_status`, `idx_schools_plan`

**ADR-005:** não armazena email/senha (pertencem ao Supabase Auth).

#### `roles`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `name` | text | NOT NULL, UNIQUE, CHECK: owner/administrator/secretary/gatekeeper |
| `description` | text | nullable |

#### `profiles`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `full_name` | text | NOT NULL |

#### `school_members`

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `school_id` | uuid | FK → schools ON DELETE CASCADE |
| `profile_id` | uuid | FK → profiles ON DELETE CASCADE |
| `role_id` | uuid | FK → roles ON DELETE RESTRICT |
| `status` | text | CHECK: active/inactive |
| | | UNIQUE `(school_id, profile_id)` → `school_members_school_profile_unique` |

Índices: `idx_school_members_school_id`, `idx_school_members_profile_id`, `idx_school_members_role_id`

### Tabelas — Academic Core

#### `academic_levels`

- UNIQUE `(school_id, name)` → `academic_levels_school_name_unique`
- FK `school_id` → schools ON DELETE CASCADE
- CHECK `display_order > 0`, status active/inactive

#### `academic_shifts`

- Catálogo global (morning, afternoon, full_time, night)
- UNIQUE em `name`

#### `academic_groups`

- FKs: school, academic_level (RESTRICT), academic_shift (RESTRICT)
- UNIQUE `(school_id, academic_level_id, academic_shift_id, name)`

#### `students`

- UNIQUE `(school_id, student_identifier)` → `students_school_identifier_unique`
- CHECK `birth_date <= current_date`

#### `student_enrollments`

- UNIQUE `(student_id, academic_year)` → `student_enrollments_student_year_unique`
- FK student ON DELETE CASCADE
- **Pendente (ADR-025):** tabela `student_group_assignments` para vínculo com turma

### O que ainda NÃO existe no PostgreSQL

| Domínio | Entidades previstas |
|---------|---------------------|
| Pickup Core | gates, pickup_events, called_students |
| Audit Core | audit logs |
| Acadêmico | `student_group_assignments` |

### Segurança do banco

- **RLS (Row Level Security):** não implementado nas migrations atuais
- **Triggers `updated_at`:** não implementados
- **Políticas de acesso:** pendentes (crítico antes de produção)

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

```javascript
// getAllSchools() → Supabase .from('schools')
// saveSchool() / deleteSchool() → localStorage
```

Leitura e escrita usam backends diferentes até conclusão da Fase 2.

### Gap schema DB ↔ frontend legado

| Conceito | PostgreSQL | Frontend (localStorage) |
|----------|------------|-------------------------|
| Plano | basic/pro/enterprise | Basic/Premium/Diamond/Trial |
| Status escola | trial/active/inactive/suspended | Ativo/Inativo |
| ID escola | UUID | number/string timestamp |
| Autenticação | Supabase Auth (ADR-004) | email/password plaintext |
| Turma | academic_groups | classes[] |
| Aluno | students + enrollments | studentsList[] |
| Portão | *(não migrado)* | exits[] + gatesList |

---

## Pontos que precisam de validação

- Mapeamento oficial Basic/Premium/Diamond → basic/pro/enterprise
- Estratégia de migração de dados localStorage → PostgreSQL
- Cronograma de implementação de RLS
- Migration 0003: Pickup Core (gates, calls)
