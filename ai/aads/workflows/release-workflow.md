# Release Workflow

**Version:** 0.3.0  
**Status:** Active  
**Layer:** workflows

## Objective

Publicar uma versão do produto de forma rastreável e auditável.

## Scope

Release de projeto (não versionamento interno do AADS — ver `standards/versioning-standard.md`).  
Culmina em **Release Complete**.

## Responsibilities

| Role | Duty |
|---|---|
| Equipe/projeto | Autorizar e executar publish |
| IA | Preparar checklist, notas, validar pré-requisitos; não publicar sem autorização |

## Rules

1. Só iniciar Release com Delivery Complete das mudanças incluídas (ou lista explícita de exceções aprovadas).
2. Versionar conforme `standards/versioning-standard.md`.
3. Preencher `templates/release-template.md`.
4. Executar `checklists/release-checklist.md`.
5. Registrar Issues/ADRs incluídas.
6. Breaking changes devem estar documentadas.
7. Rollback path conhecido (`standards/risk-management.md`, `engine/ai-recovery-protocol.md`).
8. IA nunca declara Release Complete sem evidência de publish do projeto.

## Sequence

```text
Delivery Complete (itens do release)
→ Version bump
→ Release notes
→ Quality / release checklist
→ Human approval to publish
→ Publish
→ Release Complete
```

## Related Documents

- `checklists/release-checklist.md`
- `templates/release-template.md`
- `standards/versioning-standard.md`
- `engine/aads-operating-model.md`
- `standards/git-workflow.md`
