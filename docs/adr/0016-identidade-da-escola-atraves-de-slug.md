# ADR-016 — Identidade da escola através de Slug

**Status:** ✅ Congelado

### Decisão

Toda escola possuirá um `slug` único.

Exemplo:

```
colegio-adventista-esteio
```

### Motivação

O slug será utilizado futuramente para:

- URLs amigáveis
- Compartilhamento de links
- Multi-tenant
- SEO
- APIs públicas

O UUID continua sendo a chave primária oficial.
