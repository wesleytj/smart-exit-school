# Recovery Workflow

**Version:** 0.3.0  
**Status:** Active  
**Layer:** workflows

## Objective

Recuperar o projeto/processo após falha, incidente, entrega quebrada ou sessão de IA inconsistente.

## Scope

Incidentes de produto/processo e recuperação de execução da IA.  
Detalhe técnico de falha da IA: `engine/ai-recovery-protocol.md`.

## Responsibilities

| Role | Duty |
|---|---|
| Humano | Priorizar severidade e autorizar rollback |
| IA | Diagnosticar, propor plano, executar só o autorizado |

## Rules

1. Parar novas Features não relacionadas até estabilizar (salvo Hotfix autorizado).
2. Classificar severidade: bloqueante / alta / média.
3. Preferir rollback seguro a forward-fix arriscado quando Release estiver comprometido.
4. Seguir `engine/ai-recovery-protocol.md` se a falha for de processo/IA.
5. Abrir Issue de incidente + follow-up.
6. Documentar causa, correção, prevenção.
7. Só declarar Recovery Complete quando o sistema estiver estável e pendências críticas listadas/resolvidas.

## Sequence

```text
Detect failure
→ Contain
→ Diagnose
→ Choose rollback vs fix
→ Human approval if irreversible
→ Apply
→ Validate
→ Document + follow-up Issues
```

## Related Documents

- `engine/ai-recovery-protocol.md`
- `workflows/hotfix-workflow.md`
- `standards/risk-management.md`
- `workflows/release-workflow.md`
- `engine/aads-operating-model.md`
