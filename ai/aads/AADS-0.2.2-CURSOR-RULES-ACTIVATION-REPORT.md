# AADS 0.2.2 Cursor Rules Activation Report

## Rules ativadas

| Arquivo | Status interno | alwaysApply | Aplicação |
|---|---|---|---|
| `.cursor/rules/aads-core.mdc` | **ACTIVE FOR VALIDATION** | `true` | Sempre |
| `.cursor/rules/aads-workflow.mdc` | **ACTIVE FOR VALIDATION** | `true` | Sempre |
| `.cursor/rules/aads-validation.mdc` | **ACTIVE FOR VALIDATION** | `false` | Globs |
| `.cursor/rules/aads-git-delivery.mdc` | **ACTIVE FOR VALIDATION** | `false` | Description triggers |

Nenhuma rule marcada como **stable**.

---

## Validação de frontmatter / formato

| Check | Resultado |
|---|---|
| Extensão `.mdc` | OK (4 arquivos) |
| YAML frontmatter delimitado por `---` | OK |
| `description` presente | OK |
| `alwaysApply` presente | OK |
| `globs` (validation) em lista YAML | OK (melhor compatibilidade Cursor) |
| Nomes corretos | `aads-core`, `aads-workflow`, `aads-validation`, `aads-git-delivery` |
| Sem campos inventados incompatíveis | OK |

---

## Referências canônicas

Todas as quatro rules apontam para o conjunto AADS canônico:

| Path | core | workflow | validation | git-delivery |
|---|---|---|---|---|
| `ai/aads/constitution/constitution.md` | ✓ | ✓ | ✓ | ✓ |
| `ai/aads/engine/source-of-truth-map.md` | ✓ | ✓ | ✓ | ✓ |
| `ai/aads/engine/aads-operating-model.md` | ✓ | ✓ | ✓ | ✓ |

---

## Estratégia de aplicação

### alwaysApply

- `aads-core` — governança permanente
- `aads-workflow` — máquina de estados em todo pedido

### globs (`aads-validation`)

```yaml
globs:
  - src/**/*.{js,jsx,ts,tsx,css}
  - docs/**/*.md
  - supabase/**/*.sql
  - "**/*.{test,spec}.{js,jsx,ts,tsx}"
```

Ativa quando arquivos correspondentes estão no contexto / sendo editados.

### description triggers (`aads-git-delivery`)

`alwaysApply: false` sem globs.  
Dependência de description para o agente anexar em intents de:

commit · push · branch · PR · merge · release · Delivery Complete

---

## Limitações conhecidas do Cursor

1. **Sem trigger por estado AADS** — não existe evento nativo “STATE 06”; validation depende de globs + description.
2. **Sem trigger por frase do usuário** — “Faça o commit” pode não anexar `aads-git-delivery` automaticamente; pode exigir menção explícita da rule.
3. **Globs ≠ “arquivo alterado”** — globs tipicamente amarram a arquivos no contexto, não a um diff hook.
4. **Quatro rules always/parcial** — core+workflow sempre consomem tokens; aceito por desenho 0.2.1/0.2.2.
5. **ACTIVE FOR VALIDATION ≠ garantia comportamental** — só ativa a camada; a prova é o checklist manual.

---

## Como executar validação manual

1. Abrir o projeto no Cursor.
2. Confirmar as 4 rules no painel de Project Rules.
3. Seguir `ai/aads/tests/cursor-rules-execution-checklist.md`.
4. Um **chat novo** por cenário (1–4).
5. Registrar Pass/Fail no checklist.
6. Só promover a **stable** após os mínimos definidos no checklist.

Cenários espelhados também em `ai/aads/tests/cursor-rules-validation.md`.

---

## Arquivos desta fase

| Arquivo | Ação |
|---|---|
| `.cursor/rules/aads-*.mdc` (4) | Ativados: status ACTIVE FOR VALIDATION + refs canônicas |
| `ai/aads/tests/cursor-rules-execution-checklist.md` | Criado |
| `ai/aads/AADS-0.2.2-CURSOR-RULES-ACTIVATION-REPORT.md` | Criado |
| `ai/aads/README.md` | Versão 0.2.2 |
| `ai/aads/CHANGELOG.md` | Entrada 0.2.2 |

**Não alterados:** Constitution, Operating Model, Source of Truth Map, Workflows, Standards.

---

## Status

AADS **0.2.2** — Cursor Rules **ACTIVE FOR VALIDATION**.  
Pronto para validação comportamental dentro do Cursor.  
**Stable ainda não autorizado.**
