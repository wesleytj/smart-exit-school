# Architecture Definition

**Version:** 0.3.0  
**Status:** Active  
**Layer:** standards

## Objective

Definir o que o AADS considera “arquitetura” e quando mudanças exigem ADR/aprovação.

## Scope

Definição e gatilhos. Decisões concretas ficam em ADRs do projeto/AADS.

## Rules

Arquitetura inclui decisões que afetam:

- fronteiras de módulos/camadas
- padrões de persistência e autenticação
- contratos públicos (API/UI estáveis)
- estratégias de segurança/autorização
- escolha de tecnologias principais
- convenções estruturais transversais

### Requer ADR + Human Approval quando

- criar/substituir padrão estrutural
- mudar auth/RLS/DB strategy
- remover capacidade pública
- adotar nova tecnologia central

### Não requer ADR

- bug fix local
- rename interno
- refactor sem mudança de fronteira
- docs/chore sem impacto estrutural

## Related Documents

- `standards/adr-management.md`
- `constitution/constitution.md`
- `engine/aads-operating-model.md` (G-ARCH, G-DB, G-SEC)
- `workflows/refactor-workflow.md`
