# Delivery Engine

**Version:** 0.4.0  
**Status:** Active  
**Layer:** engine (runtime)  
**Authority:** Specializes Completion Model — does not replace it

## Objective

Definir o que significa entrega e a máquina de estados de completion.

## Scope

Critérios PASS por dimensão e transições Implementation → Delivery → Release.

## Responsibilities

| Role | Duty |
|---|---|
| IA | Avaliar dimensões; declarar estado honesto |
| Humano | Autorizar merge/publish quando gated |

## Rules

### Delivery dimensions (PASS required for full close)

| Dimension | PASS means |
|---|---|
| Code | Escopo implementado; sem TODO/FIXME da tarefa |
| Build | Build/lint/testes aplicáveis OK (projeto) |
| Docs | Docs impactadas atualizadas ou N/A |
| Checklist | Checklists do tipo aprovados no alcance |
| Git | Branch/commits conforme Git Workflow (readiness) |
| Issue | Escopo resolvido; linkage quando houver Issue |
| PR | PR conforme fluxo; `Closes #N` quando aplicável |
| Merge | Merge autorizado realizado (Delivery) |
| Release | Publish evidenciado (Release) |

### Completion State Machine

```text
[Working]
   │ Validation Engine PASS (quality+docs)
   ▼
Implementation Complete
   │ Git Delivery PASS (PR/merge/issue as applicable)
   ▼
Delivery Complete
   │ Release Workflow PASS (when releasing)
   ▼
Release Complete
```

### Interpretation

Uma tarefa **não** “termina” conversacionalmente com um único “Done.”

| Claim | Requires PASS |
|---|---|
| Implementation Complete | Code + Build + Docs + Checklist (impl) |
| Delivery Complete | + Git + Issue + PR (+ Merge when required/authorized) |
| Release Complete | + Release checklist / publish evidence |

Se Merge estiver bloqueado por permissão humana:

- Implementation Complete **permitido**
- Delivery Complete **proibido**
- Listar Delivery pending

### Never

- Afirmar Delivery/Release sem evidência
- Equacionar Merge = único done
- Ignorar Developer Protection checks

## Related Documents

- `engine/aads-operating-model.md` (Completion Model)
- `engine/validation-engine.md`
- `engine/developer-protection.md`
- `standards/git-workflow.md`
- `checklists/git-checklist.md`
- `workflows/release-workflow.md`
