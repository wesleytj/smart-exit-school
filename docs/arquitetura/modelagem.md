# Modelagem do Domínio

Este documento descreve as entidades de negócio do Smart Exit School.

**Estado da implementação:**

| Domínio | Modelagem | Migration PostgreSQL |
|---------|-----------|----------------------|
| Authentication Core | ✅ | ✅ `20260628155403` |
| Academic Core | ✅ | ✅ `20260701014657` |
| Pickup Core | 📋 Planejado | ❌ Pendente |
| Audit Core | 📋 Planejado | ❌ Pendente |

Entidades marcadas como "possuirá" abaixo ainda não possuem migration.

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
- possuirá Gates *(Pickup Core — migration pendente)*
- possuirá Pickups *(Pickup Core — migration pendente)*

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
- possuirá Student Group Assignments *(migration pendente — ADR-025)*

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

Armazena:

- ano letivo
- status
- identificador externo

Não representa a turma do aluno.

Essa responsabilidade pertencerá à entidade **Student Group Assignment** (migration futura — ADR-025).

---

# Pickup Core

**Status:** planejado — sem migration implementada.

Entidades previstas: gates, pickup_events, called_students (ou equivalente conforme ADRs).

---

# Audit Core

**Status:** planejado — sem migration implementada.