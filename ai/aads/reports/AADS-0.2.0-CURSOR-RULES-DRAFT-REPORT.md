# AADS 0.2.0 Cursor Rules Draft Report

## Arquivos criados

| Arquivo | alwaysApply | Responsabilidade |
|---|---|---|
| `.cursor/rules/aads-core.mdc` | true | Governança permanente / honestidade |
| `.cursor/rules/aads-workflow.mdc` | true | Máquina de estados operacional |
| `.cursor/rules/aads-validation.mdc` | true | Validação + Completion Model |
| `.cursor/rules/aads-git-delivery.mdc` | true | Separação implementação vs entrega Git |

Arquivo de relatório:

| Arquivo |
|---|
| `ai/aads/AADS-0.2.0-CURSOR-RULES-DRAFT-REPORT.md` |

**Não alterados:** Constitution, Source of Truth Map, Operating Model, workflows AADS, engine automática, MCP/tools.

---

## Origem de cada regra

| Rule | Fonte primária | Fontes secundárias (ponteiros) |
|---|---|---|
| `aads-core.mdc` | `constitution/constitution.md`, `engine/source-of-truth-map.md` | — |
| `aads-workflow.mdc` | `engine/aads-operating-model.md` | `standards/work-item-classification.md` |
| `aads-validation.mdc` | `engine/aads-operating-model.md` (Completion Model) | `checklists/definition-of-done.md`, `checklists/feature-checklist.md`, `engine/automatic-checks.md` |
| `aads-git-delivery.mdc` | `engine/aads-operating-model.md` + intenção do Git Workflow | `standards/git-workflow.md`, `checklists/git-checklist.md` |

---

## Conceitos extraídos

- Constitution como teto permanente
- Hierarquia / resolução de conflitos via Source of Truth Map
- Estados REQUEST → … → COMPLETION
- Context loading mínimo
- Human Approval Gates (lista curta)
- Completion Model: Implementation / Delivery / Release
- Proibição de responder só “Concluído.”
- Validated ≠ Delivered
- Git delivery respeita permissões; sem automação irreversível

---

## Conceitos propositalmente não incluídos

| Conceito | Motivo |
|---|---|
| Texto integral da Constitution / Engine | Evitar duplicação; rules apontam para a fonte |
| Checklists completos (Gates item a item) | Permanecem em `checklists/`; rules só referenciam |
| Comandos npm/stack-specific | Projeto define comandos; rule exige usar os do projeto |
| Branch naming / commit types detalhados | Ficam em `git-workflow` / `branch-strategy` / templates |
| Workflows Feature/Hotfix/Release completos | Não criar novos conceitos; não colar workflows |
| ADR management passo a passo | Continua em `standards/adr-management.md` |
| Prompts bootstrap/system | Empacotamento AADS; não são Cursor Rules |
| Automação de Git/PR/merge | Explicitamente fora do escopo 0.2.0 |
| Agentes especializados / MCP | Fora do escopo |

---

## Riscos de duplicação identificados

| Risco | Mitigação aplicada |
|---|---|
| Rules virarem cópia do Operating Model | Rules são curtas e imperativas; detalhe fica no Engine |
| Completion Model repetido em 3 rules | Core não inclui; Validation define estados; Git Delivery só aplica Delivery |
| Git Workflow inteiro dentro da rule | Apenas distinção + never/always; referência ao standard |
| Prompts AADS vs Cursor Rules divergirem | Prompts já apontam ao Engine; rules também — mesma fonte |
| `alwaysApply: true` em 4 files = ruído de tokens | Aceitável no draft; fase futura pode escopar `aads-git-delivery` por globs/eventos |

---

## Validação do resultado esperado

Um agente novo com:

1. Cursor Rules (`aads-*.mdc`)
2. `ai/aads/engine/aads-operating-model.md`
3. `ai/aads/engine/source-of-truth-map.md`

deve conseguir:

- classificar e planejar antes de codar;
- carregar contexto mínimo;
- validar e reportar Implementation vs Delivery vs Release;
- não confundir código validado com código entregue.

Sem precisar memorizar todo o repositório AADS.

---

## Próximos passos recomendados

1. Revisar humana do draft (clareza / tamanho / alwaysApply).
2. Atualizar `ai/aads/README.md` + `CHANGELOG.md` para **0.2.0** (se desejado em commit separado).
3. Opcional: alinhar `prompts/system-prompt.md` a citar `.cursor/rules/`.
4. Só então marcar rules como estáveis (não-draft) após 2–3 tarefas reais.
