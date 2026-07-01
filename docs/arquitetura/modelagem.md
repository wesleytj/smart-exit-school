# Modelagem do Domínio

Este documento descreve as entidades de negócio do Smart Exit School.

A modelagem apresentada é conceitual e serve como referência para as migrations SQL.

---

# Authentication Core

## School

Representa uma instituição de ensino.

Relacionamentos:

- possui School Members
- possui Academic Levels
- possui Academic Groups
- possui Students
- possuirá Gates
- possuirá Pickups

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
- possuirá Student Group Assignments

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

Essa responsabilidade pertencerá futuramente à entidade Student Group Assignment.

---

# Pickup Core

(Em construção)

---

# Audit Core

(Em construção)