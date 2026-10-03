---
name: ses-qa-smoke
description: Use this skill when conducting QA tests, Pickup smoke tests, or UI validations involving institutions and students in Smart Exit School.
---

# SES QA Smoke & Data Validation Procedure

Procedimento operacional para executar testes de fumaça e validacoes funcionais de ponta a ponta no Smart Exit School em estrita conformidade com a governanca de dados.

## Matriz de Fixtures e Ambientes

Antes de iniciar qualquer teste, identifique o ambiente e o fixture correspondente:
- **Ambiente Local/Dev:** Usar a instituicao de seed `smart-exit-dev-school` (comprovada em `supabase/seed.sql`).
- **Ambiente de QA:** Reutilizar a instituicao canônica `qa-cursor-escola-teste` (ID `76f29d9f-c6fd-4561-89f8-403fef0ccb40`).
- **Ambiente de Producao (Smoke Operacional):** Fixture autorizado documentalmente: `QA Pickup Smoke` / `QA-PICKUP-001` (Col. Adv. Esteio, turma `6ma`, portao `Portão`).
  - *Atencao Epistemica:* A existencia fisica deste fixture no banco de producao e **DESCONHECIDA/NAO VERIFICADA** a partir do ambiente local. Nao declare como existente sem inspecao direta autorizada. Nunca crie fixtures em producao sem autorizacao humana previa.

## Procedimento Passo a Passo

### Etapa 1: Consulta ao Inventario de QA e Inspecao de Estado
1. Consultar `docs/qa-inventory.md` e `docs/qa-data-governance.md`.
2. Confirmar qual fixture atende ao cenario sem criar registros desnecessarios.
3. Se o teste envolver producao, seguir estritamente o roteiro de [docs/qa-production-smoke.md](docs/qa-production-smoke.md).

### Etapa 2: Validacao dos Estados de Repouso
1. Confirmar que o ambiente de teste nao contem chamadas ativas pendentes que possam distorcer a validacao.
2. Nao alterar nome, slug, plano ou dados estruturais da instituicao canônica.

### Etapa 3: Execucao do Teste de Fluxo
1. Executar a acao de teste (ex.: registro de chamada de aluno, atualizacao de status no portao).
2. Monitorar eventos de storage cross-tab ou respostas de API/RPC.
3. Observar a atualizacao simultanea no Painel (`/painel`) e no Telao de TV (`/tv`).

### Etapa 4: Encerramento e Higiene
1. Se foram criados dados temporarios autorizados, documente-os formalmente no relatorio de conclusao.
2. Garantir que o fixture de teste retorne ao seu estado de repouso (`inactive`).
3. Nunca execute scripts de delecao indiscriminada baseados em aparencia de teste.
