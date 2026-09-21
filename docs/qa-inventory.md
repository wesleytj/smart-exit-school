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
| Candidato a QA canônico | Reuso preferencial para Platform Admin; promoção permanente exige humano |
| Temporário conhecido a preservar | Criado em ciclo de teste; **não** apagar nesta atividade |
| Registro que exige decisão humana | Evidência incompleta, conflito com seed, ou cleanup só com autorização |
| Não classificado / evidência insuficiente | Leitura não disponível ou atributos inconclusivos |

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
| **Classe** | Registro que exige decisão humana (não usar como QA descartável) |
| **Justificativa** | Corresponde ao slug do seed (`supabase/seed.sql`). Possui dados acadêmicos. `plan` live (`pro`) **diverge** do seed versionado (`basic`) — descoberta, não bug confirmado nem correção. Mutá-lo ou apagá-lo quebra invariantes do Auditor. |

### 2. Candidato QA (`qa-cursor-escola-teste`)

| Campo | Valor |
|---|---|
| ID | `76f29d9f-c6fd-4561-89f8-403fef0ccb40` |
| Nome | QA Cursor Escola Teste - Teste 2 |
| Slug | `qa-cursor-escola-teste` |
| Status / plan | `active` / `pro` |
| Grupos acadêmicos / alunos | 0 / 0 |
| created_at = updated_at | 2026-09-14 16:54:26+00 |
| **Classe** | **Candidato a QA canônico — condicionado** |
| **Justificativa** | ID/slug batem com o registro protegido e com o ciclo de QA de edição (2026-09-14). Sem dados acadêmicos acoplados, adequado a reuso de CRUD Platform Admin. **Não** está em estado inicial “nome original + Basic”: o nome contém “Teste 2” e `plan` é `pro`. `created_at` = `updated_at` apesar de mutações históricas relatadas — evidência insuficiente para afirmar bug de `updated_at`. **Não promovido a canônico permanente.** |

### 3. Temporário conhecido (`qa-temp-save-pending`)

| Campo | Valor |
|---|---|
| ID | `70947c40-411a-422a-bdcb-529d0129bd38` |
| Nome | QA Temp Save Pending - B |
| Slug | `qa-temp-save-pending` |
| Status / plan | `active` / `pro` |
| Grupos acadêmicos / alunos | 0 / 0 |
| created_at = updated_at | 2026-09-15 16:29:56+00 |
| **Classe** | Temporário conhecido a preservar **e** registro que exige decisão humana para cleanup futuro |
| **Justificativa** | Identificado na autorização humana como protegido. Aparência de dado temporário **não** autoriza exclusão. Cleanup só com Issue e IDs autorizados. |

## Candidato `qa-cursor-escola-teste` — decisão desta atividade

**Candidato condicionado.** Reutilizar este ID/slug por padrão. Não alterar. Não promover de forma irreversível até decisão humana que atualize a tabela em `qa-data-governance.md`.

## Follow-ups humanos (fora de escopo)

1. Confirmar ou recusar a promoção do candidato `76f29d9f-…` a canônico permanente.
2. Decidir destino de `70947c40-…` (`qa-temp-save-pending`) — preservar ou cleanup autorizado.
3. Decidir se `smart-exit-dev-school` com `plan = pro` (vs seed `basic`) deve ser investigado; não tratar como bug confirmado aqui.
4. `created_at` = `updated_at` nos três registros: possível inconsistência de trigger; pesquisa prévia existe; **não** confirmar bug nesta Issue.

Nenhum destes itens foi executado.
