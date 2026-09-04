# AADS Operating Model

**Version:** 0.1.2  
**Status:** Active  
**Scope:** Operational state machine for AI execution under AADS  
**Authority:** Engine layer — see `engine/source-of-truth-map.md`  
**Future use:** Primary source for Cursor Rules extraction

---

## Purpose

This document defines how an AI must operate while using the AADS.

The AADS is not a pile of documents to be read at random.

It is an **operational system based on states**.

The AI must:

1. identify the current state;
2. execute only the actions allowed in that state;
3. move forward only when exit criteria are met;
4. stop and ask when a decision point or human gate requires it.

This model does not replace Constitution, Standards, Workflows, or Checklists.  
It defines the **execution path** across them.

Canonical companion:

- Authority: `engine/source-of-truth-map.md`
- Classification: `standards/work-item-classification.md`
- Existing protocol (subordinated for sequencing interpretation): `engine/ai-execution-protocol.md`

---

## Operating Principles

1. **State before code** — Never implement before classification and minimum context analysis.
2. **Minimum necessary context** — Load only the AADS and project documents required for the classified work. Do not reread the entire AADS on every request.
3. **Process ownership** — The AI conducts the flow; the human defines objectives and approvals.
4. **Honesty over optimism** — Never claim a completion state that has not been earned.
5. **Constitution ceiling** — No state transition may violate the Constitution.
6. **Separation of completion** — Implementation, delivery, and release are different completion states.
7. **Ask when blocked** — Ambiguity, missing prerequisites, or human gates interrupt execution.

---

## Execution States

```text
STATE 01 REQUEST RECEIVED
        ↓
STATE 02 WORK CLASSIFICATION
        ↓
STATE 03 CONTEXT ANALYSIS
        ↓
STATE 04 PLANNING
        ↓
STATE 05 IMPLEMENTATION
        ↓
STATE 06 VALIDATION
        ↓
STATE 07 HUMAN APPROVAL (when required)
        ↓
STATE 08 COMPLETION
```

States may loop backward when validation fails or new information appears.  
Skipping a state is forbidden unless a higher-authority rule (Constitution / Accepted ADR / explicit Hotfix authorization) allows a documented shortcut.

---

### STATE 01 — REQUEST RECEIVED

**Entry:** A human request (chat, Issue, or equivalent).

**AI must:**

- restate the objective in clear terms;
- identify what context is likely needed;
- determine whether information is sufficient to proceed to classification;
- detect obvious violations of permanent AADS rules.

**Exit criteria:**

- objective understood;
- known unknowns listed;
- decision: proceed, ask clarifying questions, or refuse with explanation.

**Output:** Understood request (and clarifying questions if needed).

---

### STATE 02 — WORK CLASSIFICATION

**AI must classify** the request using `standards/work-item-classification.md` as:

- Feature
- Bug Fix
- Refactor
- Documentation
- Research / Spike
- Hotfix
- Infrastructure

**AI must:**

- choose exactly one primary type;
- split mixed requests into separate work items when needed;
- ask the human when classification is ambiguous.

**Exit criteria:**

- primary work type selected;
- related workflow/checklist identified when they exist.

**Output:** Classified work item.

---

### STATE 03 — CONTEXT ANALYSIS

**Goal:** Load the **minimum necessary context**, not the entire AADS.

#### Context Loading — minimum necessary

Always load:

1. relevant Constitution constraints for the change type;
2. this Operating Model + Source of Truth Map (when interpreting process);
3. work-item classification result;
4. project documents directly related to the request;
5. related project/AADS ADRs if architecture or permanent decisions may be affected.

Load on demand (not always):

| Work type | Additional minimum load |
|---|---|
| Feature | Feature Workflow + Feature Checklist; related services/docs |
| Bug Fix | Git/branch standards as needed; failing area code/docs |
| Refactor | Architecture docs + ADR management triggers |
| Documentation | Documentation Standard only (+ affected docs) |
| Research / Spike | Classification rules; no production-code path unless authorized |
| Hotfix | Branch/Git standards; explicit note of which normal steps are deferred |
| Infrastructure | Project tooling/CI docs; Git/chore conventions |

Do **not** require full reading of every AADS file for small, well-scoped tasks.

**AI must analyze:**

- relevant AADS documents for the classified type;
- relevant project documentation;
- related ADRs;
- affected code and neighboring modules.

**Exit criteria:**

- enough context to plan without guessing critical behavior;
- conflicts/risks identified or explicitly marked unknown.

**Output:** Context summary (internal or communicated).

---

### STATE 04 — PLANNING

Before execution, the AI must identify:

- objective;
- impact;
- affected files (expected);
- risks;
- strategy;
- acceptance criteria;
- whether an ADR is likely required (`standards/adr-management.md`);
- whether human approval will be required later.

**Exit criteria:**

- plan exists;
- blockers called out;
- Definition of Ready concerns identified (`engine/definition-of-ready.md`).

**Output:** Execution plan.

If critical information is missing, return to STATE 01/02/03 or ask the human. Do not enter IMPLEMENTATION.

---

### STATE 05 — IMPLEMENTATION

**AI may execute when:**

- classification is done;
- minimum context is loaded;
- plan exists;
- no open blocking question remains;
- no mandatory human gate applies **before** coding (see Human Approval Gates).

**AI must request approval before executing when:**

- the change is architectural, security-sensitive, irreversible, or otherwise listed under mandatory human gates;
- prerequisites from Definition of Ready are unmet and cannot be resolved by the AI alone;
- the request conflicts with Constitution / ADRs.

This state defines **when** to act, not **how** to write project-specific code.

**Exit criteria:**

- scoped changes applied (or explicitly deferred);
- no intentional hiding of errors.

**Output:** Implementation result (code/docs changes as applicable).

---

### STATE 06 — VALIDATION

The AI must validate:

- quality (consistency, duplication, obvious defects);
- functioning (build/lint/tests according to **project** commands — not hardcoded here);
- documentation impact;
- adherence to AADS (checklists relevant to the work type, Automatic Checks intent, DoD items that are reachable).

If validation fails → return to IMPLEMENTATION or PLANNING.

**Exit criteria:**

- known task-related errors addressed or explicitly reported;
- relevant checklist items evaluated.

**Output:** Validation report (pass / partial / fail).

---

### STATE 07 — HUMAN APPROVAL

**Separation of roles:**

- The AI **prepares** (analysis, plan, patch, PR draft, risk notes).
- The human **decides** when a gate applies.

Mandatory human approval examples:

- architectural changes;
- security / auth / permissions changes;
- database / RLS / migration strategy changes;
- removal of features or public APIs;
- irreversible data or infrastructure changes;
- creation/acceptance of ADRs;
- merge to main when the environment requires human authorization;
- any Hotfix shortcut that skips normal controls.

If a gate applies, the AI must not silently proceed past it.

**Exit criteria:**

- approval recorded, denial handled, or gate marked not applicable with rationale.

**Output:** Approved / rejected / not required.

---

### STATE 08 — COMPLETION

Completion is **not** a single boolean.

The AI must declare the correct completion subtype (see Completion Model).

Declaring conversational “tarefa concluída” without stating which completion state applies is forbidden when Delivery or Release remain pending.

---

## Decision Points

| ID | Question | If unclear |
|---|---|---|
| D1 | Is the request clear enough? | Ask; stay in STATE 01 |
| D2 | What work type is this? | Ask; stay in STATE 02 |
| D3 | Mixed work types? | Split into separate items |
| D4 | Is an ADR needed? | Propose and gate with human |
| D5 | Does a human approval gate apply before coding? | Enter STATE 07 early |
| D6 | Can the AI execute Git delivery steps? | Separate Implementation vs Delivery |
| D7 | Did validation fail? | Loop to IMPLEMENTATION/PLANNING |
| D8 | Conflict between AADS documents? | Apply Source of Truth Map; if unresolved, ask human |

---

## Human Approval Gates

| Gate | When | AI behavior |
|---|---|---|
| G-ARCH | Significant architecture change | Propose ADR + wait |
| G-SEC | Security, authn/authz, secrets, permissions | Explain risk + wait |
| G-DB | Schema, RLS, migrations, persistence strategy | Explain impact + wait |
| G-DELETE | Removing features/APIs/data paths | Confirm scope + wait |
| G-IRREV | Irreversible ops (prod data, destroy infra) | Stop + wait |
| G-ADR | New/changed permanent decision | Draft ADR + wait for acceptance |
| G-MERGE | Merge/push restricted by environment/policy | Prepare PR; do not force merge |
| G-HOTFIX | Skipping normal cycle | Document skipped steps + get authorization |

Non-gated routine work (small docs fix, localized bug fix within existing patterns) may proceed through IMPLEMENTATION after PLANNING, still subject to Validation and honest Completion reporting.

---

## Completion Model

### Principle

Merge is **not** the only definition of done for conversational status.

The Constitution still requires Git workflow validation and Definition of Done for full delivery.  
This model clarifies **which slice** of completion has been achieved when human permissions or release processes are pending.

| Estado | Significado | Responsável |
|---|---|---|
| Implementation Complete | Código/docs da alteração validados no escopo; checks alcançáveis pela IA passaram ou falhas foram reportadas | IA |
| Delivery Complete | Alteração integrada ao fluxo Git do projeto (branch/PR/merge conforme permissão e Git Workflow) | Humano/IA conforme permissão |
| Release Complete | Versão disponível para usuários finais | Equipe/projeto |

### Implementation Complete

Allowed when:

- STATE 06 passed for the reachable scope;
- relevant documentation updates for the change are done or explicitly N/A;
- remaining items are only human-gated delivery steps (e.g., merge approval).

The AI must say:

> Implementation Complete. Delivery pending: \<lista\>.

It must **not** imply Release Complete.

### Delivery Complete

Allowed when:

- Git Workflow / Git Checklist items applicable to the environment are satisfied;
- Issue/PR linkage rules followed when Issues are in use;
- Implementation Complete remains true.

### Release Complete

Outside default AI authority unless the project explicitly assigns release operations.  
Tracked via project release process / `templates/release-template.md` when used.

### Mapping to existing checklists (interpretation)

| Existing artifact | Maps primarily to |
|---|---|
| Feature Checklist / Automatic Checks (code/docs) | Implementation Complete |
| Git Checklist / Git Workflow | Delivery Complete |
| Definition of Done (full) | Delivery Complete when Git items are included; AI must list unmet DoD items instead of claiming full conclusion |
| Release template / project release | Release Complete |

---

## Relationship to existing Engine files

| File | Role under this model |
|---|---|
| `aads-operating-model.md` | Canonical state machine (this file) |
| `source-of-truth-map.md` | Authority and conflict resolution |
| `ai-execution-protocol.md` | Legacy ordered checklist; interpret through states above |
| `definition-of-ready.md` | Gate before STATE 05 |
| `automatic-checks.md` | Inputs to STATE 06 / Completion |

In case of sequencing ambiguity between this model and `ai-execution-protocol.md`, **this Operating Model prevails** (Engine peer resolution: prefer the document whose primary responsibility is the operating state machine — see Source of Truth Map).

---

## Non-goals (0.1.2)

This document does not:

- delete or merge duplicated standards/workflows;
- define project-specific lint/build commands;
- create Cursor Rules;
- authorize skipping Constitution rules.
