# ADR-028 — Domínios Platform e Tenant (autorização SaaS)

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

Sem um domínio Platform explícito, não há base correta para policies RLS de `INSERT`, `UPDATE` e `DELETE` em `public.schools` no contexto do Super Admin.

### Decisão

A autorização da plataforma será organizada em **dois domínios distintos**.

#### Domínio Platform

Papéis de operação da plataforma (não são papéis de escola):

- Super Admin
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
- Evitar gambiarras de membership fictício para Super Admin.
- Preparar suporte técnico seguro via impersonation auditável.
- Preservar multi-tenant sem contaminar `school_members` com papéis de plataforma.

### Consequências

#### Policies RLS

- Policies de ciclo de vida de `schools` (`INSERT` / `UPDATE` / `DELETE` / suspensão / plano) deverão considerar o domínio **Platform**, não apenas `is_active_school_member`.
- Policies de dados do tenant continuam baseadas em membership ativa.
- A policy atual de UPDATE para `owner` / `administrator` (membros do tenant) permanece no domínio Tenant; autoridade Platform será modelada em etapa futura (sem implementação nesta ADR).

#### Auth

- Autenticação continua no Supabase Auth (ADR-004).
- Autorização Platform exigirá modelo próprio (ex.: papéis/flags de plataforma), distinto de `school_members`.
- Impersonation não substitui Auth; é um contexto operacional adicional sobre a sessão Platform.

#### School CRUD

- Criação, exclusão, suspensão e mudança de plano de escolas são responsabilidade Platform.
- Edições de configuração institucional pelo tenant (quando permitidas) permanecem no escopo Tenant.
- O frontend Super Admin (`/admin/institutions`) deverá, no futuro, operar sob identidade Platform — não sob membership forçada.

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
