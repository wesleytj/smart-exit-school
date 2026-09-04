# Artifact Lifecycles

**Version:** 0.3.0  
**Status:** Active  
**Layer:** standards

## Objective

Ciclos de vida oficiais de artefatos de processo (consolidado — evita 8 arquivos separados).

## Scope

Issue, Branch, PR, Merge, ADR, Prompt, Documentation.  
Detalhe Git: `standards/git-workflow.md`. Detalhe ADR: `standards/adr-management.md`.

## Rules

### Issue

`Open → In progress → Ready for review → Closed`  
Fecha com Delivery Complete + `Closes #N` quando aplicável.  
Template: `templates/issue-template.md`.

### Branch

`Create → Implement → PR → Merge → Delete`  
Uma Issue → uma branch principal.  
Ver `standards/branch-strategy.md`.

### Pull Request

`Draft/Open → Checks → Review → Approved → Merged`  
Template: `templates/pr-template.md`.

### Merge

Somente via PR; padrão AADS: Squash and Merge (salvo política do projeto).  
Merge alimenta Delivery Complete, não Release Complete.

### ADR

`Proposed → Accepted → (Superseded|Obsolete)`  
Nunca apagar. Ver `standards/adr-management.md`.

### Prompt

Ver `standards/prompt-management.md`.

### Documentation

Código → validação → docs impactadas → (ADR se necessário).  
Ver `standards/documentation-standard.md`.

## Related Documents

- `standards/git-workflow.md`
- `standards/branch-strategy.md`
- `standards/adr-management.md`
- `standards/prompt-management.md`
- `standards/documentation-standard.md`
- `engine/aads-operating-model.md`
