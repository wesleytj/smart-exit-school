# Execution Engine

**Version:** 0.4.0  
**Status:** Active  
**Layer:** engine (runtime)  
**Authority:** Subordinate to `engine/aads-operating-model.md`

## Objective

Definir o ciclo de execução da IA como runtime operacional.  
Não substitui o Operating Model — **orquestra** seus estados.

## Scope

Ordem obrigatória, transições e checkpoints de runtime.  
Detalhe de classificação, contexto, validação e delivery: engines irmãos.

## Responsibilities

| Role | Duty |
|---|---|
| IA | Percorrer o ciclo; parar em checkpoints falhos |
| Humano | Objetivos e Human Approval Gates |

## Rules

### Canonical mapping (Runtime → Operating Model)

| Runtime stage | OM State |
|---|---|
| Request | STATE 01 |
| Classification | STATE 02 |
| Context Loading | STATE 03 |
| Planning | STATE 04 |
| Implementation | STATE 05 |
| Validation | STATE 06 |
| Documentation | STATE 06 (docs impact) + DoD docs |
| Git | Delivery path (Git Workflow) |
| Delivery | Delivery Complete criteria |
| Completion | STATE 08 |

Human Approval (STATE 07) pode ocorrer antes de Implementation ou antes de Delivery.

### Ciclo obrigatório

```text
Request
→ Classification
→ Context Loading
→ Planning
→ Implementation
→ Validation
→ Documentation
→ Git
→ Delivery
→ Completion
```

Loops permitidos: Validation/Documentation → Implementation; Git/Delivery → Planning (se escopo errado).

### Checkpoints (must pass to advance)

| CP | After | Fail action |
|---|---|---|
| CP-REQ | Request | Ask clarifying questions |
| CP-CLASS | Classification | Ask / split mixed work |
| CP-CTX | Context Loading | Load missing docs; do not code |
| CP-PLAN | Planning | Block Implementation |
| CP-IMPL | Implementation | Return to plan/fix |
| CP-VAL | Validation | Return to Implementation |
| CP-DOC | Documentation | Update or justify N/A |
| CP-GIT | Git readiness | Fix branch/commits |
| CP-DEL | Delivery | List human blockers; no false Delivery Complete |
| CP-DONE | Completion | Declare correct Completion subtype only |

### Never

- Pular Classification ou Context Loading
- Implementar sem CP-PLAN em mudanças não triviais
- Declarar Completion sem CP-VAL
- Tratar este arquivo como autoridade acima do Operating Model

## Related Documents

- `engine/aads-operating-model.md` (canonical states)
- `engine/decision-engine.md`
- `engine/context-loading.md`
- `engine/validation-engine.md`
- `engine/delivery-engine.md`
- `engine/developer-protection.md`
- `engine/source-of-truth-map.md`
