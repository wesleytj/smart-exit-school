# AADS 0.2.1 Cursor Rules Validation Report

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `.cursor/rules/aads-core.mdc` | Mantido `alwaysApply: true`; texto levemente clarificado |
| `.cursor/rules/aads-workflow.mdc` | Mantido `alwaysApply: true`; ponte curta para Completion reporting |
| `.cursor/rules/aads-validation.mdc` | `alwaysApply: false` + globs de código/docs/SQL/testes |
| `.cursor/rules/aads-git-delivery.mdc` | `alwaysApply: false`; description orientada a commit/push/PR/merge/release |
| `ai/aads/README.md` | Versão **0.2.1** |
| `ai/aads/CHANGELOG.md` | Entrada **0.2.1** |

Arquivos criados:

| Arquivo | Motivo |
|---|---|
| `ai/aads/tests/cursor-rules-validation.md` | Cenários 1–4 de validação comportamental |
| `ai/aads/AADS-0.2.1-CURSOR-RULES-VALIDATION-REPORT.md` | Este relatório |

**Não alterados:** Constitution, Operating Model, Source of Truth Map; sem novas rules/MCP/agentes.

---

## Mudanças de escopo

| Rule | 0.2.0 | 0.2.1 | Motivo |
|---|---|---|---|
| `aads-core` | always | always | Governança permanente |
| `aads-workflow` | always | always | Máquina de estados central; tokens aceitos |
| `aads-validation` | always | **contextual** (globs) | Evitar ruído em exploração pura |
| `aads-git-delivery` | always | **contextual** (agent-requested) | Evitar ruído sem intent de entrega |

### Globs de `aads-validation`

```text
src/**/*.{js,jsx,ts,tsx,css}
docs/**/*.md
supabase/**/*.sql
**/*.{test,spec}.{js,jsx,ts,tsx}
```

### Limitação de plataforma

Cursor não dispara rules por “STATE 06” ou por frase “faça o commit”.  
Aproximação:

- Validation → globs + description mencionando STATE 06.
- Git Delivery → description rica; anexação depende do agente.

Isso deve ser validado na prática (cenários do arquivo de testes).

---

## Revisão de conteúdo (item 3)

| Critério | Resultado |
|---|---|
| Não contradiz Source of Truth Map | OK — Core/Workflow deferem Constitution + Engine |
| Não duplica checklists | OK — apenas ponteiros de path |
| Não cria regra inexistente no Engine | OK — estados, gates e Completion já existem no Operating Model |
| Sem comandos de stack | OK — “comandos do projeto”; removido qualquer npm hardcoded nas rules |

Ajuste menor em `aads-workflow`: lembrete de Completion reporting para quando `aads-validation` não estiver anexada (exploração → implementação sem globs ainda abertos).

---

## Cenários testados

Documentados em `ai/aads/tests/cursor-rules-validation.md`.

| # | Cenário | Status nesta fase |
|---|---|---|
| 1 | Nova Feature — “Adicionar autenticação” | Especificado (dry-run manual pendente) |
| 2 | Bug simples — “Corrigir erro de botão” | Especificado (dry-run manual pendente) |
| 3 | Arquitetural — “Trocar banco de dados” | Especificado (dry-run manual pendente) |
| 4 | Commit — “Faça o commit” | Especificado (dry-run manual pendente) |

Esta fase **não** executou chats reais de agente (sem sessão limpa automatizada no ambiente). Os cenários estão prontos para validação prática humana/agente.

---

## Problemas encontrados

| Problema | Severidade | Notas |
|---|---|---|
| Git Delivery sem globs pode não auto-anexar | Média | Mitigar na validação prática; se falhar, instruir menção explícita da rule ou alwaysApply seletivo |
| Validation globs não cobrem todos os paths futuros | Baixa | Ajustar globs se surgirem pastas novas (`api/`, etc.) |
| Completion Model em duas rules (workflow + validation) | Baixa | Sobreposição mínima e deliberada para não perder reporting quando validation está off |
| Quatro rules still partially overlap em “never claim done” | Baixa | Aceitável; evita lacuna de escopo |

Nenhum conflito com Constitution/Engine identificado no texto das rules.

---

## Recomendações para versão estável

1. Executar os 4 cenários em chats novos e registrar pass/fail.
2. Se Cenário 4 falhar na anexação de `aads-git-delivery`, opções:
   - enriquecer description; ou
   - `alwaysApply: true` só nessa rule; ou
   - rule request explícito no prompt do usuário.
3. Após 2–3 tarefas reais no Smart Exit School, promover rules de **draft → stable** (tag no CHANGELOG).
4. Opcional 0.2.2: alinhar `prompts/system-prompt.md` a citar `.cursor/rules/`.
5. Não expandir o número de rules até os cenários passarem.

---

## Status

AADS **0.2.1** — Cursor Rules otimizadas para menor ruído; cenários de validação documentados.  
Pronto para validação prática antes de declarar rules **stable**.
