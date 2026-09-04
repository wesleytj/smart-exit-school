# AADS Document Standard

**Version:** 0.3.0  
**Status:** Active  
**Layer:** root

## Objective

Padronizar estrutura e linguagem de todos os documentos AADS.

## Scope

Aplica-se a novos documentos e a revisões materiais de documentos existentes.  
Não reescreve a Constitution.

## Responsibilities

| Role | Duty |
|---|---|
| Mantenedor AADS | Aplicar este padrão em mudanças |
| IA | Criar docs novos neste formato |

## Rules

### Required sections (normative docs)

1. Title (`#`)
2. Metadata: Version, Status, Layer
3. Objective
4. Scope
5. Responsibilities (when applicable)
6. Rules
7. Related Documents

### Language

- Imperative for agent behavior (“must”, “never”).
- Portuguese or English allowed; keep one language per document.
- Prefer Completion Model terms: Implementation / Delivery / Release Complete.
- Never equate “done” with Merge alone.

### Cross-references

- Use repo-relative paths from `ai/aads/` or project root (`ai/aads/...`).
- Point up to Engine/Constitution instead of copying rules.
- Historical reports live in `reports/` and are non-normative.

### Layers

`constitution` → `adr` → `engine` → `standards` → `workflows` → `checklists` → `templates` → `prompts`

## Related Documents

- `INDEX.md`
- `engine/source-of-truth-map.md`
- `README.md`
