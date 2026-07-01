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

### Decisão

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

## ADR-013 — Padronização de Status das Entidades

**Status:** ✅ Congelado

### Decisão

Sempre que uma entidade do domínio necessitar representar apenas se um registro está disponível para utilização, será utilizado o campo:

status

Valores permitidos:

- active
- inactive

### Motivação

Esse padrão simplifica a modelagem do banco de dados, mantém consistência entre as tabelas e reduz a complexidade das regras de negócio.

Estados mais específicos deverão ser modelados apenas quando representarem conceitos próprios do domínio.

Exemplos:

- payments
  - pending
  - paid
  - cancelled

- pickups
  - pending
  - approved
  - denied
  - completed

Nesses casos, o campo representa o fluxo de negócio e não apenas a disponibilidade do registro.

### Consequências

- Consistência entre entidades administrativas.
- Menor curva de aprendizado.
- CRUDs simplificados.
- Facilita filtros e consultas.

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

---

## ADR-020 — Estrutura Acadêmica Flexível

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

---

## ADR-021 — Processo de modelagem do banco de dados

**Status:** ✅ Congelado

### Decisão

Toda nova migration será desenvolvida em duas etapas:

1. Modelagem conceitual (domínio, relacionamentos e decisões arquiteturais).
2. Implementação SQL somente após o congelamento da modelagem.

### Motivação

- Reduz retrabalho.
- Evita alterações em migrations já publicadas.
- Mantém a documentação sincronizada com o banco.
- Facilita revisão técnica e colaboração.

---

## ADR-022 — Padronização de entidades administrativas

**Status:** ✅ Congelado

### Decisão

Tabelas de configuração (cadastros administrativos) seguirão um padrão comum sempre que fizer sentido.

Campos preferenciais:

- status
- external_id
- created_at
- updated_at

Opcionalmente:

- display_order

O comportamento e os valores do campo `status`, quando utilizado, seguem a ADR-013.

### Regras de Integridade

Sempre que possível, regras universais do domínio deverão ser protegidas pelo banco de dados através de `CHECK Constraints`.

Exemplos:

- valores permitidos para `status`;
- `display_order > 0`;
- outras validações estruturais que sejam invariavelmente verdadeiras.

Regras específicas de negócio ou de interface deverão permanecer na camada da aplicação.

### Motivação

- Consistência do banco.
- Menor curva de aprendizado.
- Facilita manutenção.
- Facilita integrações.
- Simplifica o desenvolvimento do frontend.

### Consequências

- Interfaces administrativas tornam-se mais consistentes.
- CRUDs compartilham praticamente o mesmo comportamento.
- Facilita reutilização de componentes React.

---

## ADR-023 — Turnos Acadêmicos como entidade própria

**Status:** ✅ Congelado

### Decisão

O Smart Exit School modelará os turnos acadêmicos através da tabela `academic_shifts`.

A tabela `academic_groups` possuirá uma chave estrangeira (`academic_shift_id`) apontando para essa entidade.

O turno **não será armazenado** como texto livre dentro de `academic_groups`.

### Estrutura

academic_levels
        │
        │
academic_groups ───────── academic_shifts

### Exemplos de turnos

- Morning
- Afternoon
- Full-time
- Night

A tradução desses valores será responsabilidade do frontend.

### Motivação

O turno representa um conceito do domínio acadêmico e será utilizado em diversas funcionalidades do sistema, como:

- organização das filas de saída;
- filtros;
- dashboards;
- relatórios;
- integrações com ERP;
- importação via Excel;
- regras de negócio.

Modelá-lo como entidade evita duplicação de valores, padroniza os dados e facilita futuras evoluções.

### Consequências

- Banco de dados mais consistente.
- Evita valores diferentes para o mesmo turno.
- Facilita internacionalização.
- Simplifica consultas e filtros.
- Mantém a arquitetura preparada para crescimento.

---

## ADR-024 — Identificação institucional do aluno

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

---

## ADR-025 — Separação entre Aluno e Matrícula

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

---

## ADR-026 — Matrícula única por escola e ano letivo

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

---

## ADR-027 — Identidade permanente do aluno

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