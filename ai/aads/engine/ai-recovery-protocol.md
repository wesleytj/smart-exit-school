# AI Recovery Protocol

**Version:** 0.3.0  
**Status:** Active  
**Layer:** engine

## Objective

Recuperar execução da IA e o repositório após falha, contexto corrompido, entrega quebrada ou inconsistência de processo.

## Scope

Falhas de processo/IA e caminhos de rollback.  
Incidentes de produto: também `workflows/recovery-workflow.md`.

## Responsibilities

| Role | Duty |
|---|---|
| IA | Detectar, conter, reportar honestamente, propor recuperação |
| Humano | Autorizar rollback / ações irreversíveis |

## Rules

### Failure classes

| Class | Examples | First action |
|---|---|---|
| Context drift | IA inventou estado/docs | Re-bootstrap mínimo + corrigir claims |
| Validation failure | lint/build/tests | Voltar STATE 05/06; não declarar Implementation Complete |
| Delivery failure | push/PR/merge blocked | Manter Implementation Complete; listar Delivery pending |
| Bad merge/release | regressão em main/prod | Recovery/Hotfix + rollback path |
| Process violation | pulou gate | Parar; reportar; pedir human |

### Recovery steps

1. **Stop** mudanças não essenciais.
2. **State truth** — o que está realmente no git/working tree.
3. **Re-enter Operating Model** no estado correto (não fingir Completion).
4. **Contain** — reverter commits locais se necessário (com autorização se destrutivo).
5. **Fix or rollback** conforme risco (`standards/risk-management.md`).
6. **Document** causa e prevenção.
7. **Resume** só após Validation passar.

### Rollback

- Preferir reverter Delivery/Release a “consertar em cima” quando risco crítico.
- Nunca destruir histórico sem autorização.
- Evidenciar estado pós-rollback antes de declarar Recovery Complete.

### Never

- Esconder falha.
- Declarar Complete após recovery parcial.
- Continuar Feature não relacionada durante incidente crítico.

## Related Documents

- `engine/aads-operating-model.md`
- `workflows/recovery-workflow.md`
- `workflows/hotfix-workflow.md`
- `standards/risk-management.md`
- `standards/git-workflow.md`
- `checklists/ai-compliance-checklist.md`
