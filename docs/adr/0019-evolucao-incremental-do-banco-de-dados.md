# ADR-019 — Evolução incremental do banco de dados

**Status:** ✅ Congelado

### Decisão

Cada migration possuirá apenas uma responsabilidade.

Exemplos:

- Authentication
- Students
- Guardians
- Gates
- Pickups

Migrations publicadas nunca deverão ser alteradas.

Toda evolução ocorrerá através de novas migrations.

### Motivação

Essa estratégia facilita:

- versionamento
- rollback
- auditoria
- manutenção
- colaboração entre desenvolvedores

Além de seguir boas práticas adotadas na indústria.
