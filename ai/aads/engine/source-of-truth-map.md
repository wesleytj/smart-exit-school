# AADS Source of Truth Map

**Version:** 0.4.0  
**Status:** Active  
**Scope:** Governance layer for AADS authority and conflict resolution

---

## Purpose

This document defines the official authority hierarchy of the AllTech AI Development Standard (AADS).

It answers:

> When two AADS documents conflict, which document prevails?

It also defines the responsibility of each documentary layer so agents and humans know where to look for each kind of rule.

This map does not replace existing standards, workflows, checklists, or templates.  
It governs how they must be interpreted together.

---

## Authority Hierarchy

### Decision recorded

The hierarchy below extends the order already expressed in `prompts/bootstrap.md` (Constitution → AADS ADRs → Standards → Checklists) by inserting the Engine as the operational interpreter and placing Workflows, Templates, and Prompts explicitly.

**Rationale:**

- The Constitution remains the permanent ceiling (Constitution Art. 16 and bootstrap priority).
- AADS ADRs record permanent structural decisions about the standard itself and sit immediately below the Constitution.
- The Engine defines how an AI executes the AADS as a state machine. When lower documents overlap or use ambiguous words such as “concluído”, the Engine’s operating model prevails for **operational interpretation**, without canceling Constitution principles.
- Standards remain the general development rules.
- Workflows apply those rules by work type.
- Checklists validate completion criteria.
- Templates only define artifact shape.
- Prompts are packaging for agents; they must not invent rules that contradict higher layers.

```text
Level 1 — Constitution
Level 2 — AADS ADRs
Level 3 — Engine (Operating Model + Runtime)
Level 4 — Standards
Level 5 — Workflows
Level 6 — Checklists
Level 7 — Templates
Level 8 — Prompts
Level 9 — LLM Adapters
```

### Level 1 — Constitution

**Location:** `constitution/`

**Responsibility:**  
Permanent principles and hard limits for AI-assisted development.

**Prevails over:** all other AADS layers.

**Cannot be overridden by:** Engine, Standards, Workflows, Checklists, Templates, Prompts, or user requests that violate permanent rules.

---

### Level 2 — AADS ADRs

**Location:** `adr/`

**Responsibility:**  
Permanent architectural or structural decisions about the AADS itself.

**Prevails over:** Engine, Standards, Workflows, Checklists, Templates, Prompts.

**Cannot override:** Constitution.

**Note:** Project ADRs live outside this hierarchy (in the project). They govern project architecture, not AADS process authority.

---

### Level 3 — Engine

**Location:** `engine/`

**Responsibility:**  
Operational model + **Runtime**: states, decision points, human approval gates, completion semantics, Definition of Ready, automatic checks, execution/decision/context/validation/delivery engines, developer protection, recovery, and this Source of Truth Map.

**Prevails over:** Standards, Workflows, Checklists, Templates, Prompts, LLM Adapters — **only** for operational interpretation and sequencing.

**Cannot override:** Constitution or Accepted AADS ADRs.

**Canonical state machine:** `engine/aads-operating-model.md`  
**Runtime orchestration:** `engine/execution-engine.md` (must map to Operating Model; cannot invent competing states)

---

### Level 4 — Standards

**Location:** `standards/`

**Responsibility:**  
General development rules (Git, documentation, ADR management, classification, code review, task lifecycle, branch strategy, development workflow).

**Prevails over:** Workflows, Checklists, Templates, Prompts.

**Cannot override:** Constitution, AADS ADRs, or Engine operational semantics.

---

### Level 5 — Workflows

**Location:** `workflows/`

**Responsibility:**  
Practical application of standards for specific work situations (for example Feature, project bootstrap).

**Prevails over:** Checklists and Templates when describing sequence for that work type.

**Cannot override:** higher layers.

---

### Level 6 — Checklists

**Location:** `checklists/`

**Responsibility:**  
Validation gates and completion criteria (Definition of Done, Feature Checklist, Git Checklist).

**Prevails over:** Templates for “what must be verified”.

**Cannot invent** new process that contradicts Standards/Engine; they operationalize them.

---

### Level 7 — Templates

**Location:** `templates/`

**Responsibility:**  
Format of artifacts (Issue, PR, ADR, commit, feature, release).

**Prevails over:** nothing above.  
If a template field conflicts with a Standard, the Standard wins.

---

### Level 8 — Prompts

**Location:** `prompts/`

**Responsibility:**  
Agent packaging and session bootstrap text.

**Prevails over:** LLM Adapters only as shared prompt text.  
Prompts must point agents to higher layers; they do not create competing rules.

---

### Level 9 — LLM Adapters

**Location:** `standards/llm-adapters.md` (+ host files such as `.cursor/rules/`)

**Responsibility:**  
Host-specific packaging (Cursor, Claude Code, Copilot, Codex, Windsurf, Cline, OpenHands, …).

**Authority:** lowest.  
Adapters only point to Engine/Runtime; they must not invent AADS rules per host.

---

## Document Responsibilities

| Concern | Canonical source | Supporting sources |
|---|---|---|
| Permanent AI/development principles | `constitution/constitution.md` | `constitution/ai-operating-rules.md`, `constitution/ai-responsibilities.md` |
| AADS structural decisions | `adr/` | CHANGELOG |
| How the AI executes (states, gates, completion) | `engine/aads-operating-model.md` | `engine/execution-engine.md`, runtime engines, `definition-of-ready.md`, `automatic-checks.md` |
| Runtime orchestration / checkpoints | `engine/execution-engine.md` | decision/context/validation/delivery engines |
| Zero Trust Developer | `engine/developer-protection.md` | `constitution/ai-operating-rules.md` |
| Multi-LLM packaging | `standards/llm-adapters.md` | `prompts/`, `.cursor/rules/` |
| Compliance adoption level | `standards/compliance-levels.md` | `checklists/ai-compliance-checklist.md` |
| Authority / conflict resolution | `engine/source-of-truth-map.md` | — |
| Work item classification | `standards/work-item-classification.md` | `engine/definition-of-ready.md` |
| Git / branch / PR rules | `standards/git-workflow.md`, `standards/branch-strategy.md` | `checklists/git-checklist.md` |
| Documentation rules | `standards/documentation-standard.md` | project `docs/` |
| ADR creation rules | `standards/adr-management.md` | `templates/adr-template.md` |
| Feature sequence | `workflows/feature-workflow.md` | `checklists/feature-checklist.md` |
| Bug / Hotfix / Research / Refactor / Release / Maintenance / Recovery | `workflows/*-workflow.md` | matching checklists |
| Task done criteria | `checklists/definition-of-done.md` | Engine Completion Model (interpretation) |
| Quality gates map | `standards/quality-gates.md` | `engine/automatic-checks.md`, testing-standard |
| Versioning (projects) | `standards/versioning-standard.md` | release workflow/template |
| AI failure / rollback | `engine/ai-recovery-protocol.md` | `workflows/recovery-workflow.md` |
| Compliance audit (ongoing) | `checklists/ai-compliance-checklist.md` | `reports/` (historical only) |
| Navigation index | `INDEX.md` | `DOCUMENT-STANDARD.md` |
| Artifact shape | `templates/` | — |
| Session bootstrap text | `prompts/` | Engine + this map |

### Overlap note (not resolved by deletion in 0.1.2)

Multiple documents currently describe similar cycles (`development-workflow`, `task-lifecycle`, `feature-workflow`, `ai-execution-protocol`, `bootstrap`).

Until a later consolidation phase:

1. Use **Engine Operating Model** for execution states.
2. Use the **most specific Workflow** for the classified work type when one exists.
3. Use **Standards** for domain rules (Git, docs, ADR, review).
4. Do not treat Prompts as a competing process definition.

---

## Conflict Resolution Rules

When two AADS statements conflict, resolve in this order:

1. **Apply Authority Hierarchy** (Level 1 wins over Level 2, and so on).
2. **Prefer the more specific document** only when both documents are at the **same** level (example: Feature Workflow over a generic development standard for Feature sequencing).
3. **Prefer “must / never” imperative rules** over aspirational language when both remain after steps 1–2.
4. **Prefer the Source of Truth Map + Operating Model** for ambiguous terms such as “concluído”, “finalizado”, or “pronto”.
5. **If still unresolved:** stop implementation, report the conflict, and request human decision. Do not invent a silent compromise that hides the conflict (Constitution Art. 5).

### Special cases

| Situation | Rule |
|---|---|
| User request vs Constitution | Constitution wins; explain and refuse or renegotiate |
| User request vs project ADR | Project ADR wins for project architecture; explain impact |
| Project docs vs AADS process | AADS governs **how to work**; project docs govern **what the product is** |
| Checklist vs Standard | Standard defines the rule; Checklist verifies it |
| Template vs Standard | Standard wins; update template in a later change if needed |
| Prompt vs Engine | Engine wins |
| Adapter vs Engine | Engine wins |
| Two Standards overlap | Prefer the Standard whose primary responsibility matches the concern (see Document Responsibilities) |
| “Task complete” vs pending Merge permission | Use Completion Model: `Implementation Complete` allowed; do not claim `Delivery Complete` |

---

## Document Relationship Map

| Camada | Pasta | Responsabilidade | Consumidor |
|---|---|---|---|
| Constitution | `constitution/` | Princípios permanentes e limites da IA | Todos os agentes e humanos |
| AADS ADRs | `adr/` | Decisões estruturais permanentes do AADS | Mantenedores AADS + agentes |
| Engine | `engine/` | OM + Runtime (estados, gates, execução, proteção) | Agentes (entrada operacional principal) |
| Standards | `standards/` | Regras gerais + compliance + LLM adapters | Agentes + humanos |
| Workflows | `workflows/` | Aplicação prática por situação de trabalho | Agentes em tarefas classificadas |
| Checklists | `checklists/` | Validação e critérios de conclusão | Agentes no encerramento |
| Templates | `templates/` | Formato dos artefatos | Humanos + agentes ao criar artefatos |
| Prompts | `prompts/` | Empacotamento de sessão / bootstrap textual | Agentes no início de sessão |
| LLM Adapters | `standards/llm-adapters.md` + host rules | Packaging por ferramenta | Agentes no host específico |

### Relationship diagram

```text
Constitution
    ↓ constrains
AADS ADRs
    ↓ specialize AADS structure
Engine (operating model + runtime + this map)
    ↓ interprets & sequences
Standards
    ↓ specialized by
Workflows ──→ Checklists
    ↓ shape artifacts
Templates
    ↓ packaged by
Prompts
    ↓ adapted by
LLM Adapters (Cursor / Claude / Copilot / …)
```

### External layers (outside AADS, lower than AADS process authority for process questions)

| Camada | Local típico | Responsabilidade |
|---|---|---|
| Project AI context | `ai/` | Regras e contexto específicos do projeto |
| Project docs / ADRs | `docs/`, project ADRs | Produto, arquitetura e domínio |
| User request | conversa / Issue | Objetivo da tarefa (não pode violar Constitution) |

---

## Maintenance

- Any change to this hierarchy requires an AADS ADR (Constitution Art. 16).
- This file is part of the Engine layer and is itself authoritative for conflict resolution.
- Existing duplicated process documents are not deleted in 0.1.2; they are subordinated by this map.
