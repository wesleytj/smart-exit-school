# Work Item Classification

**Version:** 0.3.0  
**Status:** Active  
**Layer:** standards

## Objective

Identificar o tipo de trabalho antes de qualquer implementação.

## Scope

Classificação obrigatória (Operating Model STATE 02).

## Rules

Nenhum trabalho deve começar sem classificação.  
Em dúvida, perguntar. Nunca assumir.  
Trabalhos mistos devem ser separados.

### Workflow map

| Type | Workflow |
|---|---|
| Feature | `workflows/feature-workflow.md` |
| Bug Fix | `workflows/bugfix-workflow.md` |
| Refactor | `workflows/refactor-workflow.md` |
| Documentation | Git `docs/` branch + `standards/documentation-standard.md` |
| Infrastructure | `workflows/maintenance-workflow.md` (chore) |
| Hotfix | `workflows/hotfix-workflow.md` |
| Research / Spike | `workflows/research-spike-workflow.md` |
| Release | `workflows/release-workflow.md` |
| Maintenance | `workflows/maintenance-workflow.md` |
| Recovery | `workflows/recovery-workflow.md` |

---

## Tipos de Work Item

### 1. Feature

Nova funcionalidade. Workflow: `workflows/feature-workflow.md`.

Issue → Branch `feature/` → Dev → Docs → Testes → PR → Merge

### 2. Bug Fix

Corrige comportamento incorreto. Workflow: `workflows/bugfix-workflow.md`.

Issue → Branch `fix/` → Correção → Testes → PR → Merge

### 3. Refactor

Melhora estrutura sem mudar comportamento externo. Workflow: `workflows/refactor-workflow.md`.

Issue → Branch `refactor/` → Refatoração → Testes → PR → Merge

### 4. Documentation

Somente documentação. Branch `docs/`. Ver `standards/documentation-standard.md`.

### 5. Infrastructure

Ambiente/CI/tooling. Tipicamente `chore/` + `workflows/maintenance-workflow.md`.

### 6. Hotfix

Falha crítica autorizada. Workflow: `workflows/hotfix-workflow.md`.  
Ignora partes do ciclo **somente** com G-HOTFIX. Follow-up documental obrigatório.

### 7. Research

Investigação; não gera código definitivo. Workflow: `workflows/research-spike-workflow.md`.  
Entrega: problema, alternativas, recomendação (`templates/research-template.md`).

### 8. Spike

Experimento descartável. Mesmo workflow Research/Spike. Nunca código de produção direto.

---

## Trabalhos mistos

Separar em itens com ciclos próprios (ex.: Feature + Documentation + Refactor).

## Proibição

Não tratar implementação grande como uma única tarefa indivisível.

## Pré-checks

1. Tipo do trabalho?
2. Issue?
3. Branch correta?
4. Docs necessárias?
5. ADR necessária?

## Related Documents

- `engine/aads-operating-model.md`
- `engine/definition-of-ready.md`
- `INDEX.md`
- `standards/branch-strategy.md`
