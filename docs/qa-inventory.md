# Inventário read-only de instituições (QA)

**Status:** snapshot — **não** autoriza limpeza, rename, normalize de slug, ajuste de plano ou qualquer escrita.

**Data da leitura:** 2026-09-17 (America/Sao_Paulo).  
**HEAD do repositório na auditoria Git:** `515f3f95fe55cc5c8f92c138c8c413f23fa4b927`.  
**Método:** `SELECT` em `public.schools` via `docker exec` no Postgres local (`supabase_db_smart-exit-school`). Sem `INSERT`/`UPDATE`/`DELETE`, sem Data API, sem Browser E2E, sem `db reset`.  
**Campos:** id, name, slug, status, plan, timezone, locale, created_at, updated_at, contagens de `academic_groups` e `students`. Sem senhas, tokens ou PII de alunos.

Política normativa: [qa-data-governance.md](./qa-data-governance.md).

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
| Nome | Smart Exit Academy |
| Slug | `smart-exit-dev-school` |
| Status / plan | `active` / `pro` |
| Grupos acadêmicos / alunos | 2 / 1 |
| created_at = updated_at | 2026-09-04 05:15:49+00 |
| **Classe** | Preservar sem alteração (não usar como QA descartável) |
| **Justificativa** | Seed (`supabase/seed.sql`) com dados acadêmicos. Decisão humana: preservar. Divergência `plan` live (`pro`) vs seed (`basic`) e timestamps iguais permanecem **fora de escopo** — possível investigação futura, não autorizada aqui. |

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

## Decisões humanas registradas (esta atividade)

1. Promoção canônica permanente de `76f29d9f-…` / `qa-cursor-escola-teste` — **feita na documentação**; registro no banco intacto.
2. `70947c40-…` / `qa-temp-save-pending` — **preservar**; cleanup não autorizado.
3. `5fbc9b5c-…` / `smart-exit-dev-school` — **preservar**; divergência de plano/timestamps fora de escopo.

Investigação de `plan`/`pro`, `updated_at` ou slug **não** foi reaberta.
