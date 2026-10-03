---
description: SES Database & Security — migrations, RLS, multi-tenant isolation e Database Auditor
trigger: always_on
---

# SES 03 — Database & Security Governance

## 1. Fundacao de Banco de Dados e Migrations

O schema relacional do Smart Exit School e gerido via migracoes sequenciais do Supabase em `supabase/migrations/`:
- **0001:** Authentication Core (`public.schools`, `public.school_members`, `public.platform_admins`).
- **0002:** Academic Core (`public.academic_cycles`, `public.stages`, `public.grades`, `public.classes`).
- **0003:** Enrollment & Student Core (`public.students`, `public.student_classes`).
- **0004:** Pickup Core (`public.gates`, `public.guardians`, `public.pickup_authorizations`, `public.pickup_events`).
- **0005:** RLS Foundation (Politicas de isolamento e funcoes auxiliares de seguranca).

## 2. Row Level Security (RLS) e Isolamento Multi-Tenant

- **RLS Compulsorio:** Toda tabela criada em `public` deve ter `ENABLE ROW LEVEL SECURITY` ativado.
- **Politica por Tenant:** Consultas normais devem ser filtradas estritamente pelo `school_id` vinculado ao usuario em `public.school_members`.
- **Platform Admin:** Acesso global de leitura/gestao de instituicoes e concedido apenas via avaliacao da RPC `public.is_platform_admin()`.
- **Nunca use `service_role`** em codigo cliente do frontend para contornar restricoes de RLS.

## 3. Verificacao Obrigatoria — Database Auditor

Sempre que uma alteracao envolver scripts SQL, schemas, migrations ou o arquivo `supabase/seed.sql`:
1. Executar o Database Auditor v1 (ambiente local):
   ```bash
   npm run audit:db
   ```
2. Executar a validacao de RLS:
   ```bash
   npm run validate:rls
   ```
3. Nao declarar `Implementation Complete` enquanto o Database Auditor apontar falhas em tabelas esperadas, politicas ausentes ou divergencias no seed.
4. Nota de Escopo: Estes comandos validam o banco de desenvolvimento local (`smart-exit-dev-school`), nao devendo ser confundidos com auditoria de dados em producao.

## 4. Decision Gate Mandatorio (`G-DB`)

Qualquer intervencao que envolva criacao ou alteracao de migracoes, mudancas em tabelas existentes ou alteracao de politicas de RLS exige formalizacao previa atraves do Decision Gate `G-DB`.
