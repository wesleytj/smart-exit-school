# Validation Engine

**Version:** 0.4.0  
**Status:** Active  
**Layer:** engine (runtime)  
**Authority:** Specializes STATE 06 + Automatic Checks; no stack-specific commands

## Objective

Definir como a IA valida trabalho antes de avançar Completion.

## Scope

Validation Matrix. Comandos concretos = projeto.

## Responsibilities

| Role | Duty |
|---|---|
| IA | Executar/checar itens aplicáveis; reportar falhas |
| Projeto | Definir scripts de build/lint/test |

## Rules

### Validation Matrix

| Area | What to verify | Blocks |
|---|---|---|
| Build | Projeto compila / build do projeto | Implementation Complete |
| Lint | Linter do projeto limpo (erros relacionados) | Implementation Complete |
| Tests | Testes obrigatórios aplicáveis (`testing-standard`) | Implementation Complete |
| Docs | Impacto documental tratado ou N/A | Implementation Complete |
| ADR | ADR criada/proposta se gatilho | Implementation (gate) / Delivery se pendente aceite |
| Git readiness | Branch/commits/limpo local | Implementation readiness |
| Issue | Escopo alinhado; Issue existe quando obrigatório | Delivery Complete |
| PR | PR preparado/criado; `Closes #N` | Delivery Complete |
| Changelog / release notes | Quando Release | Release Complete |
| Checklist | Feature/Git/DoD/Release conforme tipo | Matching completion state |

### Order

1. Quality (build/lint/tests/architecture)
2. Docs / ADR
3. Git readiness
4. Delivery artifacts (Issue/PR) when claiming Delivery
5. Release artifacts when claiming Release

### Never

- Hardcodar `npm`/stack neste engine
- Ignorar falha relacionada à tarefa
- Marcar PASS sem evidência ou sem declarar que o projeto não tem o check

## Related Documents

- `engine/automatic-checks.md`
- `engine/delivery-engine.md`
- `standards/testing-standard.md`
- `standards/quality-gates.md`
- `checklists/definition-of-done.md`
- `checklists/feature-checklist.md`
- `checklists/git-checklist.md`
