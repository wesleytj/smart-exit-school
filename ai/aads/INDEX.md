# AADS Index

**Version:** 0.4.0  
**Status:** Active  
**Layer:** root

## Objective

Índice mestre do AllTech AI Development Standard. Ponto de entrada para humanos e IAs.

## Scope

Navegação e mapa de responsabilidades. Não define regras operacionais.

## Authority entrypoints

1. Limits: `constitution/constitution.md`
2. Conflicts: `engine/source-of-truth-map.md`
3. States (canonical): `engine/aads-operating-model.md`
4. Runtime orchestration: `engine/execution-engine.md`
5. Cursor Rules: `.cursor/rules/aads-*.mdc`
6. Multi-LLM packaging: `standards/llm-adapters.md`

## Layer stack

```text
Constitution
→ ADR
→ Engine (Operating Model + Runtime)
→ Standards
→ Workflows
→ Checklists
→ Templates
→ Prompts
→ LLM Adapters
```

## Document map

| Layer | Path | Role |
|---|---|---|
| Constitution | `constitution/` | Permanent principles |
| ADRs | `adr/` | Permanent AADS decisions |
| Engine | `engine/` | OM + Runtime (execution/decision/context/validation/delivery/protection) |
| Standards | `standards/` | Cross-cutting rules + compliance + LLM adapters |
| Workflows | `workflows/` | Work-type sequences |
| Checklists | `checklists/` | Validation gates |
| Templates | `templates/` | Artifact formats |
| Prompts | `prompts/` | Session packaging |
| LLM Adapters | `standards/llm-adapters.md` | Host-specific entry (Cursor, Claude, Copilot, …) |
| Tests | `tests/` | Cursor Rules validation |
| Reports | `reports/` | Historical audits (non-normative) |

## Runtime map

| Runtime | File |
|---|---|
| Execution cycle | `engine/execution-engine.md` |
| Classification tree | `engine/decision-engine.md` |
| Context matrix | `engine/context-loading.md` |
| Zero Trust Developer | `engine/developer-protection.md` |
| Validation matrix | `engine/validation-engine.md` |
| Delivery / completion SM | `engine/delivery-engine.md` |
| Failure recovery | `engine/ai-recovery-protocol.md` |

## Work type → Workflow

| Type | Workflow |
|---|---|
| Feature | `workflows/feature-workflow.md` |
| Bug Fix | `workflows/bugfix-workflow.md` |
| Hotfix | `workflows/hotfix-workflow.md` |
| Refactor | `workflows/refactor-workflow.md` |
| Research / Spike | `workflows/research-spike-workflow.md` |
| Release | `workflows/release-workflow.md` |
| Maintenance | `workflows/maintenance-workflow.md` |
| Recovery | `workflows/recovery-workflow.md` |
| Project entry | `workflows/project-bootstrap.md` |

## Completion Model (reminder)

Implementation Complete ≠ Delivery Complete ≠ Release Complete  
→ `engine/aads-operating-model.md` + `engine/delivery-engine.md`

## Related Documents

- `README.md`
- `DOCUMENT-STANDARD.md`
- `CHANGELOG.md`
- `engine/source-of-truth-map.md`
- `adr/adr-003.md`
- `reports/AADS-0.4.0-RUNTIME-REPORT.md`
