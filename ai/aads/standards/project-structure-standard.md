# Project Structure Standard

**Version:** 0.3.0  
**Status:** Active  
**Layer:** standards

## Objective

Definir expectativas mínimas de estrutura para projetos que adotam AADS.

## Scope

Layout portátil. Não força stack específica.

## Rules

### Required (recommended baseline)

```text
README.md
docs/                 # documentação do produto
ai/                   # contexto de IA do projeto (não AADS)
  ai-context.md
  project-summary.md
  coding-rules.md
  forbidden-actions.md
ai/aads/              # ou referência ao AADS externo quando extraído
```

### Principles

1. Uma responsabilidade por diretório de topo.
2. Documentação de produto em `docs/`, não só no README.
3. Regras de projeto em `ai/`; processo em AADS.
4. Não criar pastas novas “por padrão” — Constitution Art. 3.
5. ADRs do projeto em local documentado pelo próprio projeto.

## Related Documents

- `workflows/project-bootstrap.md`
- `standards/documentation-standard.md`
- `standards/naming-conventions.md`
- `INDEX.md`
