# Decisões Arquiteturais

Este documento registra as principais decisões arquiteturais do Smart Exit School.

---

## ADR-001 — Idioma do código

Status: ✅ Congelado

Decisão

Todo o código-fonte, banco de dados, APIs e nomes técnicos serão escritos em inglês.

Motivação

- Padrão internacional.
- Facilita manutenção.
- Facilita contratação futura.
- Compatível com documentação oficial.

---

## ADR-002 — Idioma da documentação

Status: ✅ Congelado

Decisão

Toda a documentação será escrita em português (pt-BR).

Motivação

O principal consumidor da documentação é a equipe da AllTech durante o desenvolvimento.

No futuro poderá ser traduzida.

---

## ADR-003 — Identificadores

Status: ✅ Congelado

Decisão

Todas as tabelas utilizarão UUID como chave primária.

Motivação

- Segurança
- APIs
- Escalabilidade
- Multi-tenant

---

## ADR-004 — Autenticação

Status: ✅ Congelado

Decisão

Toda autenticação será realizada pelo Supabase Auth.

O sistema não armazenará senhas.

Motivação

- Segurança
- Menor manutenção
- Melhor integração

---

## ADR-005 — Schools

Status: ✅ Congelado

Decisão

A tabela schools representa apenas uma organização.

Não armazenará:

- email
- password

Essas informações pertencem ao usuário autenticado.

---

## ADR-006 — Roles

Status: ✅ Congelado

Decisão

A tabela roles será global.

As permissões representam funções dentro do sistema e não profissões.

Roles iniciais:

- owner
- administrator
- secretary
- gatekeeper

ACL ficará para versões futuras.

---

## ADR-007 — Profiles

Status: ✅ Congelado

Decisão

profiles representa apenas uma pessoa autenticada.

Não possui:

- school_id
- role_id

Esses relacionamentos pertencem à tabela school_members.

---

## ADR-008 — Internacionalização

Status: ✅ Congelado

Decisão

Valores armazenados no banco serão códigos em inglês.

Exemplos:

status

- active
- inactive

plan

- basic
- pro
- enterprise

A tradução será responsabilidade do frontend.

---

## ADR-009 — Estratégia de Produto

Status: ✅ Congelado

Decisão

O MVP terá:

- Cadastro manual
- Importação Excel

Integrações com ERP serão implementadas posteriormente.

O banco já será preparado para isso através do campo external_id.

---

## ADR-010 — Modelagem

Status: ✅ Congelado

Decisão

Modelar o domínio do negócio e não a origem dos dados.

Um aluno continua sendo um aluno independentemente de vir:

- Cadastro manual
- Excel
- ERP
- API

---

## ADR-011 — Associação entre usuários e escolas

**Status:** ✅ Congelado

### Decisão

O relacionamento entre usuários e escolas será realizado através da tabela `school_members`.

A tabela `profiles` não possuirá os campos `school_id` ou `role_id`.

### Motivação

Um mesmo usuário poderá participar de várias escolas.

Exemplos:

- Consultores da AllTech
- Administradores de redes de ensino
- Responsáveis com filhos em escolas diferentes

Essa abordagem segue um relacionamento Muitos-para-Muitos entre usuários e escolas.

### Consequências

- Melhor escalabilidade.
- Arquitetura multi-tenant.
- Maior flexibilidade para futuras integrações.

---

## ADR-012 — Representação de papéis

**Status:** ✅ Congelado

### Decisão

Os papéis (roles) representam permissões dentro do Smart Exit School e não o cargo profissional do usuário.

Papéis iniciais:

- owner
- administrator
- secretary
- gatekeeper

### Motivação

O mesmo cargo profissional pode exercer funções diferentes dentro do sistema.

Exemplo:

Um profissional de TI pode ser `owner` durante a implantação e posteriormente tornar-se `administrator`.

A interface poderá apresentar nomes mais amigáveis sem alterar os códigos armazenados no banco.

---

## ADR-013 — Status do vínculo

**Status:** ✅ Congelado

### Decisão

A tabela `school_members` utilizará um campo `status` para controlar se um vínculo está ativo.

Valores permitidos:

- active
- inactive

### Motivação

Preservar histórico de usuários sem necessidade de exclusão física dos registros.

Essa estratégia facilita auditoria e futuras reativações.

---

## ADR-014 — Restrição de vínculo único

**Status:** ✅ Congelado

### Decisão

Cada Profile poderá possuir apenas um vínculo com a mesma escola.

Essa regra será garantida através da constraint:

school_members_school_profile_unique

### Motivação

Evitar registros duplicados para o mesmo usuário dentro da mesma instituição.

O mesmo usuário continua podendo participar de diversas escolas diferentes. 

---

## ADR-015 — White Label preparado desde a primeira versão

**Status:** ✅ Congelado

### Decisão

O Smart Exit School será desenvolvido inicialmente como um único produto.

Entretanto, a arquitetura já será preparada para suportar White Label futuramente.

A tabela `schools` armazenará informações como:

- logo_url
- primary_color
- secondary_color

### Motivação

Adicionar esses campos desde a primeira migration possui custo praticamente zero e evita futuras migrações estruturais.

Ao mesmo tempo, evita adicionar complexidade desnecessária ao frontend durante o MVP.

---

## ADR-016 — Identidade da escola através de Slug

**Status:** ✅ Congelado

### Decisão

Toda escola possuirá um `slug` único.

Exemplo:

```
colegio-adventista-esteio
```

### Motivação

O slug será utilizado futuramente para:

- URLs amigáveis
- Compartilhamento de links
- Multi-tenant
- SEO
- APIs públicas

O UUID continua sendo a chave primária oficial.

---

## ADR-017 — Estratégia para Integrações

**Status:** ✅ Congelado

### Decisão

O Smart Exit School será desenvolvido inicialmente com foco em:

1. Cadastro manual
2. Importação via Excel

Integrações com ERPs serão implementadas posteriormente.

A arquitetura permanecerá preparada através do campo `external_id`.

### Motivação

Os primeiros clientes poderão implantar o sistema sem depender de autorização dos fornecedores de ERP.

Isso reduz significativamente a barreira comercial do produto.

---

## ADR-018 — Integrações com Hardware

**Status:** ✅ Congelado

### Decisão

A arquitetura deverá permitir futuras integrações com dispositivos físicos.

Exemplos:

- Catracas
- Leitores RFID
- QR Code
- Reconhecimento Facial

Essas integrações não fazem parte do MVP, mas influenciaram a modelagem inicial do banco.

### Motivação

Diversas escolas utilizam dispositivos físicos para controle de acesso.

A arquitetura deve permitir essas integrações sem necessidade de refatorações profundas.

---

## ADR-019 — Evolução incremental do banco de dados

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