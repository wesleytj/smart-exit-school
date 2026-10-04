# Inventário read-only de instituições (QA)

**Status:** snapshot — **não** autoriza limpeza, rename, normalize de slug, ajuste de plano ou qualquer escrita.

**Data da leitura:** 2026-09-17 (America/Sao_Paulo).  
**HEAD do repositório na auditoria Git:** `515f3f95fe55cc5c8f92c138c8c413f23fa4b927`.  
**Método:** `SELECT` em `public.schools` via `docker exec` no Postgres local (`supabase_db_smart-exit-school`). Sem `INSERT`/`UPDATE`/`DELETE`, sem Data API, sem Browser E2E, sem `db reset`.  
**Campos:** id, name, slug, status, plan, timezone, locale, created_at, updated_at, contagens de `academic_groups` e `students`. Sem senhas, tokens ou PII de alunos.

Política normativa: [qa-data-governance.md](./qa-data-governance.md).  
Smoke de Production: [qa-production-smoke.md](./qa-production-smoke.md).

## Classificações usadas

| Classe | Significado |
|---|---|
| QA canônica permanente | Referência oficial de reuso para Platform Admin (governança; o banco não foi alterado por esta classificação) |
| Temporário conhecido a preservar | Criado em ciclo de teste; **não** apagar sem autorização humana específica |
| Registro que exige decisão humana | Evidência incompleta, conflito com seed, ou cleanup só com autorização |
| Não classificado / evidência insuficiente | Leitura não disponível ou atributos inconclusivos |

Atributos tabulares abaixo permanecem o snapshot de 2026-09-17. Esta atividade **não** relê o banco.

## Registros observados (3)

### 1. Seed de desenvolvimento

| Campo | Valor |
|---|---|
| ID | `5fbc9b5c-58fb-46fd-9a0d-15b27e8b9e2a` |
| Nome | Smart Exit Development School |
| Slug | `smart-exit-dev-school` |
| Status / plan | `active` / `basic` |
| Grupos acadêmicos / alunos | 2 / 1 |
| created_at = updated_at | 2026-09-04 05:15:49+00 |
| **Classe** | Preservar sem alteração (não usar como QA descartável) |
| **Justificativa** | Seed (`supabase/seed.sql`) com dados acadêmicos. Baseline canônico alinhado em 03/10/2026 (nome "Smart Exit Development School" e plano "basic") para conformidade integral com as invariantes do Database Auditor v1 (`npm run audit:db`). Não usar como QA descartável. |

### 2. Instituição QA canônica permanente (`qa-cursor-escola-teste`)

| Campo | Valor |
|---|---|
| ID | `76f29d9f-c6fd-4561-89f8-403fef0ccb40` |
| Nome | QA Cursor Escola Teste - Teste 2 |
| Slug | `qa-cursor-escola-teste` |
| Status / plan | `active` / `pro` |
| Grupos acadêmicos / alunos | 0 / 0 |
| created_at = updated_at | 2026-09-14 16:54:26+00 |
| **Classe** | **QA canônica permanente** |
| **Justificativa** | Decisão humana de governança (Issue #45, sucessora da #43 / PR #44). Reuso oficial para testes que precisem de instituição existente, se o estado for compatível. A promoção **não** altera o registro no banco e **não** autoriza mudar nome, slug, plano ou demais atributos. Snapshot 2026-09-17: nome “Teste 2”, `plan` `pro`, sem grupos/alunos. |

### 3. Temporário conhecido (`qa-temp-save-pending`)

| Campo | Valor |
|---|---|
| ID | `70947c40-411a-422a-bdcb-529d0129bd38` |
| Nome | QA Temp Save Pending - B |
| Slug | `qa-temp-save-pending` |
| Status / plan | `active` / `pro` |
| Grupos acadêmicos / alunos | 0 / 0 |
| created_at = updated_at | 2026-09-15 16:29:56+00 |
| **Classe** | Temporário conhecido a preservar |
| **Justificativa** | Decisão humana: **preservar**. Não excluir, alterar ou reclassificar nesta atividade. Cleanup **não** autorizado. |

## `qa-cursor-escola-teste` — decisão desta atividade

**QA canônica permanente.** ID `76f29d9f-c6fd-4561-89f8-403fef0ccb40`, slug `qa-cursor-escola-teste`. Decisão humana de governança. Banco não alterado.

## Decisões humanas registradas

1. Promoção canônica permanente de `76f29d9f-…` / `qa-cursor-escola-teste` — **feita na documentação**; registro no banco intacto.
2. `70947c40-…` / `qa-temp-save-pending` — **preservar**; cleanup não autorizado.
3. `5fbc9b5c-…` / `smart-exit-dev-school` — **alinhamento canônico com seed.sql** (nome "Smart Exit Development School", plano "basic") registrado em 03/10/2026 para atendimento obrigatório ao Database Auditor v1 (`npm run audit:db`).

## Fixture de Production planejado

**Status:** planejado — o aluno ainda não foi criado. Esta seção não autoriza a criação por si só. A criação segue [qa-production-smoke.md](./qa-production-smoke.md), depois da revisão desse procedimento.

Nenhum ID abaixo foi lido no banco. Os campos de ID ficam pendentes até a criação autorizada. Não há UUID de planejamento.

| Campo | Valor |
|---|---|
| Nome | `QA Pickup Smoke` |
| Matrícula | `QA-PICKUP-001` |
| Instituição | Colégio Adventista de Esteio |
| Turma | `6ma` (já existente; não criar outra) |
| Portão do smoke | `Portão` (já existente) |
| Estado de repouso | `inactive` fora da janela de teste |
| Estado final do smoke | `inactive`, e nenhum `pickup_events` desse fixture em `called` |
| Papel | Fixture permanente. Não excluir após os testes. |
| `students.id` | Pendente — preencher após a criação autorizada |
| `student_enrollments.id` | Pendente — preencher após a criação autorizada |
| `student_group_assignments.id` | Pendente — preencher após a criação autorizada |
| Fora do procedimento | Alunos já existentes nessa instituição, inclusive matrícula `TEST-001` |

`pickup_events` concluídos desse fixture, quando o smoke passar a existir, permanecem no banco. Ao final de cada smoke o fixture permanece `inactive` e não pode existir evento `called` desse fixture. Esta seção não lista eventos porque nenhum foi criado por este planejamento.
