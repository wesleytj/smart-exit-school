# Decision Engine

**Version:** 0.4.0  
**Status:** Active  
**Layer:** engine (runtime)  
**Authority:** Uses `standards/work-item-classification.md`; subordinate to Operating Model STATE 02

## Objective

Definir como a IA classifica e roteia trabalho para o workflow correto.

## Scope

Árvore de decisão de tipo de trabalho.  
Não redefine tipos — apenas operacionaliza a classificação.

## Responsibilities

| Role | Duty |
|---|---|
| IA | Classificar; perguntar se ambíguo; separar trabalhos mistos |
| Humano | Confirmar tipo quando solicitado |

## Rules

### Decision tree

```text
Request received
│
├─ Produção quebrada / indisponível / crítico autorizado?
│   └─ YES → Hotfix → workflows/hotfix-workflow.md
│
├─ Investigar / comparar / prototipar sem entregar produto?
│   ├─ Só análise → Research → research-spike-workflow.md
│   └─ Experimento código descartável → Spike → research-spike-workflow.md
│
├─ Publicar versão / tag / release notes?
│   └─ YES → Release → release-workflow.md
│
├─ Incidente / rollback / sessão inconsistente?
│   └─ YES → Recovery → recovery-workflow.md
│
├─ Corrigir comportamento incorreto existente?
│   └─ YES → Bug Fix → bugfix-workflow.md
│
├─ Melhorar estrutura SEM mudar comportamento externo?
│   └─ YES → Refactor → refactor-workflow.md
│
├─ Só documentação?
│   └─ YES → Documentation → documentation-standard + branch docs/
│
├─ CI / deps / tooling / higiene contínua?
│   └─ YES → Infrastructure / Maintenance → maintenance-workflow.md
│
└─ Nova capacidade / comportamento novo?
    └─ YES → Feature → feature-workflow.md
```

### Ambiguity

1. Se dois tipos couberem → perguntar ou separar Issues.
2. Feature + Refactor no mesmo pedido → dois work items.
3. Bug em produção crítica → Hotfix somente com autorização G-HOTFIX.

### Output of this engine

- Tipo primário
- Workflow path
- Gates humanos prováveis (G-ARCH / G-SEC / G-DB / G-HOTFIX / …)

## Related Documents

- `standards/work-item-classification.md`
- `engine/aads-operating-model.md`
- `engine/execution-engine.md`
- `engine/context-loading.md`
- `INDEX.md`
