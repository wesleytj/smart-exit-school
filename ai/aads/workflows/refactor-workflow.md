# Refactor Workflow

**Version:** 0.3.0  
**Status:** Active  
**Layer:** workflows

## Objective

Melhorar estrutura interna sem alterar comportamento externo observável.

## Scope

Refactors estruturais. Mudança de comportamento = Feature ou Bug Fix, não Refactor.

## Responsibilities

| Role | Duty |
|---|---|
| IA | Preservar comportamento, validar regressão, limitar escopo |
| Humano | Aprovar se G-ARCH / risco elevado |

## Rules

1. Branch: `refactor/<issue>-<descricao>`.
2. Definir invariantes de comportamento antes de editar.
3. Proibido misturar Feature/Bug no mesmo PR.
4. Preferir passos incrementais (Constitution Art. 13).
5. Testes/validações do projeto devem cobrir o alcance refatorado.
6. Se alterar arquitetura permanente → ADR + Human Approval (G-ARCH).
7. Docs: atualizar somente se estrutura documentada mudar.
8. Completion Model padrão (Implementation / Delivery).

## Related Documents

- `standards/work-item-classification.md`
- `standards/architecture-definition.md`
- `standards/testing-standard.md`
- `standards/code-review.md`
- `engine/aads-operating-model.md`
- `checklists/definition-of-done.md`
