# Versioning Standard

**Version:** 0.3.0  
**Status:** Active  
**Layer:** standards

## Objective

Definir SemVer para **projetos** que usam AADS (distinto do versionamento do próprio AADS em `CHANGELOG.md`).

## Scope

Versionamento de produto/biblioteca do projeto.  
Não redefine o SemVer interno do AADS.

## Responsibilities

| Role | Duty |
|---|---|
| IA | Propor bump correto e atualizar artefatos |
| Humano | Aprovar releases com breaking changes |

## Rules

Formato: `MAJOR.MINOR.PATCH`

| Bump | Quando |
|---|---|
| MAJOR | Breaking change incompatível |
| MINOR | Nova funcionalidade compatível |
| PATCH | Correção compatível |

1. Toda Release deve ter versão explícita.
2. Tag Git recomendada: `vX.Y.Z`.
3. Breaking changes exigem menção em release notes.
4. Hotfix em produção tipicamente incrementa PATCH (ou política do projeto documentada).
5. Pré-releases: `-alpha.N`, `-beta.N`, `-rc.N` quando o projeto adotar.

## Related Documents

- `workflows/release-workflow.md`
- `templates/release-template.md`
- `CHANGELOG.md` (AADS only)
