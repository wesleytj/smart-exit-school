# Regras de Negócio — Smart Exit School

Documentação das regras de negócio do sistema, derivada exclusivamente do comportamento implementado e validado no código-fonte, migrations e testes.

---

## 1. Modelo de negócio SaaS

### 1.1 Multi-instituição

- Uma instância da aplicação serve múltiplas escolas (instituições)
- Autenticação e identidade gerenciadas pelo Supabase Auth (`auth.uid()`), sem credenciais de email/senha isoladas diretamente na entidade escola ([ADR-005](./arquitetura/decisoes.md#adr-005-representacao-de-escola-em-publicschools))
- Resolução de escola ativa (tenant) através de membership ativa em `public.school_members` vinculada ao perfil do usuário
- Gestão global de instituições e catálogo reservada exclusivamente a Platform Admins via RPC `public.is_platform_admin()`
- Dados e operações de cada escola são isolados por `school_id` nas tabelas relacionais do Supabase sob políticas de Row Level Security (RLS)

### 1.2 Planos de assinatura

| Plano | Identificador | Recursos |
|-------|---------------|----------|
| Basic | `"Basic"` | Monitor, cancelamento, alunos, turmas, portões, anos letivos, import CSV, telão TV com áudio |
| Premium | `"Premium"` | Basic + whitelabel (logo/cores), dark mode, relatórios (placeholder) |
| Diamond | `"Diamond"` | Premium + API key, idioma, fleet (placeholder) |
| Trial | `"Trial (Teste 14 dias)"` | Selecionável no admin; sem lógica de expiração automática |

Plano legado `"Pro"` é automaticamente convertido para `"Basic"`.

### 1.3 Status da instituição

- Valores: `"Ativo"` | `"Inativo"`
- Super Admin pode suspender/reativar via toggle
- Regra em evolução: status `Inativo` impede operações administrativas do tenant

### 1.4 Nome da instituição

- Obrigatório no cadastro e na edição quando o campo `name` é enviado
- Espaços laterais são removidos (`trim`) antes de persistir
- Nome vazio ou composto só por espaços não é salvo — `schoolService.saveSchool` retorna `null`
- `public.schools.name` é `NOT NULL` e `UNIQUE` (`schools_name_unique`)
- Se já existir outra instituição com o mesmo nome, o salvamento é impedido com feedback visual de duplicidade
- Alterar somente o plano preservando o nome persiste com sucesso

---

## 2. Autenticação, Identidade e Sessão

Contrato vigente: [autenticacao.md](autenticacao.md).

### 2.1 Platform Admin

- Autoridade soberana de plataforma: RPC `is_platform_admin()`, separada de `school_members`
- Destino pós-login: `/admin/institutions`
- Não é tenant de escola e não abre `/painel` diretamente por esse papel
- Logout encerra a sessão do Supabase Auth

### 2.2 Usuário de escola

- Identidade: Supabase Auth (`auth.uid()`)
- Autorização do tenant: membership ativa em `school_members`
- Zero memberships ativas: sem contexto de escola; painel não abre
- Uma membership ativa: contexto resolvido automaticamente
- Várias memberships ativas: seleção explícita entre as escolas autorizadas
- `@SmartExit:loggedSchool` e `localStorage` não autorizam acesso

### 2.3 Recuperação e Gestão de Senhas

- **Solicitação de Redefinição (`/forgot-password`):**
  - O usuário informa o e-mail cadastrado.
  - O serviço `authService.resetPasswordForEmail` dispara e-mail com link de recuperação via Supabase Auth / SMTP relay (Brevo).
  - **Mitigação de enumeração:** A interface exibe confirmação neutra de envio independentemente de o e-mail existir ou não na base.
- **Redefinição de Senha (`/update-password`):**
  - O token de recuperação possui TTL limitado (configurado no Supabase Auth, tipicamente 1 hora).
  - Acesso direto sem token válido redireciona para login.
  - Ao submeter a nova senha via `authService.updatePassword`, a credencial é atualizada e o token de recuperação é invalidado (uso único).
- **Visualização de Senha:** O componente `PasswordInput` permite alternar visibilidade de caracteres no login e na redefinição.

---

## 3. Impersonation User-Level (Suporte Técnico)

Regras arquiteturais e operacionais consolidadas na [ADR-029](./adr/0029-impersonation-user-level-jwt.md):

### 3.1 Autorização e Iniciação
- Somente usuários com `is_platform_admin() = true` podem iniciar impersonation. Chamadores comuns ou tokens forjados recebem `HTTP 403 Forbidden` / Erro `42501`.
- Toda sessão de suporte exige justificativa explícita (`reason`) com **mínimo de 5 caracteres** úteis (`length(trim(reason)) >= 5`).

### 3.2 Token e Ciclo de Vida
- A Edge Function `impersonate-user` emite token JWT manual assinado com `HS256` contendo as claims do usuário-alvo e `role: 'authenticated'`.
- **TTL Estrito:** O token possui expiração máxima de **45 minutos** (2700 segundos), sem possibilidade de renovação automática.
- **Sentinela Anti-Refresh:** A resposta retorna `refresh_token: 'impersonation_no_refresh'`, impedindo que o GoTrue renove a sessão.
- **Controle no Client:** O cliente executa compulsoriamente `supabase.auth.stopAutoRefresh()` ao entrar em impersonation e exibe o `SupportBanner` com timer regressivo.

### 3.3 Auditoria Imutável
- Cada sessão grava snapshot em `public.impersonation_audit_logs`:
  - `super_admin_id`: Platform Admin executor;
  - `target_user_id`: Usuário-alvo;
  - `target_user_email` e `target_user_name`: Snapshots imutáveis capturados no momento do início;
  - `reason`: Justificativa do chamado;
  - `started_at`: Timestamp de início (`now()`);
  - `ended_at`: Timestamp de encerramento (`ended_at >= started_at`).
- Usuários comuns e tokens de impersonation não possuem privilégios de `INSERT`, `UPDATE` ou `DELETE` na tabela de auditoria.

### 3.4 Não-Escalonamento de Privilégio
- O token de impersonation **não concede privilégios de Platform Admin**:
  - Consulta a `public.platform_admins` retorna 0 linhas via RLS.
  - Invocação da RPC `public.list_platform_users` falha com Erro `42501`.
- O isolamento RLS do tenant do usuário-alvo permanece 100% ativo: o operador só visualiza e manipula dados da escola autorizada para a conta suportada.

### 3.5 Encerramento e Restauração
- Ao clicar em "Voltar para Super Admin" ou ao expirar o tempo de 45 minutos:
  - A Edge Function `end-impersonation` registra `ended_at = now()`.
  - O cliente restaura a sessão original do admin salva em `sessionStorage`.
  - O cliente executa `supabase.auth.startAutoRefresh()` e limpa caches de tela.

---

## 4. Anos Letivos Configuráveis

Regras introduzidas na Migration 0020 e no serviço `schoolYearService`:

### 4.1 Cadastro e Estrutura
- Cada tenant escolar gerencia seus próprios anos letivos na tabela `public.school_years`.
- Campos obrigatórios: `school_id`, `name` (ex.: "Ano Letivo 2026"), `start_date` e `end_date`.
- Validação temporal: `end_date >= start_date`.
- Não é permitida sobreposição incoerente de intervalos de datas para o mesmo tenant.

### 4.2 Unicidade do Ano Letivo Ativo
- Uma escola pode ter múltiplos anos letivos cadastrados (históricos ou futuros), mas **exatamente um ano pode estar ativo** por vez (`is_active = true`).
- A unicidade é garantida a nível de banco por índice parcial exclusivo (`school_years_one_active_per_school`).

### 4.3 Alternância Atômica
- A ativação de um ano letivo ocorre exclusivamente via RPC `public.activate_school_year(p_school_year_id)`.
- A RPC desativa atômica e transacionalmente o ano letivo anterior e ativa o novo ano selecionado na mesma operação, prevenindo concorrência.

### 4.4 Vinculação Acadêmica
- Turmas (`academic_groups`) e matrículas de alunos (`student_enrollments`) são vinculadas formalmente ao `school_year_id`.
- Operações de saída de alunos no monitor filtram e validam matrículas pertencentes ao ano letivo ativo da escola.

---

## 5. Fluxo de Saída de Alunos e Chamadas

A fonte soberana da fila operacional é `public.pickup_events`.

### 5.1 Pré-requisitos para Chamada
1. O aluno deve estar ativo, vinculado a matrícula válida no ano letivo ativo (`student.enrollmentId`).
2. Deve existir ao menos um portão ativo em `public.gates` para a escola.
3. A matrícula não pode ter chamada ativa em andamento (`status = 'called'`), garantido pelo índice único `pickup_events_active_enrollment_unique`.

### 5.2 Registro e Fila de Chamada
- O operador seleciona o portão de saída (`gate_id`) e aciona a chamada.
- O evento nasce com `status = 'called'` e timestamp `called_at = now()`.
- O aluno chamado sai imediatamente da lista de disponíveis do painel e ingressa na fila ativa.

### 5.3 Cancelamento Operacional de Chamadas
- O operador pode cancelar uma chamada acionada por engano através do botão de cancelamento na fila.
- A ação abre modal exigindo confirmação e motivo.
- O serviço `pickupService.cancelCall` atualiza atômica e permanentemente o evento:
  - `status`: de `'called'` para `'cancelled'`;
  - `cancelled_at`: gravado com o timestamp atual;
  - `cancellation_reason`: motivo informado pelo operador.
- **Transição irreversível:** Um evento cancelado não pode ser reaberto.
- O aluno é imediatamente liberado na lista de disponíveis para nova chamada se necessário.

### 5.4 Confirmação de Saída
- Quando o aluno é entregue ao responsável no portão, o operador aciona "Confirmar Saída".
- O status é atualizado para `completed` com gravação de `completed_at`.
- O evento sai da fila ativa e permanece no banco para fins históricos e de auditoria.

### 5.5 Telão e Áudio Inteligente (TV `/tv`)
- A rota `/tv` consome os eventos com `status = 'called'` ordenados por `called_at`.
- Polling operacional sincroniza o estado da fila a cada 5 segundos.
- **Anúncio Sonoro Automatizado:**
  - Ao identificar nova chamada na fila, o telão dispara um Chime melódico harmônico em duas frequências (Web Audio API).
  - Em seguida, executa síntese de voz nativa (Web Speech API) vocalizando o nome do aluno e o portão de destino.
  - Controle de fila sequencial e debounce garantem que chamadas simultâneas não colidam seus áudios.

---

## 6. Gestão de turmas e estrutura acadêmica

### 6.1 Cadastro e Níveis
- Organização em níveis educacionais (`academic_levels`) e turmas/grupos (`academic_groups`).
- Campos obrigatórios: `name`, `school_id`, `school_year_id`.
- Turmas possuem portão de saída padrão configurável (`defaultExit`), que propaga como sugestão para os alunos vinculados.

### 6.2 Edição e Propagação
- Renomear uma turma propaga o nome para a listagem dos alunos ativos daquela turma.
- Exclusão de turma remove o agrupamento mas preserva o cadastro do aluno.

---

## 7. Gestão de alunos e matrículas

### 7.1 Cadastro
- Obrigatório: nome do aluno e vínculo com turma/ano letivo ativo.
- Matrícula formalizada na tabela `student_enrollments`.
- Alocação na turma registrada em `student_group_assignments`.

### 7.2 Edição em Massa
- O painel disponibiliza seleção múltipla de alunos via checkbox para alteração em lote de turma ou portão de saída.

### 7.3 Duplicatas
- Cadastro manual permite homônimos (nomes repetidos).
- Importação via CSV detecta e bloqueia duplicatas de alunos no mesmo arquivo.

---

## 8. Gestão de portões

`public.gates` é a fonte de verdade dos portões escolares (`gateService`).
- O operador cadastra os portões físicos da unidade (ex.: "Portão Principal", "Portão Infantil").
- Cada portão possui nome, status (`active` / `inactive`) e horários opcionais de operação.
- A exclusão ou inativação de um portão impede que novas chamadas sejam direcionadas a ele.

---

## 9. Importação de dados (CSV)

- Formato aceito: arquivos `.csv` com encoding `windows-1252` ou `utf-8`.
- Colunas esperadas: `Nome`, `Turma`.
- Turmas não cadastradas são criadas automaticamente vinculadas ao ano letivo ativo.
- Relatório visual de importação apresenta a contagem de registros adicionados e ignorados.

---

## 10. Whitelabel e personalização

- **Plano Basic:** Identidade institucional padrão (AllTech Solutions), cores padrão, dark mode bloqueado.
- **Planos Premium e Diamond:**
  - Upload de logotipo personalizado da escola;
  - Cores customizadas (primária e secundária) aplicadas no painel e no telão;
  - Suporte completo a Dark Mode nativo.

---

## 11. Segurança e integridade de dados

| Regra / Invariante | Mecanismo de Garantia |
|---|---|
| **Isolamento Multi-Tenant** | Row Level Security (RLS) compulsório em todas as tabelas com filtro por `school_id` resolvido via `school_members` |
| **Proteção de Privilégios Destrutivos** | Migration 0021 revogou `TRUNCATE` de todas as tabelas para a role `authenticated` |
| **Controle de Acesso de Plataforma** | Validação por RPC `public.is_platform_admin()` tanto no banco quanto nos route guards do React |
| **Imutabilidade de Auditoria** | Tabela `impersonation_audit_logs` restrita a manipulação pelas Edge Functions de sistema |
| **Anti-Renovação de Sessão de Suporte** | Sentinela `impersonation_no_refresh` e `stopAutoRefresh()` no cliente |
| **Unicidade de Chamada Ativa** | Constraint de banco impede mais de uma chamada ativa por matrícula simultaneamente |
