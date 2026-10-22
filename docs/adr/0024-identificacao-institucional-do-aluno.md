# ADR-024 — Identificação institucional do aluno

**Status:** ✅ Congelado

### Decisão

A tabela students possuirá um campo student_identifier para armazenar o identificador institucional do aluno.

Esse identificador poderá representar diferentes conceitos conforme a instituição, como:

- Número de matrícula;
- Código interno;
- Identificador da carteirinha;
- Código utilizado por dispositivos físicos.

### Motivação

As instituições de ensino utilizam diferentes padrões para identificar seus alunos.

Além disso, futuras integrações com catracas, RFID, QR Code e outros dispositivos poderão utilizar esse identificador como referência, sem depender do UUID interno do sistema.
