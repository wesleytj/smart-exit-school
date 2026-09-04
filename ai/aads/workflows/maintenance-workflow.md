# Maintenance Workflow

**Version:** 0.3.0  
**Status:** Active  
**Layer:** workflows

## Objective

Trabalho contínuo pós-entrega: dívida técnica, dependências, higiene, monitoramento de problemas conhecidos.

## Scope

Chores e manutenção que não são Feature/Bug/Hotfix.  
Exemplos: upgrades de dependência, limpeza, atualização de CI, follow-ups pós-hotfix.

## Responsibilities

| Role | Duty |
|---|---|
| IA | Classificar, limitar escopo, validar, documentar impacto |
| Humano | Priorizar e aprovar mudanças de risco |

## Rules

1. Classificar como Infrastructure/Chore ou Documentation quando couber.
2. Branch `chore/<issue>-<descricao>` (ou `docs/` se só docs).
3. Uma responsabilidade por PR.
4. Não esconder bugs como “maintenance”.
5. Dependências: validar build/testes do projeto.
6. Registrar dívida restante no Roadmap do projeto quando aplicável.
7. Completion Model padrão.

## Related Documents

- `standards/work-item-classification.md`
- `workflows/hotfix-workflow.md`
- `workflows/release-workflow.md`
- `standards/risk-management.md`
- `engine/aads-operating-model.md`
