# LLM Adapters

**Version:** 0.4.0  
**Status:** Active  
**Layer:** standards (packaging / adapters)  
**Authority:** Lowest packaging layer — cannot invent AADS rules

## Objective

Tornar o AADS agnóstico de ferramenta: mesmo processo em qualquer IA.

## Scope

Como carregar AADS em cada host.  
Comportamento canônico: Engine Runtime + Operating Model.

## Responsibilities

| Role | Duty |
|---|---|
| Adapter (host) | Empacotar entrada (rules/prompts) |
| Engine | Executar processo AADS |

## Rules

### Universal bootstrap (any LLM)

1. `INDEX.md`
2. `constitution/constitution.md`
3. `engine/source-of-truth-map.md`
4. `engine/aads-operating-model.md`
5. `engine/execution-engine.md`
6. `engine/developer-protection.md`
7. Workflow do tipo (via Decision Engine)

### Host matrix

| Host | Adapter entry | Notes |
|---|---|---|
| **Cursor** | `.cursor/rules/aads-*.mdc` | alwaysApply core/workflow; validation/git contextual |
| **Codex / CLI agents** | `prompts/system-prompt.md` + `bootstrap.md` | Colar ou `@` files do Engine |
| **Claude Code** | CLAUDE.md ou project instructions → apontar INDEX + Engine Runtime | Evitar copiar checklists inteiros |
| **Copilot Agent** | Custom instructions / `.github` copilot instructions → INDEX + execution-engine | Respeitar permissões de PR |
| **Windsurf** | Cascade rules / memories → mesmos entrypoints | Preferir links a paste |
| **Cline** | Custom instructions + file refs | Carregar context-loading matrix |
| **OpenHands** | Agent config / microagents → AADS entrypoints | Isolar secrets |

### Differences (host constraints)

| Concern | Guidance |
|---|---|
| Persistência de rules | Cursor Rules > chat-only prompts |
| Tooling (git/shell) | Host-specific; Delivery Engine ainda exige evidência |
| Context window | Sempre Context Loading mínimo — nunca dump total |
| Autonomia de merge | Quase sempre Human Gate |

### Never

- Criar “AADS for X” com regras diferentes do Engine
- Duplicar Constitution dentro do adapter

## Related Documents

- `prompts/bootstrap.md`
- `prompts/system-prompt.md`
- `engine/execution-engine.md`
- `engine/context-loading.md`
- `.cursor/rules/`
- `INDEX.md`
