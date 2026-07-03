# Modelagem do Domínio

Este documento descreve as entidades de negócio do Smart Exit School.

**Estado da implementação:**

| Domínio | Modelagem | Migration PostgreSQL |
|---------|-----------|----------------------|
| Authentication Core | ✅ | ✅ `20260628155403` |
| Academic Core | ✅ | ✅ `20260701014657` |
| Academic Enrollment Assignment | ✅ | ✅ `20260702204601` |
| Pickup Core | ✅ | ✅ `20260703154000` |
| Audit Core | 📋 Planejado | ❌ Pendente |

---

# Authentication Core

## School

Representa uma instituição de ensino.

Relacionamentos:

- possui School Members
- possui Academic Levels
- possui Academic Groups
- possui Students
- possui Student Enrollments
- possui Gates
- possui Pickup Events

---

## Profile

Representa um usuário autenticado.

Relacionamentos:

- possui School Members

---

## Role

Representa um papel dentro do sistema.

Relacionamentos:

- utilizado por School Members

---

## School Member

Representa o vínculo entre um usuário e uma escola.

Relacionamentos:

- pertence a uma School
- pertence a um Profile
- possui uma Role

---

# Academic Core

## Academic Level

Representa um nível de ensino.

Exemplos:

- Educação Infantil
- Ensino Fundamental I
- Ensino Fundamental II
- Ensino Médio

Relacionamentos:

- possui Academic Groups

---

## Academic Shift

Representa um turno acadêmico.

Exemplos:

- Morning
- Afternoon
- Night
- Full-time

Relacionamentos:

- utilizado por Academic Groups

---

## Academic Group

Representa um grupo acadêmico definido pela instituição.

Exemplos:

- Pré 5 A
- 5º Ano B
- EF3MA
- 311

Relacionamentos:

- pertence a um Academic Level
- pertence a um Academic Shift
- possui Student Group Assignments

---

## Student

Representa a identidade permanente de um aluno.

Não armazena:

- turma
- turno
- nível acadêmico
- ano letivo

Essas informações pertencem às demais entidades do domínio acadêmico.

---

## Student Enrollment

Representa a matrícula do aluno em um determinado ano letivo.

Relacionamentos:

- pertence a um Student
- possui Student Group Assignments
- possui Pickup Events

Armazena:

- ano letivo
- status

Não representa a turma do aluno. Essa responsabilidade pertence à entidade **Student Group Assignment** (ADR-025).

---

## Student Group Assignment

Representa o vínculo entre a matrícula do aluno e a turma acadêmica em que ele está alocado.

Relacionamentos:

- pertence a um Student Enrollment
- pertence a um Academic Group

Regra central: uma matrícula só pode ter **um vínculo ativo** com turma por vez (índice único parcial no PostgreSQL).

---

# Pickup Core

**Status:** schema implementado na Migration 0004. Integração com os services do frontend (`gateService`, `callService`) ainda pendente — runtime continua em localStorage.

## Gate

Representa um portão de saída da escola utilizado no fluxo operacional de liberação de alunos.

Armazena:

- nome e descrição
- ordem de exibição na interface
- status (`active` / `inactive`)

Relacionamentos:

- pertence a uma School
- recebe Pickup Events

---

## Pickup Event

Representa um evento operacional de saída escolar.

Estados:

- `called` — aluno chamado, aguardando saída
- `completed` — saída concluída
- `cancelled` — chamada cancelada

Relacionamentos:

- pertence a uma School
- pertence a um Student Enrollment
- pertence a um Gate

Regra central: **no máximo uma chamada ativa** (`status = called`) por matrícula.

Timestamps:

- `called_at` — momento da chamada
- `completed_at` — preenchido ao concluir
- `cancelled_at` — preenchido ao cancelar

---

# Audit Core

**Status:** planejado — sem migration implementada.
