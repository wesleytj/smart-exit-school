# Risk Management

**Version:** 0.3.0  
**Status:** Active  
**Layer:** standards

## Objective

Identificar, classificar e tratar riscos sem duplicar Human Approval Gates do Engine.

## Scope

Riscos de produto, processo e entrega.  
Gates canônicos: `engine/aads-operating-model.md`.

## Rules

### Severity

| Level | Meaning | Default action |
|---|---|---|
| Critical | Produção/segurança/dados | Stop + human + possible Hotfix/Recovery |
| High | Regressão ampla / auth / DB | Human Approval before implement |
| Medium | Impacto local relevante | Plan + validate carefully |
| Low | Cosmético / docs | Proceed with normal flow |

### Process

1. Listar riscos no PLANNING (STATE 04).
2. Mapear para gates G-* quando aplicável.
3. Definir mitigação ou aceite humano.
4. Rollback path para Releases (`workflows/release-workflow.md`).
5. Nunca ocultar risco conhecido (Constitution Art. 5).

## Related Documents

- `engine/aads-operating-model.md`
- `workflows/recovery-workflow.md`
- `workflows/hotfix-workflow.md`
- `engine/ai-recovery-protocol.md`
- `standards/testing-standard.md`
