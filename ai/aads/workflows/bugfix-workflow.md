# Bug Fix Workflow

**Version:** 0.3.0  
**Status:** Active  
**Layer:** workflows

## Objective

Sequência oficial para correção de comportamento incorreto existente.

## Scope

Bug Fix classificado em `standards/work-item-classification.md`.  
Não cobre Hotfix (produção crítica) — ver `hotfix-workflow.md`.

## Responsibilities

| Role | Duty |
|---|---|
| IA | Classificar, reproduzir, corrigir, validar, preparar Delivery |
| Humano | Aprovar merge quando exigido |

## Rules

1. Seguir Operating Model STATES 01→08 (`engine/aads-operating-model.md`).
2. Branch: `fix/<issue>-<descricao>` (`standards/branch-strategy.md`).
3. Reproduzir ou documentar o defeito antes de alterar código.
4. Alterar apenas o necessário para corrigir; sem refactors não relacionados.
5. Validar regressão no alcance afetado (comandos do projeto).
6. Declaração: Implementation Complete após validação; Delivery Complete via Git Workflow.
7. Atualizar docs somente se o comportamento público/documentado mudar.

## Related Documents

- `standards/work-item-classification.md`
- `engine/aads-operating-model.md`
- `standards/git-workflow.md`
- `checklists/definition-of-done.md`
- `checklists/git-checklist.md`
- `workflows/hotfix-workflow.md`
