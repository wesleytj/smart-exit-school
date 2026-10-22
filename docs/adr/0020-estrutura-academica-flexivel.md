# ADR-020 — Estrutura Acadêmica Flexível

**Status:** ✅ Congelado

### Decisão

O Smart Exit School modelará a estrutura acadêmica em dois níveis distintos:

- `academic_levels`
- `academic_groups`

O sistema **não possuirá** tabelas específicas para:

- Turmas (A, B, C...)
- Séries
- Turnos

Essas informações serão armazenadas como atributos livres dentro dos grupos acadêmicos.

### Exemplos

Educação Infantil

Level:
- Educação Infantil

Groups:
- Pré 4 A
- Pré 5 B

Ensino Fundamental

Level:
- Ensino Fundamental I

Groups:
- 1º Ano A
- 3º Ano B
- 5º Ano C

Escolas com códigos próprios

Level:
- Ensino Fundamental

Groups:
- EF3MA
- EF7TB
- 311
- 212

### Motivação

Cada instituição organiza suas turmas de maneira diferente.

Alguns exemplos reais:

- 5º Ano A
- 5º Ano B
- EF3MA
- EIpre5A
- 311
- 212

Modelar cada uma dessas possibilidades através de tabelas específicas aumentaria significativamente a complexidade do banco sem gerar benefícios práticos.

A responsabilidade pela nomenclatura pertence à escola.

O Smart Exit School apenas organiza esses grupos de forma consistente.

### Consequências

- Banco de dados mais simples.
- Flexibilidade para diferentes redes de ensino.
- Compatível com escolas brasileiras e internacionais.
- Evita futuras migrações estruturais relacionadas ao modelo acadêmico.
