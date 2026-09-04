# Context Loading

**Version:** 0.4.0  
**Status:** Active  
**Layer:** engine (runtime)  
**Authority:** Specializes Operating Model STATE 03 — does not replace it

## Objective

Definir como a IA escolhe documentos (contexto mínimo necessário).

## Scope

Matriz Tipo → documentos obrigatórios + sob demanda.  
Projeto: sempre incluir `ai/` relevante ao pedido.

## Responsibilities

| Role | Duty |
|---|---|
| IA | Carregar só o necessário; expandir se risco/ambiguidade |
| Humano | Fornecer links/Issues quando pedidos |

## Rules

### Always (any type)

1. `constitution/constitution.md` (limites aplicáveis)
2. `engine/source-of-truth-map.md` (se houver conflito/processo)
3. `engine/aads-operating-model.md` (estados/completion)
4. `engine/developer-protection.md` (zero-trust checks)
5. `engine/decision-engine.md` result (tipo + workflow)
6. Projeto: `ai/ai-context.md` / `coding-rules.md` / `forbidden-actions.md` conforme relevância

### Matrix — Tipo → documentos obrigatórios

| Type | Mandatory AADS docs |
|---|---|
| Feature | Operating Model, Feature Workflow, Feature Checklist, Git Workflow, DoD, Documentation Standard |
| Bug Fix | Bugfix Workflow, Testing Standard, Git Workflow, DoD |
| Hotfix | Hotfix Workflow, Hotfix Checklist, Risk Management, Git Workflow, Recovery Protocol (if incident) |
| Refactor | Refactor Workflow, Architecture Definition, Testing Standard, Code Review, DoD |
| Research / Spike | Research-Spike Workflow, Research Template, ADR Management (if decision) |
| Release | Release Workflow, Release Checklist, Versioning Standard, Risk Management |
| Maintenance | Maintenance Workflow, Git Workflow, Testing Standard |
| Recovery | Recovery Workflow, AI Recovery Protocol, Risk Management, Hotfix Workflow (if prod) |
| Documentation | Documentation Standard, Git `docs/` conventions |
| Infrastructure | Maintenance Workflow, Project Structure, Git Workflow |

### On-demand (load if triggered)

| Trigger | Load |
|---|---|
| Arquitetura / nova fronteira | Architecture Definition, ADR Management |
| Auth / secrets / RLS | ADRs projeto + G-SEC |
| DB / migrations | ADRs projeto + G-DB |
| Entrega Git pedida | Delivery Engine, Git Checklist |
| Falha de processo | AI Recovery Protocol |

### Never

- Ler todo `ai/aads/` por padrão
- Ignorar Constitution em mudanças sensíveis
- Começar código antes da matriz do tipo

## Related Documents

- `engine/aads-operating-model.md`
- `engine/execution-engine.md`
- `engine/decision-engine.md`
- `workflows/project-bootstrap.md`
- `INDEX.md`
