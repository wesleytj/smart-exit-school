# Project Bootstrap

**Version:** 0.3.0  
**Status:** Active  
**Layer:** workflows

## Objective

Construir contexto ao entrar em um projeto (primeira vez ou sessão fria).

## Scope

Onboarding de projeto. Execução contínua: `engine/aads-operating-model.md`.

## Responsibilities

| Role | Duty |
|---|---|
| IA | Carregar contexto mínimo necessário; não assumir memória |
| Humano | Indicar objetivo da sessão |

## Rules

### Ordem de leitura (mínimo → sob demanda)

1. `README.md` do projeto
2. `ai/aads/INDEX.md` (mapa AADS)
3. `ai/aads/constitution/constitution.md` (limites)
4. `ai/aads/engine/source-of-truth-map.md`
5. `ai/aads/engine/aads-operating-model.md`
6. `ai/ai-context.md`, `project-summary.md`, `coding-rules.md`, `forbidden-actions.md`
7. ADRs / `docs/` relevantes ao pedido
8. Estrutura de diretórios e stack (sob demanda)

Não ler todos os Standards/Workflows por padrão — só os do tipo de trabalho classificado.

### Identificar

- arquitetura e stack
- branch / issue atuais
- objetivo da tarefa
- riscos/gates prováveis

### Validação

Só implementar após compreender domínio, arquitetura aplicável e objetivo.

## Related Documents

- `INDEX.md`
- `prompts/bootstrap.md`
- `standards/project-structure-standard.md`
- `engine/aads-operating-model.md`
- `standards/prompt-management.md`
