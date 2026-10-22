# ADR-017 — Estratégia para Integrações

**Status:** ✅ Congelado

### Decisão

O Smart Exit School será desenvolvido inicialmente com foco em:

1. Cadastro manual
2. Importação via Excel

Integrações com ERPs serão implementadas posteriormente.

A arquitetura permanecerá preparada através do campo `external_id`.

### Motivação

Os primeiros clientes poderão implantar o sistema sem depender de autorização dos fornecedores de ERP.

Isso reduz significativamente a barreira comercial do produto.
