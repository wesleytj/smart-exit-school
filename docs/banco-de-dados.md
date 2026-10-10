# Banco de Dados — Smart Exit School

## Situação atual da persistência

Todas as entidades principais de negócio estão integradas e consolidadas no **PostgreSQL (Supabase)**:

| Camada | Tecnologia | Status | Uso no runtime |
|--------|------------|--------|----------------|
| **PostgreSQL (Supabase)** | Migrations SQL + Services DAL | Fonte de verdade consolidada | Escolas (`schools`), Anos Letivos (`school_years`), Portões (`gates`), Níveis e Turmas (`academic_levels`, `academic_groups`), Alunos e Matrículas (`students`, `student_enrollments`, `student_group_assignments`), Chamadas de Saída (`pickup_events`) e Auditoria de Impersonation (`impersonation_audit_logs`). |
| **localStorage** | `storageClient` | Cache operacional e preferências de UI | Tema (`@SmartExit:darkMode`) e gatilhos de sincronização cross-tab (`@SmartExit:schoolOps:`). Nenhuma entidade de negócio utiliza localStorage como fonte de verdade. |

A persistência do Smart Exit School está consolidada no Supabase PostgreSQL através da Data Access Layer (DAL). O schema relacional cobre autenticação, Platform Admins, catálogo institucional, anos letivos configuráveis, núcleo acadêmico, portões operacionais, alunos, matrículas, eventos de chamada com cancelamento (`public.pickup_events`), trilha imutável de auditoria de suporte (`public.impersonation_audit_logs`) e fundação completa de Row Level Security (RLS). O `localStorage` atua exclusivamente como cache volátil de interface e preferências locais de navegação.

- Documentação de modelagem de domínio: [arquitetura/modelagem.md](arquitetura/modelagem.md)
- Decisões arquiteturais (ADRs): [arquitetura/decisoes.md](arquitetura/decisoes.md) e [adr/0029-impersonation-user-level-jwt.md](adr/0029-impersonation-user-level-jwt.md)

---

## PostgreSQL — Schema implementado

O banco de dados relacional é governado por **22 migrations versionadas** sequenciais em `supabase/migrations/`:

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
| 0019 | `20261003220000_pickup_events_allow_cancellation.sql` | Cancelamento operacional de chamadas com transição `called` → `cancelled` e registro de `cancelled_at` |
| 0020 | `20261003223000_school_years_configurable.sql` | Anos letivos configuráveis (`public.school_years`), amarração com turmas e matrículas, índice único de ano ativo |
| 0021 | `20261004120000_multi_tenant_grants_hardening.sql` | Endurecimento de permissões multi-tenant (grants em `gates`, `academic_groups`, `academic_levels` e revogação geral de TRUNCATE) |
| 0022 | `20261010140000_create_impersonation_foundation.sql` | Fundação de Impersonation (`public.impersonation_audit_logs`, RLS estrito e RPC `public.list_platform_users`) |

**Seed idempotente:** `supabase/seed.sql`

Atualmente o seed cobre:
- `roles`
- `academic_shifts`
- Massa mínima de desenvolvimento para validação do domínio acadêmico:
  - escola (`smart-exit-dev-school`)
  - ano letivo 2026 ativo
  - nível acadêmico
  - turmas
  - aluno
  - matrícula
  - vínculo da matrícula com turma
- Portões de exemplo (`gates`) para a escola de desenvolvimento

O seed atual **não cria** `auth.users`, `profiles`, `school_members`, `pickup_events` nem `impersonation_audit_logs`. Essa ausência é lacuna conhecida do baseline de desenvolvimento, não violação do contrato do `seed.sql`.

---

### Diagrama ER (PostgreSQL)

```mermaid
erDiagram
    schools ||--o{ school_members : has
    schools ||--o{ school_years : has
    schools ||--o{ academic_levels : has
    schools ||--o{ academic_groups : has
    schools ||--o{ students : has
    schools ||--o{ gates : has
    schools ||--o{ pickup_events : has
    schools ||--o{ impersonation_audit_logs : targets

    profiles ||--o{ school_members : has
    profiles ||--o{ impersonation_audit_logs : initiates
    roles ||--o{ school_members : assigns

    school_years ||--o{ academic_groups : binds
    school_years ||--o{ student_enrollments : binds
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

    school_years {
        uuid id PK
        uuid school_id FK
        integer year
        boolean is_active
        date starts_at
        date ends_at
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
        uuid school_year_id FK
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
        uuid school_year_id FK
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

    impersonation_audit_logs {
        uuid id PK
        uuid super_admin_id FK_profiles
        uuid target_user_id FK_auth_users
        text target_user_email
        text target_user_name
        uuid target_school_id FK_schools
        text reason
        timestamptz started_at
        timestamptz ended_at
        text ip_address
        text user_agent
    }
```

---

## Tabelas — Anos Letivos & Núcleo Acadêmico

### `school_years` (Migration 0020)

Gerencia a parametrização de períodos letivos por escola, permitindo múltiplos anos letivos cadastrados e impondo exatamente um ano letivo ativo por instituição através de índice parcial único.

| Coluna | Tipo | Constraints / Detalhes |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `school_id` | uuid | NOT NULL, FK → `public.schools(id)` ON DELETE CASCADE |
| `year` | integer | NOT NULL, CHECK (`year >= 2000`) |
| `is_active` | boolean | NOT NULL, default `false` |
| `starts_at` | date | NOT NULL |
| `ends_at` | date | NOT NULL |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

**Constraints e Índices:**
* `school_years_year_range_check`: CHECK (`starts_at <= ends_at`)
* `school_years_school_year_unique`: UNIQUE (`school_id, year`)
* `school_years_one_active_per_school`: UNIQUE parcial em `school_id` WHERE (`is_active = true`)
* Índices: `idx_school_years_school_id`, `idx_school_years_year`
* **RLS:** Policies de `SELECT`, `INSERT`, `UPDATE` e `DELETE` baseadas em `public.is_active_school_member(school_id)`.

---

### `impersonation_audit_logs` (Migration 0022 / ADR-029)

Registra de forma imutável todas as sessões de suporte técnico abertas por Platform Admins em nome de usuários de escolas parceiras.

| Coluna | Tipo | Constraints / Detalhes |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `super_admin_id` | uuid | NOT NULL, FK → `public.profiles(id)` ON DELETE RESTRICT |
| `target_user_id` | uuid | NOT NULL, FK → `auth.users(id)` ON DELETE RESTRICT |
| `target_user_email` | text | NOT NULL (snapshot imutável no momento da ação) |
| `target_user_name` | text | Nullable (snapshot imutável do nome no perfil) |
| `target_school_id` | uuid | Nullable, FK → `public.schools(id)` ON DELETE SET NULL |
| `reason` | text | NOT NULL, CHECK (`length(trim(reason)) >= 5`) |
| `started_at` | timestamptz | NOT NULL, default `now()` |
| `ended_at` | timestamptz | Nullable (gravado ao encerrar a sessão) |
| `ip_address` | text | Nullable |
| `user_agent` | text | Nullable |

**Constraints e Índices:**
* `impersonation_audit_logs_duration_check`: CHECK (`ended_at is null or ended_at >= started_at`)
* Índices: `idx_impersonation_audit_logs_super_admin`, `idx_impersonation_audit_logs_target_user`, `idx_impersonation_audit_logs_started_at (started_at DESC)`
* **RLS & Grants:**
  * `alter table public.impersonation_audit_logs enable row level security;`
  * Policy `impersonation_audit_logs_select_admin`: leitura permitida exclusivamente para Platform Admins (`is_platform_admin() = true`).
  * Nenhuma policy de `INSERT`, `UPDATE` ou `DELETE` é concedida para `anon` ou `authenticated`.
  * Escrita e atualização (`INSERT`, `UPDATE`) são concedidas estritamente para `service_role` (executadas atomicamente pelas Edge Functions).

---

### `pickup_events` (Com suporte a cancelamento — Migration 0019)

Fila operacional de chamadas do Monitor e do Telão da TV:

| Coluna | Tipo | Constraints / Detalhes |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `school_id` | uuid | NOT NULL, FK → `public.schools(id)` ON DELETE CASCADE |
| `student_enrollment_id` | uuid | NOT NULL, FK → `public.student_enrollments(id)` ON DELETE CASCADE |
| `gate_id` | uuid | NOT NULL, FK → `public.gates(id)` ON DELETE RESTRICT |
| `status` | text | NOT NULL, default `called`, CHECK (`status in ('called', 'completed', 'cancelled')`) |
| `called_at` | timestamptz | NOT NULL, default `now()` |
| `completed_at` | timestamptz | Nullable (preenchido na conclusão) |
| `cancelled_at` | timestamptz | Nullable (preenchido no cancelamento operacional) |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

**Ciclo de Estados e Coerência (`enforce_pickup_event_coherence`):**
1. Inserção nasce obrigatoriamente com `status = 'called'`.
2. Transição permitida exclusivamente de `called` → `completed` ou `called` → `cancelled`.
3. Ao cancelar, `cancelled_at` é preenchido com `now()`, `completed_at` é anulado e `updated_at` é carimbado.
4. Campos de identidade (`school_id`, `student_enrollment_id`, `gate_id`, `called_at`) são estritamente imutáveis enquanto o status for `called`.
5. Índice parcial único `pickup_events_active_enrollment_unique` impede chamadas simultâneas para o mesmo aluno.

---

## Remote Procedure Calls (RPCs no PostgreSQL)

| RPC | Segurança | Finalidade |
|---|---|---|
| `public.is_platform_admin()` | SECURITY DEFINER | Retorna booleano confirmando se o chamador autenticado (`auth.uid()`) é Platform Admin. |
| `public.list_platform_users(p_search, p_school_id, p_limit, p_offset)` | SECURITY DEFINER (Restrita) | Retorna o catálogo consolidado de usuários da plataforma com dados de perfil, escola e status de membership. Dispara erro SQL `42501` se o chamador não for Platform Admin. |
| `public.activate_school_year(p_school_id, p_school_year_id)` | SECURITY DEFINER | Alterna atomicamente o ano letivo ativo de uma escola, desativando os anos anteriores. |
| `public.enforce_pickup_event_coherence()` | SECURITY DEFINER (Trigger) | Garante a integridade e ciclo de vida de status em `public.pickup_events`. |

---

## Endurecimento de Segurança Multi-Tenant (Migration 0021)

A migration `20261004120000_multi_tenant_grants_hardening.sql` estabeleceu salvaguardas rigorosas contra escalonamento de privilégio:
1. **Alinhamento de Grants:** Concedidos privilégios explícitos de `INSERT`, `UPDATE` e `DELETE` em `public.gates`, `public.academic_groups` e `public.academic_levels` para o role `authenticated`, alinhando os grants com as políticas de RLS da Migration 0005.
2. **Revogação de TRUNCATE:** O privilégio `TRUNCATE` foi compulsoriamente revogado de todas as tabelas do schema `public` para os roles `anon` e `authenticated`, impedindo deleções catastróficas acidentais ou deliberadas.

---

## Database Auditor v1

O script proprietário em `scripts/db-auditor/index.mjs` valida compulsoriamente as invariantes do banco local (`npm run audit:db`):
- Tabelas esperadas presentes com RLS ativo;
- Policies e helper functions de RLS em vigor;
- Invariantes de baseline do `seed.sql` atendidas (resultado canônico atual: **93 PASS · 0 FAIL**).
