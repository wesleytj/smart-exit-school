# Supabase

Este diretório contém a infraestrutura de banco de dados do Smart Exit School.

Schema atual: migrations **0001–0005** (núcleo + RLS foundation) e **0007–0012** (Platform Admin, policies de `schools`, sync Auth→profiles). Não há Migration **0006** no repositório.

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

Cabeçalho padronizado (comentários apenas):

```sql
-- ============================================================
-- Smart Exit School
-- Migration XXXX
-- File:
-- Description:
--
-- Scope:
--
-- Depends on:
-- ============================================================
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

Após o reset, valide a fundação (contrato Auditor v1: migrations **0001–0005** + `seed.sql`) com:

```bash
npm run audit:db
```

Fluxo recomendado completo:

```bash
npx supabase start
npx supabase db reset
npm run audit:db
```

O Auditor v1 (`scripts/db-auditor/`) verifica tabelas, RLS foundation, policies/helpers e invariantes do seed das migrations **0001–0005**. Migrations **0007–0012** (Platform Admin) estão além desse contrato atual do auditor — validar no Studio / app.

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

Lacunas conhecidas do seed (reportadas como `WARN` pelo Auditor v1): não cria `auth.users`, `profiles`, `school_members` nem `pickup_events`. Platform Admin exige usuário Auth + row em `platform_admins` (ver docs de instalação).

O Seed deve ser idempotente.

Sempre utilizar:

```sql
ON CONFLICT
```

---

# Convenções

- Uma migration por responsabilidade.
- Nunca alterar SQL de migrations já publicadas (exceto cabeçalhos/comentários quando padronizados).
- Toda evolução estrutural deve ocorrer através de novas migrations.
- Código e identificadores SQL em inglês; comentários de cabeçalho no padrão acima.
