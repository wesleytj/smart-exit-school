# ADR-011 — Associação entre usuários e escolas

**Status:** ✅ Congelado

### Decisão

O relacionamento entre usuários e escolas será realizado através da tabela `school_members`.

A tabela `profiles` não possuirá os campos `school_id` ou `role_id`.

### Motivação

Um mesmo usuário poderá participar de várias escolas.

Exemplos:

- Consultores da AllTech
- Administradores de redes de ensino
- Responsáveis com filhos em escolas diferentes

Essa abordagem segue um relacionamento Muitos-para-Muitos entre usuários e escolas.

### Consequências

- Melhor escalabilidade.
- Arquitetura multi-tenant.
- Maior flexibilidade para futuras integrações.
