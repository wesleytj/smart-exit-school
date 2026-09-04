# Naming Conventions

**Version:** 0.3.0  
**Status:** Active  
**Layer:** standards

## Objective

Convenções portáteis de nomenclatura para projetos AADS.

## Scope

Nomes de branches, commits, Issues, arquivos e símbolos.  
Detalhes de linguagem (React/JS) ficam nas coding rules do projeto.

## Rules

### Branches

Ver `standards/branch-strategy.md`: `<type>/<issue>-<descricao-kebab>`.

### Commits

Ver `templates/commit-template.md`: `tipo(escopo): descrição` (imperativo, inglês preferencial).

### Issues / PRs

- Título curto com verbo.
- PR alinhado ao commit style quando squash merge.

### Files / symbols

1. Seguir convenções **já existentes** no projeto.
2. Não introduzir novo estilo de pastas/nomes sem ADR/autorização.
3. Preferir nomes descritivos; evitar abreviações opacas.
4. Uma responsabilidade por arquivo quando o projeto já adota isso.

## Related Documents

- `standards/branch-strategy.md`
- `templates/commit-template.md`
- `standards/project-structure-standard.md`
- `standards/architecture-definition.md`
