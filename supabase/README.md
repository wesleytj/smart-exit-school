# Supabase

Este diretório contém toda a infraestrutura de banco de dados do Smart Exit School.

A fundação atual do schema vai até a **Migration 0005 — RLS Foundation** (Authentication Core, Academic Core, Enrollment Assignment, Pickup Core e RLS).

---

# Estrutura

```
supabase/
├── migrations/
├── seed.sql
├── config.toml
└── README.md
```

---

# Criar uma Migration

```bash
npx supabase migration new nome_da_migration
```

---

# Aplicar Migrations

```bash
npx supabase db push
```

---

# Resetar Banco Local

```bash
npx supabase db reset
```

Após o reset, valide a fundação do banco local até a Migration 0005 com o **Database Auditor v1**:

```bash
npm run audit:db
```

Fluxo recomendado completo:

```bash
npx supabase start
npx supabase db reset
npm run audit:db
```

O Auditor v1 (`scripts/db-auditor/`) verifica presença das tabelas esperadas, RLS foundation, policies/helper functions esperadas e invariantes do seed atual (contrato das migrations **0001–0005** + `seed.sql`).

Ele **não** substitui testes funcionais da aplicação e **não** é o domínio Audit Core (`audit_logs`).

---

# Vincular Projeto

```bash
npx supabase link --project-ref <project-ref>
```

---

# Listar Projetos

```bash
npx supabase projects list
```

---

# Seed

Os dados iniciais da aplicação ficam em:

```
supabase/seed.sql
```

Conteúdo atual:

- Catálogos globais: `roles`, `academic_shifts`
- Massa de desenvolvimento: escola, nível, turmas, aluno, matrícula, vínculo matrícula↔turma
- Portões de exemplo (`gates`) para a escola `smart-exit-dev-school`

Lacunas conhecidas do seed (reportadas como `WARN` pelo Auditor v1): não cria `auth.users`, `profiles`, `school_members` nem `pickup_events`.

O Seed deve ser idempotente.

Sempre utilizar:

```sql
ON CONFLICT
```

---

# Convenções

- Uma migration por responsabilidade.
- Nunca alterar migrations já publicadas.
- Toda evolução estrutural deve ocorrer através de novas migrations.
