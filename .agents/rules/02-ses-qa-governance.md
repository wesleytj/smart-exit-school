---
description: SES QA Governance — regras operacionais de dados de teste, instituicao canonica e fixtures
trigger: always_on
---

# SES 02 — QA Data Governance & Test Fixtures

## 1. Principio Fundamental de QA

**Reutilizar antes de criar.**

Ao executar testes funcionais, desenvolvimento local ou verificacoes de interface que envolvam instituicoes escolares (`public.schools`), o agente deve sempre buscar reutilizar fixtures autorizados antes de ponderar a criacao de novos registros.

## 2. Matriz Canonica de Fixtures (Fato × Autorizacao × Ambiente)

O agente deve manter distincao rigorosa entre **dado existente comprovado**, **fixture autorizado por governanca** e **estado operacional nao verificado**:

| Fixture / Identificador | Ambiente | Finalidade Oficial | Status Comprovado no Repositorio | Regra Operacional |
|---|---|---|---|---|
| `smart-exit-dev-school` | **LOCAL / DEV** | Seed de desenvolvimento local e invariante do Database Auditor v1 | **EXISTENTE E COMPROVADO** (`supabase/seed.sql`, auditor) | Preservar invariantes. Nao alterar schema ou dados do seed arbitrariamente. |
| `qa-cursor-escola-teste`<br>(`76f29d9f-c6fd-4561-89f8-403fef0ccb40`) | **QA / HOMOLOGACAO** | Instituicao QA Canonica Permanente para testes de gestao e painel | **AUTORIZADO POR GOVERNANCA** (`docs/qa-data-governance.md`) | Reutilizar sempre que compativel. Proibido alterar nome, slug ou plano. |
| `QA Pickup Smoke`<br>(`QA-PICKUP-001`) | **PRODUCAO SMOKE** | Aluno permanente de smoke operacional de pickup (Col. Adv. Esteio, turma `6ma`, portao `Portão`) | **AUTORIZADO DOCUMENTALMENTE / NAO VERIFICADO EM PRODUCAO** | O agente **nao acessa producao** e nao deve declarar sua presenca fisica como fato sem consulta direta autorizada. Nunca criar ou alterar em producao sem aprovacao humana previa. |

## 3. Restricoes Operacionais de QA

- **Proibicao de Criacao Automatica:** O agente nunca cria novas instituicoes de teste se a instituicao canônica puder ser reutilizada.
- **Criacao Temporaria (Excecao Estrita):** Permitida unicamente se houver necessidade comprovada de isolamento, devendo ser registrada no relatorio com ID, nome, slug e motivo.
- **Proibicao de Exclusao por Aparencia:** E expressamente proibido deletar registros existentes de escolas, turmas ou alunos apenas por terem nomes sugestivos de teste.
- **Proibicao de `supabase db reset` como Cleanup:** O reset do banco apaga todo o ambiente de testes local; e proibido usa-lo para limpeza pontual de dados.
