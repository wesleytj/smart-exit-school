# Release Checklist

**Version:** 0.3.0  
**Status:** Active  
**Layer:** checklists

## Objective

Gates para declarar **Release Complete**.

## Scope

Usar com `workflows/release-workflow.md`.

## Checks

### Pré-release

- [ ] Itens incluídos estão em Delivery Complete (ou exceções aprovadas)
- [ ] Versão proposta conforme `standards/versioning-standard.md`
- [ ] `templates/release-template.md` preenchido
- [ ] Breaking changes documentadas
- [ ] ADRs relevantes referenciadas
- [ ] Issues do release listadas
- [ ] Quality Validation do projeto executada no estado a publicar
- [ ] Rollback path conhecido

### Publish

- [ ] Aprovação humana para publish
- [ ] Tag/version aplicada
- [ ] Artefatos publicados conforme processo do projeto
- [ ] Evidência de publish registrada

### Pós-release

- [ ] Release Complete declarado com evidência
- [ ] Follow-ups abertos se necessário

## Related Documents

- `workflows/release-workflow.md`
- `templates/release-template.md`
- `standards/versioning-standard.md`
- `standards/risk-management.md`
- `engine/aads-operating-model.md`
