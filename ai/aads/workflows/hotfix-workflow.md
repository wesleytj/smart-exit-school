# Hotfix Workflow

**Version:** 0.3.0  
**Status:** Active  
**Layer:** workflows

## Objective

Corrigir falha crítica com atalho controlado do ciclo normal, sem abandonar rastreabilidade.

## Scope

Somente quando: sistema quebrado, produção indisponível, ou falha crítica autorizada.  
Gate: `G-HOTFIX` em `engine/aads-operating-model.md`.

## Responsibilities

| Role | Duty |
|---|---|
| Humano | Autorizar o atalho Hotfix |
| IA | Executar mínimo seguro, documentar passos pulados, completar follow-up |

## Rules

### Pode ser acelerado (com autorização)

- Planejamento extenso / múltiplas Issues
- Research formal
- Refactors colaterais

### Nunca pode ser pulado

- Identificação do problema e impacto
- Correção mínima focada
- Validação técnica alcançável
- Branch `hotfix/<issue>-<descricao>`
- Registro do que foi pulado
- Documentação pós-correção (obrigatória após merge)
- Human Approval para ações irreversíveis

### Sequência

1. Autorização humana explícita (G-HOTFIX).
2. Branch hotfix + fix mínimo.
3. Validação de emergência.
4. Delivery (PR/merge conforme permissão).
5. **Follow-up obrigatório:** docs, ADR se necessário, Issue de hardening, checklist hotfix.

### Completion

- Implementation Complete: fix validado no alcance possível.
- Delivery Complete: integrado via Git.
- Release Complete: deploy/publicação conforme projeto (fora do padrão AADS genérico).

## Related Documents

- `checklists/hotfix-checklist.md`
- `standards/work-item-classification.md`
- `standards/branch-strategy.md`
- `standards/git-workflow.md`
- `engine/aads-operating-model.md`
- `engine/ai-recovery-protocol.md`
