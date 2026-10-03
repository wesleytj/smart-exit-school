---
name: ses-database-audit
description: Use this skill when checking, validating, or auditing the Smart Exit School database schema, RLS policies, migrations, or seed data.
---

# SES Database Audit Procedure

Procedimento operacional para executar a suite de auditoria de banco de dados do Smart Exit School e verificar a integridade da fundacao relacional.

## Quando Utilizar
- Apos alterar ou adicionar arquivos em `supabase/migrations/`;
- Apos atualizar politicas em `validate-rls-foundation.mjs` ou no schema;
- Apos editar `supabase/seed.sql`;
- Antes de concluir qualquer tarefa que envolva persistencia ou banco de dados.

## Procedimento Passo a Passo

### Etapa 1: Execucao do Database Auditor v1
Execute o auditor nativo do projeto:
```bash
npm run audit:db
```
Analise o relatorio emitido no console:
- Verifique se todas as tabelas esperadas das migrations 0001 a 0005 estao presentes;
- Verifique se as funcoes auxiliares de RLS (`is_platform_admin`, `has_school_access`) estao ativas;
- Verifique se os invariantes da escola de seed (`smart-exit-dev-school`) estao validos.

### Etapa 2: Validacao de Row Level Security (RLS)
Execute o validador especifico de politicas:
```bash
npm run validate:rls
```
Confirme se todas as politicas esperadas foram verificadas com sucesso.

### Etapa 3: Interpretacao de Falhas e Reconciliacao
Se houver falha reportada:
1. Identifique se o erro e de conexao com o Supabase local (ex.: container Docker nao inicializado) ou de divergencia de schema;
2. Se for divergencia de schema, determine se ha migration pendente de aplicacao;
3. Nao ignore a falha. Se o ambiente local estiver sem o Supabase rodando, registre a limitacao tecnica explicitamente no relatorio de validacao.
