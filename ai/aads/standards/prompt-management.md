# Prompt Management

**Version:** 0.3.0  
**Status:** Active  
**Layer:** standards

## Objective

Ciclo de vida dos prompts AADS e de projeto (criar, atualizar, aposentar).

## Scope

`ai/aads/prompts/` e prompts de projeto.  
Prompts **não** são fonte de regras (Source of Truth Map Level 8).

## Rules

1. Prompts devem apontar para Engine/Constitution; não copiar checklists.
2. Novo prompt: objetivo, escopo, links canônicos, status Active/Deprecated.
3. Mudança estrutural de comportamento da IA → ADR AADS.
4. Prompt deprecated permanece com banner (como `ai-execution-protocol.md`).
5. Cursor Rules preferidas para comportamento persistente no Cursor; prompts para bootstrap multi-IA.
6. Revisar prompts quando Operating Model mudar materialmente.

## Lifecycle

```text
Draft → Active → Deprecated → (optional archive)
```

## Related Documents

- `prompts/bootstrap.md`
- `prompts/system-prompt.md`
- `engine/source-of-truth-map.md`
- `.cursor/rules/`
- `DOCUMENT-STANDARD.md`
