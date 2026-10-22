# ADR-014 — Restrição de vínculo único

**Status:** ✅ Congelado

### Decisão

Cada Profile poderá possuir apenas um vínculo com a mesma escola.

Essa regra será garantida através da constraint:

school_members_school_profile_unique

### Motivação

Evitar registros duplicados para o mesmo usuário dentro da mesma instituição.

O mesmo usuário continua podendo participar de diversas escolas diferentes. 
