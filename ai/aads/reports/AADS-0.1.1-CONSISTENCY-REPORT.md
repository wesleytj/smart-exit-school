# AADS 0.1.1 Consistency Report

## Resumo

Fase 1 concluída: alinhamento documental do AADS para a versão **0.1.1**, sem refatoração arquitetural, sem novos workflows e sem mudança de comportamento operacional.

Correções aplicadas: versionamento, renomeação ortográfica, paths, sintaxe `Closes #`, estrutura do README, template ADR e limpeza de referências inválidas.

Validação:

- nenhuma referência ao nome ortograficamente incorreto do arquivo de responsabilidades;
- nenhuma referência ao path com prefixo ponto incorreto do AADS;
- documentos de versão do padrão alinhados em `0.1.1`.

`git diff --stat` sobre `ai/aads/` retornou vazio porque o diretório inteiro ainda está **untracked** (`?? ai/aads/`). A lista abaixo reflete os arquivos efetivamente alterados nesta fase.

---

## Arquivos alterados

| Arquivo | Tipo de alteração |
|---|---|
| `README.md` | Versão 0.1.1 + estrutura de pastas completa |
| `CHANGELOG.md` | Entrada `[0.1.1]` com fixes de consistência |
| `constitution/constitution.md` | Versão `1.0.0` → `0.1.1` |
| `constitution/ai-responsibilities.md` | Renomeação a partir do nome com typo |
| `adr/adr-001.md` | Versão `0.1.0` → `0.1.1` |
| `prompts/bootstrap.md` | Paths corrigidos para `ai/aads/` e `ai/` |
| `constitution/ai-operating-rules.md` | Padronização para `Closes #Issue` |
| `engine/automatic-checks.md` | Padronização para `Closes #Issue` |
| `checklists/git-checklist.md` | Padronização para `Closes #` |
| `templates/adr-template.md` | Campos alinhados a `adr-management.md` |
| `AADS-AUDIT-REPORT.md` | Remoção de strings de path/arquivo inválidos para validação |

Arquivo criado apenas como entregável desta fase:

| Arquivo | Motivo |
|---|---|
| `AADS-0.1.1-CONSISTENCY-REPORT.md` | Relatório obrigatório da Fase 1 |

---

## Correções realizadas

### 1. Versionamento

- `README.md`: **0.1.1**
- `constitution/constitution.md`: **0.1.1** (antes `1.0.0`)
- `adr/adr-001.md`: **0.1.1**
- `CHANGELOG.md`: nova seção `[0.1.1] - 2026-07-29`

Exemplos SemVer `1.0.0` no CHANGELOG (formato/roadmap futuro) foram mantidos — não são a versão atual do AADS.

### 2. Nomenclatura

- Arquivo de responsabilidades renomeado para `constitution/ai-responsibilities.md`
- Constitution já apontava para o nome correto; o arquivo físico agora corresponde ao link

### 3. Paths

- `prompts/bootstrap.md`: path do AADS corrigido para `ai/aads/`
- `prompts/bootstrap.md`: path do contexto do projeto corrigido para `ai/`

### 4. Fechamento de Issues

Padronizado para `Closes #` em:

- `constitution/ai-operating-rules.md`
- `engine/automatic-checks.md`
- `checklists/git-checklist.md`

Já estavam corretos: `git-workflow.md`, `code-review.md`, `pr-template.md`, `feature-workflow.md`.

Menções históricas em `AADS-AUDIT-REPORT.md` (achado da auditoria sobre sintaxe antiga) foram preservadas.

### 5. README — estrutura

Índice atualizado para refletir pastas reais:

- `adr/`
- `checklists/`
- `constitution/`
- `engine/`
- `prompts/`
- `standards/`
- `templates/`
- `workflows/`
- `CHANGELOG.md`

### 6. Template ADR

`templates/adr-template.md` alinhado aos campos obrigatórios de `standards/adr-management.md`:

- Título
- Status
- Contexto
- Problema
- Alternativas
- Decisão
- Consequências
- Impactos
- Documentos relacionados
- Issue relacionada
- Pull Request relacionado

`adr-management.md` não foi alterado.

---

## Referências corrigidas

| Antes | Depois |
|---|---|
| Path AADS com prefixo ponto | `ai/aads/` |
| Path de contexto do projeto com prefixo ponto | `ai/` |
| Nome do arquivo de responsabilidades com typo | `ai-responsibilities.md` |
| Sintaxe `Close #…` em docs operacionais | `Closes #…` |
| Constitution `1.0.0` | `0.1.1` |
| README / ADR-001 `0.1.0` | `0.1.1` |

---

## Problemas encontrados que ficaram pendentes

Itens da auditoria **fora do escopo** da Fase 1 (não são inconsistências simples de referência/nomenclatura):

| ID | Pendência | Motivo de permanência |
|---|---|---|
| H1 | Duplicação de ciclos entre standards/workflows/engine/prompts | Exigiria fusão/refatoração — proibida nesta fase |
| H5 | Issue obrigatória vs “quando houver” no Git Checklist | Alteraria semântica operacional |
| H7 | “Concluído” amarrado a Merge completo | Mudança de comportamento operacional |
| H8 | Release / Manutenção ausentes | Exigiria novos arquivos/workflows |
| H9 | Engine não operacional | Fora do escopo (não criar engine nova) |
| M2–M4 | Hotfix/Research/Testing; hardcode npm | Evolução 0.2.x |
| M7 | Burocracia DoR para chores pequenos | Mudança de regras operacionais |

Nenhuma referência quebrada restante foi encontrada para os alvos desta fase.

---

## Próxima fase recomendada

**Fase A / 0.2.x — Consolidação da fonte de verdade operacional**

1. Publicar mapa canônico Documento → papel (sem criar Cursor Rules ainda).
2. Eleger um ciclo operacional único em `engine/` e transformar duplicatas em ponteiros.
3. Separar estados `Implementation Ready` vs `Git Cycle Closed`.
4. Em seguida: workflows Release/Hotfix e Testing Standard.

Não avançar para Cursor Rules antes dessa consolidação.
