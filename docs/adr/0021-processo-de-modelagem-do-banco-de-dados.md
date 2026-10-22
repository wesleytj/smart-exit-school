# ADR-021 — Processo de modelagem do banco de dados

**Status:** ✅ Congelado

### Decisão

Toda nova migration será desenvolvida em duas etapas:

1. Modelagem conceitual (domínio, relacionamentos e decisões arquiteturais).
2. Implementação SQL somente após o congelamento da modelagem.

### Motivação

- Reduz retrabalho.
- Evita alterações em migrations já publicadas.
- Mantém a documentação sincronizada com o banco.
- Facilita revisão técnica e colaboração.
