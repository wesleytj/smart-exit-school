# Testing Standard

**Version:** 0.3.0  
**Status:** Active  
**Layer:** standards

## Objective

Definir obrigações de teste sem acoplar o AADS a uma stack.

## Scope

Quando testes são obrigatórios e como reportá-los.  
Comandos concretos vêm do projeto.

## Responsibilities

| Role | Duty |
|---|---|
| Projeto | Definir scripts/ferramentas de teste |
| IA | Executar o que existir; não inventar stack |

## Rules

1. Usar comandos/scripts **do projeto** (package.json, Makefile, CI, etc.).
2. Se não houver suite: declarar limitação; não fingir testes.
3. Obrigatório validar o alcance da mudança (manual estruturado conta se documentado).
4. Bug Fix / Refactor: priorizar regressão no comportamento afetado.
5. Feature: cobrir critérios de aceite; automatizar quando o projeto tiver padrão.
6. Falha de teste relacionado à tarefa bloqueia Implementation Complete.
7. Resultados entram no PR / Completion report.

## Related Documents

- `engine/automatic-checks.md`
- `standards/quality-gates.md`
- `checklists/definition-of-done.md`
- `engine/aads-operating-model.md`
