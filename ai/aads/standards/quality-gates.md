# Quality Gates

**Version:** 0.3.0  
**Status:** Active  
**Layer:** standards

## Objective

Mapear Quality Gates do AADS sem redefinir checklists.

## Scope

Interpretação e ordem dos gates. Detalhe operacional nos checklists/engine.

## Rules

| Gate group | Blocks | Canonical docs |
|---|---|---|
| Definition of Ready | Implementation start | `engine/definition-of-ready.md` |
| Quality Validation | Implementation Complete | `engine/automatic-checks.md`, `standards/testing-standard.md` |
| Feature/tech checklists | Implementation Complete | `checklists/feature-checklist.md` |
| Git Delivery | Delivery Complete | `checklists/git-checklist.md`, `standards/git-workflow.md` |
| Definition of Done | Completion reporting | `checklists/definition-of-done.md` |
| Release checklist | Release Complete | `checklists/release-checklist.md` |

1. Não hardcodar comandos de stack neste standard.
2. Falha em Quality Validation ≠ falha de Delivery (Completion Model).
3. Gates humanos (G-*) interrompem antes/durante implementação conforme Engine.

## Related Documents

- `engine/aads-operating-model.md`
- `engine/automatic-checks.md`
- `checklists/definition-of-done.md`
- `standards/testing-standard.md`
