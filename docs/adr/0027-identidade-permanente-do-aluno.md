# ADR-027 — Identidade permanente do aluno

**Status:** ✅ Congelado

### Decisão

A entidade `students` representa exclusivamente a identidade permanente do aluno dentro de uma instituição.

Ela não armazenará informações relacionadas à vida acadêmica, como:

- turma;
- turno;
- nível acadêmico;
- ano letivo.

Essas informações serão mantidas em entidades próprias.

Além disso, todo aluno deverá possuir um identificador institucional (`student_identifier`), único dentro da escola.

### Motivação

Separar identidade de informações temporárias simplifica a modelagem, preserva o histórico acadêmico e evita duplicação de registros.

O identificador institucional também permite integração com sistemas legados, carteirinhas estudantis, catracas, RFID e outros dispositivos físicos sem depender do UUID interno do sistema.

### Consequências

- Separação clara entre identidade e matrícula.
- Histórico acadêmico preservado.
- Preparação para integrações futuras.
- Maior consistência dos dados.
