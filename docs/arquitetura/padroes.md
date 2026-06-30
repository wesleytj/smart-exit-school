# Padrões do Projeto

Este documento define os padrões oficiais utilizados durante o desenvolvimento do Smart Exit School.

---

# Filosofia de Engenharia

O Smart Exit School prioriza padrões amplamente adotados pela indústria de software.

Sempre que possível, arquitetura, documentação, banco de dados, versionamento e organização do código devem seguir padrões consolidados, evitando soluções proprietárias.

---

# Idioma

## Código

- Inglês

## Banco de Dados

- Inglês

## APIs

- Inglês

## Documentação

- Português (pt-BR)

---

# Banco de Dados

## Tabelas

- snake_case
- plural

Exemplos

students

guardians

school_members

pickup_events

---

## Colunas

- snake_case

Exemplos

created_at

updated_at

school_id

guardian_id

---

## Chave Primária

Sempre:

UUID

Nome:

id

---

## Chaves Estrangeiras

Sempre:

<entidade>_id

Exemplos

school_id

profile_id

guardian_id

---

## Índices

Prefixo:

idx_

---

## Constraints

Primary Key

pk_

Foreign Key

fk_

Unique

uk_

Check

ck_

---

# Migrations

Uma responsabilidade por migration.

Exemplos

0001 Authentication

0002 Students

0003 Guardians

Nunca alterar migrations publicadas.

Sempre criar uma nova migration.

---

# Services

Um domínio por Service.

Exemplos

studentService

guardianService

pickupService

Componentes React nunca acessam Supabase diretamente.

Toda regra de negócio pertence aos Services.

---

# Commits

Utilizar Conventional Commits.

Exemplos

feat(database):

fix(auth):

docs:

refactor(student):

---

# Documentação

Toda decisão arquitetural deve ser registrada em:

docs/arquitetura/decisoes.md

Toda alteração estrutural deve atualizar sua documentação correspondente.

---

# Revisão

Antes de iniciar uma nova funcionalidade verificar:

- ADRs
- Banco de Dados
- Roadmap
- Regras de Negócio