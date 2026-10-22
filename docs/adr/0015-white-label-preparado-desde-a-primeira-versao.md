# ADR-015 — White Label preparado desde a primeira versão

**Status:** ✅ Congelado

### Decisão

O Smart Exit School será desenvolvido inicialmente como um único produto.

Entretanto, a arquitetura já será preparada para suportar White Label futuramente.

A tabela `schools` armazenará informações como:

- logo_url
- primary_color
- secondary_color

### Motivação

Adicionar esses campos desde a primeira migration possui custo praticamente zero e evita futuras migrações estruturais.

Ao mesmo tempo, evita adicionar complexidade desnecessária ao frontend durante o MVP.
