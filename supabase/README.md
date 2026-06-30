# Supabase

Este diretório contém toda a infraestrutura de banco de dados do Smart Exit School.

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