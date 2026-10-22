# ADR-025 — Separação entre Aluno e Matrícula

**Status:** ✅ Congelado

### Decisão

A tabela `students` representará exclusivamente a identidade permanente do aluno.

Ela não armazenará informações temporárias como:

- turma;
- nível acadêmico;
- turno;
- ano letivo.

A tabela `student_enrollments` representará o vínculo do aluno com uma escola em um determinado ano letivo.

A associação do aluno a uma turma específica será responsabilidade da futura tabela `student_group_assignments`.

### Motivação

A identidade do aluno permanece a mesma durante toda sua vida escolar.

A matrícula representa seu vínculo com uma instituição em um determinado ano.

Já a turma pode mudar ao longo do mesmo ano letivo sem que uma nova matrícula seja criada.

Separar esses conceitos preserva o histórico acadêmico e evita que uma única entidade represente responsabilidades distintas.

### Consequências

- Cada entidade representa um único conceito do domínio.
- Trocas de turma não exigem nova matrícula.
- O histórico de movimentações entre turmas poderá ser preservado.
- A arquitetura permanece preparada para futuras evoluções.
