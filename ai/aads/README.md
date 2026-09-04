# AADS — AllTech AI Development Standard

> Padrão de desenvolvimento assistido por Inteligência Artificial da AllTech Solutions.

**Version:** 0.4.0  
**Status:** AI Execution Framework (pré-1.0) — Cursor Rules ACTIVE FOR VALIDATION

---

## Objective

Garantir comportamento de IA **reproduzível, previsível e auditável** em qualquer host (Cursor, Claude, Copilot, Codex, Windsurf, …).

O AADS evoluiu de documentação → framework → **runtime de execução**.  
Cada projeto mantém arquitetura e regras de negócio próprias.

## Start here

1. `INDEX.md` — mapa completo  
2. `constitution/constitution.md` — limites  
3. `engine/source-of-truth-map.md` — autoridade  
4. `engine/aads-operating-model.md` — estados canônicos  
5. `engine/execution-engine.md` — orquestração runtime  
6. `engine/developer-protection.md` — Zero Trust Developer  
7. Adapter: `.cursor/rules/` **ou** `standards/llm-adapters.md`

## Principles

- Arquitetura antes da implementação
- Documentação faz parte do desenvolvimento
- Git obrigatório / rastreabilidade
- Zero Trust Developer (IA nunca assume memória humana)
- Implementation Complete ≠ Delivery Complete ≠ Release Complete
- Qualidade acima de velocidade

## Layer stack

```text
Constitution → ADR → Engine → Standards → Workflows
→ Checklists → Templates → Prompts → LLM Adapters
```

## Structure

```text
ai/aads/
├── INDEX.md
├── DOCUMENT-STANDARD.md
├── README.md
├── CHANGELOG.md
├── adr/
├── constitution/
├── engine/          # Operating Model + Runtime Engines
├── standards/       # includes llm-adapters, compliance-levels
├── workflows/
├── checklists/
├── templates/
├── prompts/
├── tests/
└── reports/
```

## Multi-IA usage

| Tool | Entry |
|---|---|
| Cursor | `.cursor/rules/aads-*.mdc` + Execution Engine |
| Any other LLM | `standards/llm-adapters.md` + `prompts/bootstrap.md` |
| Universal | INDEX → Constitution → SoT → Operating Model → Execution Engine |

## Versioning

AADS: este `CHANGELOG.md`.  
Projetos: `standards/versioning-standard.md`.  
Compliance alvo: `standards/compliance-levels.md`.

## Related Documents

- `INDEX.md`
- `adr/adr-003.md`
- `engine/execution-engine.md`
- `standards/llm-adapters.md`
- `reports/AADS-0.4.0-RUNTIME-REPORT.md`
