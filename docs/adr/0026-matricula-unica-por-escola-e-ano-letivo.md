# ADR-026 — Matrícula única por escola e ano letivo

**Status:** ✅ Congelado

### Decisão

Um aluno poderá possuir apenas uma matrícula ativa por escola em um mesmo ano letivo.

A matrícula poderá ser reativada quando necessário, preservando o histórico do registro.

### Motivação

A matrícula representa o vínculo do aluno com uma instituição em determinado ano letivo.

Permitir múltiplas matrículas ativas para a mesma escola e ano geraria inconsistências nas regras de negócio.

Ao mesmo tempo, manter o registro e apenas alterar seu status preserva o histórico e evita duplicações desnecessárias.

### Consequências

- Garante integridade dos dados.
- Evita duplicidade de matrículas.
- Permite reativação de alunos.
- Mantém o histórico consistente.
