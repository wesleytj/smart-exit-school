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

Toda autenticação de identidade será realizada pelo Supabase Auth.

O sistema não armazenará senhas em tabelas de domínio (`schools`, etc.).

Estado atual (implementação):

- **Platform Admin:** Supabase Auth + `public.platform_admins` + RPC `is_platform_admin()` — implementado.
- **Tenant (operadores da instituição):** Auth Tenant ainda não implementado — ver ADR-029.

Motivação

- Segurança
- Menor manutenção
- Melhor integração

---

## ADR-005 — Schools

Status: ✅ Congelado

Decisão

A tabela `schools` representa apenas uma organização (instituição).

Não armazenará:

- email
- password

Essas informações pertencem ao usuário autenticado (Supabase Auth), nunca à linha da escola.

Consequência: qualquer login por `school.email` / `school.password` é incompatível com este ADR e não deve existir no código.

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

---

## ADR-028 — Domínios Platform e Tenant (autorização SaaS)

**Status:** ✅ Congelado

**Origem:** Issue #16 — Persistir entidades School exclusivamente no Supabase

### Contexto

Durante a implementação da persistência de `public.schools` no Supabase, ficou evidente uma lacuna de modelagem de autorização.

O banco atual foi desenhado apenas para usuários **pertencentes a uma escola**, através de:

- `school_members`
- `roles` (papéis de tenant: owner, administrator, secretary, gatekeeper)

Esse modelo resolve isolamento multi-tenant, mas **não representa** o administrador global da plataforma SaaS.

#### Plataforma vs Tenant

| Conceito | Significado |
|----------|-------------|
| **Plataforma (Platform)** | Operação do produto Smart Exit School pela AllTech (ou operador SaaS). Gerencia o ciclo de vida dos tenants, planos, suporte e operação comercial. |
| **Tenant** | Uma escola (`schools`) cliente da plataforma. Possui seus próprios usuários, dados acadêmicos e operacionais. |

#### Por que `school_members` não representa usuários da plataforma

- `school_members` modela o vínculo **usuário ↔ escola**.
- Um Platform Admin **nunca pertence a uma escola**; ele opera *sobre* as escolas.
- Forçar Platform Admin em `school_members` quebraria o isolamento multi-tenant, misturaria papéis incompatíveis e tornaria policies RLS de CRUD em `schools` incorretas ou inseguras.
- Operações de ciclo de vida do tenant (criar, suspender, excluir, alterar plano) são responsabilidade da **plataforma**, não de um membro da escola.

Sem um domínio Platform explícito, não há base correta para policies RLS de `INSERT`, `UPDATE` e `DELETE` em `public.schools` no contexto do Platform Admin.

### Decisão

A autorização da plataforma será organizada em **dois domínios distintos**.

#### Domínio Platform

Papéis de operação da plataforma (não são papéis de escola):

- Platform Admin (autoridade global sobre o ciclo de vida das instituições)
- Support
- Financeiro
- Comercial (se necessário futuramente)

Usuários Platform **não** utilizam `school_members` para obter autoridade sobre o ciclo de vida das escolas.

#### Domínio Tenant

Papéis internos à escola (já alinhados à ADR-006 / ADR-012):

- Owner
- Administrator
- Secretary
- Gatekeeper

Usuários Tenant continuam vinculados às escolas via `school_members` e sujeitos às policies RLS por tenant.

Esta ADR **não altera** a lista de roles de tenant já congeladas; ela introduz o domínio Platform como camada separada.

### Responsabilidades

#### Platform Admin (e papéis Platform equivalentes, conforme permissão futura)

- cria escolas
- edita escolas (dados institucionais / ciclo de vida)
- exclui escolas
- suspende escolas
- altera planos
- acessa qualquer tenant (quando autorizado)
- **nunca** pertence a uma escola via `school_members` como fonte de autoridade Platform

#### Tenant Users

- pertencem a uma ou mais escolas
- utilizam `school_members`
- seguem as policies RLS por tenant
- operam apenas dentro do escopo das escolas das quais são membros ativos

### Impersonation (“Entrar como”)

O sistema suportará oficialmente o modo **impersonation**.

#### O que é

Um Platform Admin (ou papel Platform autorizado) poderá **operar dentro de um tenant específico** para suporte técnico, sem utilizar as credenciais do usuário da escola.

#### O que não é

- **Não** será login com a senha do usuário do tenant.
- **Não** será troca de identidade Auth para a conta do usuário impersonado.

#### Como funciona (conceito)

- O Platform Admin permanece autenticado como **ele próprio** (Supabase Auth / ADR-004).
- O sistema ativa um **contexto de impersonation** apontando para um tenant (`school`) específico.
- A partir desse contexto, o operador age *dentro* daquele tenant, sem deixar de ser um usuário Platform.

#### Auditoria (obrigatória no futuro — Audit Core)

Toda impersonation deverá ser auditável, incluindo no mínimo:

- quem iniciou a impersonation
- quando iniciou
- qual tenant foi acessado
- quando encerrou

Eventos adicionais (ações realizadas durante a sessão) poderão ser incluídos pelo Audit Core.

### Motivação

- Permitir CRUD correto de `schools` na Issue #16 e nas etapas seguintes.
- Separar claramente operação SaaS de operação escolar.
- Evitar gambiarras de membership fictício para Platform Admin.
- Preparar suporte técnico seguro via impersonation auditável.
- Preservar multi-tenant sem contaminar `school_members` com papéis de plataforma.

### Consequências

#### Policies RLS

- Policies de ciclo de vida de `schools` (`INSERT` / `UPDATE` / `DELETE`) para Platform Admin **já implementadas** (Migrations 0008 e 0012), via `public.is_platform_admin()`.
- Policies de dados do tenant continuam baseadas em membership ativa (`is_active_school_member`).
- UPDATE por `owner` / `administrator` do tenant permanece no domínio Tenant; Platform Admin também pode atualizar.

#### Auth

- Autenticação Platform usa Supabase Auth (ADR-004) + tabela `platform_admins` + RPC `is_platform_admin()`.
- Autorização Platform é distinta de `school_members`.
- Impersonation não substitui Auth; permanece futuro (Audit Core).

#### School CRUD

- Criação, exclusão, suspensão e mudança de plano de escolas são responsabilidade Platform — **CRUD de catálogo no frontend já opera sob Platform Admin**.
- Edições operacionais do tenant (turmas/alunos/portões) ainda usam persistência local no painel.
- `/admin/institutions` exige `usePlatformAdmin` (sessão Auth + RPC).

#### Audit Core

- Impersonation e ações Platform sobre tenants tornam o Audit Core requisito estrutural, não opcional.
- Trilhas mínimas: início/fim de impersonation, tenant alvo e ator Platform.

#### Suporte técnico

- “Entrar como” passa a ser o mecanismo oficial de suporte, substituindo o antipadrão de pedir ou usar senha do cliente.
- Operadores Platform mantêm identidade própria durante o atendimento.

#### Multi-tenant

- Isolamento por escola via `school_members` é preservado.
- Platform opera *cross-tenant* por autoridade explícita de plataforma, não por vínculos artificiais em todas as escolas.
- Um mesmo `profile` poderá, em cenários futuros, ser usuário Platform e também membro Tenant em escolas distintas — mas as autoridades não se confundem: Platform ≠ membership.

---

## ADR-029 — Auth Tenant (operadores da instituição)

**Status:** 🚧 Proposed / Planned

**Depends on:** ADR-004, ADR-005, ADR-006, ADR-028

### Context

Platform Admin authentication is implemented (Supabase Auth + `platform_admins` + `is_platform_admin()`).

Institution operator login must **not** use credentials on `public.schools` (ADR-005 forbids `email` / `password` on schools). A legacy localStorage session (`@SmartExit:loggedSchool`) remains only for panel/TV operational state until Tenant Auth ships.

### Decision (planned)

Tenant authentication will use:

1. Supabase Auth (identity — ADR-004)
2. `public.school_members` (membership to an institution)
3. Tenant `roles` (ADR-006)
4. Existing tenant RLS helpers / policies
5. Complete removal of legacy institution session login paths

### Consequences

- `Login.jsx` currently serves **Platform Admin only**.
- `authService` holds **tenant session storage only** (no credential matching).
- Implementing Tenant Auth is the next auth-focused PR; no palliative email/password on schools.
