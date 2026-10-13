# API & Contratos de Comunicação — Smart Exit School

## Visão Geral

O Smart Exit School não possui uma API REST monolítica tradicional exposta a terceiros. Em vez disso, a comunicação do sistema organiza-se em três pilares de integração:

1. **Supabase PostgREST (via Camada DAL):** comunicação relacional direta e protegida por Row Level Security (RLS) com as tabelas de domínio (`schools`, `school_years`, `gates`, `students`, `pickup_events`, etc.).
2. **Serverless Edge Functions (Deno 2):** endpoints HTTP dedicados a operações sensíveis e com privilégios de plataforma (cunhagem de JWT e encerramento de auditoria de impersonation).
3. **Supabase Auth & RPCs:** gestão de sessões corporativas e funções remotas de banco para autorização e operações transacionais atômicas.

---

## 1. Serverless Edge Functions (Endpoints HTTP)

Hospedadas na infraestrutura serverless do Supabase e executadas sob o runtime **Deno 2**.

### 1.1. Iniciar Impersonation (`impersonate-user`)

Permite que um Super Admin autenticado gere um token temporário de suporte para operar em nome de um usuário escolar específico.

* **Rota:** `POST /functions/v1/impersonate-user`
* **Autenticação:** Obrigatória via cabeçalho `Authorization: Bearer <token_do_platform_admin>`.
* **Headers:**
  ```http
  Authorization: Bearer <caller_access_token>
  Content-Type: application/json
  ```
* **Payload da Requisição:**
  ```json
  {
    "target_user_id": "00000000-0000-0000-0000-000000000000",
    "reason": "Atendimento de suporte técnico ao chamado #412",
    "school_id": "11111111-1111-1111-1111-111111111111"
  }
  ```
* **Regras de Validação:**
  * O chamador deve retornar `true` na RPC `public.is_platform_admin()`.
  * `target_user_id` é obrigatório e deve existir no banco.
  * `reason` é obrigatório e deve conter no mínimo 5 caracteres (sem espaços em branco).
* **Respostas:**
  * `200 OK`:
    ```json
    {
      "success": true,
      "access_token": "<jwt_manual_assinado>",
      "refresh_token": "impersonation_no_refresh",
      "expires_in": 2700,
      "token_type": "bearer",
      "target_user": {
        "id": "00000000-0000-0000-0000-000000000000",
        "email": "usuario@escola.com.br",
        "name": "Nome do Usuário"
      },
      "impersonation_log_id": "22222222-2222-2222-2222-222222222222"
    }
    ```
  * `400 Bad Request`: `Missing target_user_id in request body` ou `Reason must be at least 5 characters`.
  * `401 Unauthorized`: Cabeçalho Authorization ausente ou token inválido/expirado.
  * `403 Forbidden`: `Forbidden: caller is not a platform admin`.
  * `404 Not Found`: Usuário alvo não encontrado.
* **Claims Cunhadas no JWT:**
  * `sub`: UUID do usuário alvo
  * `role`: `'authenticated'`
  * `aud`: `'authenticated'`
  * `email`: E-mail do usuário alvo
  * `exp`: Timestamp Unix atual + 2700 segundos (45 minutos)
  * `impersonated`: `true`
  * `impersonated_by`: UUID do Super Admin chamador
  * `impersonation_log_id`: UUID do registro criado em `impersonation_audit_logs`

---

### 1.2. Encerrar Impersonation (`end-impersonation`)

Atualiza o registro de auditoria gravando o timestamp de encerramento (`ended_at`).

* **Rota:** `POST /functions/v1/end-impersonation`
* **Autenticação:** Obrigatória via cabeçalho `Authorization: Bearer <token>`. O chamador deve ser um Platform Admin ou possuir o token da sessão impersonada correspondente.
* **Payload da Requisição:**
  ```json
  {
    "impersonation_log_id": "22222222-2222-2222-2222-222222222222"
  }
  ```
* **Respostas:**
  * `200 OK`:
    ```json
    {
      "success": true,
      "ended_at": "2026-10-10T14:30:00.000Z"
    }
    ```
  * `400 Bad Request`: `Missing impersonation_log_id in request body`.
  * `401 Unauthorized`: Token ausente ou inválido.
  * `403 Forbidden`: Chamador não autorizado a encerrar este log.
  * `404 Not Found`: Log não encontrado ou já encerrado.

---

---

### 1.3. Convidar Membro Escolar (`invite-member`)

Gera convite criptográfico com TTL de 7 dias e despacha e-mail transacional via Brevo.

* **Rota:** `POST /functions/v1/invite-member`
* **Autenticação:** Obrigatória via cabeçalho `Authorization: Bearer <token>` de Platform Admin ou gestor da escola (`owner` / `administrator`).
* **Payload da Requisição:**
  ```json
  {
    "school_id": "11111111-1111-1111-1111-111111111111",
    "email": "professor@escola.com.br",
    "role_id": "33333333-3333-3333-3333-333333333333"
  }
  ```
* **Respostas:**
  * `200 OK`: `{"success": true, "invitation_id": "uuid"}`
  * `400 Bad Request`: `Invalid email` ou `Role not found`.
  * `403 Forbidden`: Chamador não tem autoridade sobre o tenant.

---

### 1.4. Validar e Confirmar Convite (`accept-invite`)

Valida metadados do token na abertura de `/accept-invite` e efetiva o aceite do novo membro.

* **Rota:** `POST /functions/v1/accept-invite`
* **Ações suportadas no body:**
  * `{"action": "validate", "token": "<raw_token>"}`: Valida token e retorna escola e e-mail mascarado sem mutação.
  * `{"action": "confirm", "token": "<raw_token>", "password": "<nova_senha>", "full_name": "<nome>"}`: Cadastra ou vincula credencial e executa RPC `accept_school_invitation`.

---

## 2. Remote Procedure Calls (RPCs no PostgREST)

Funções armazenadas em banco acessíveis via SDK do Supabase (`supabase.rpc('nome_funcao', params)`):

| RPC | Parâmetros | Autorização | Retorno / Finalidade |
|---|---|---|---|
| `public.is_platform_admin()` | Nenhum | `authenticated`, `anon` | `boolean`: Retorna `true` se o `auth.uid()` constar na tabela `public.platform_admins`. |
| `public.list_platform_users` | `p_search text`<br>`p_school_id uuid`<br>`p_limit integer`<br>`p_offset integer` | Platform Admin exclusivo (`is_platform_admin() = true`) | `Table`: Listagem agregada de usuários da plataforma (id, email, full_name, escola, role, status). Rejeitado com erro SQL `42501` se invocado por usuário comum. |
| `public.accept_school_invitation` | `p_token text`<br>`p_user_id uuid`<br>`p_user_name text` | `authenticated`, `anon`, `service_role` | `Table`: Valida sob lock `FOR UPDATE` o hash do token em `school_invitations`, cria o vínculo ativo em `school_members` e marca o convite como `accepted`. |
| `public.archive_old_pickup_events` | `p_older_than interval` (default `30 days`)<br>`p_batch_limit integer` (default 5000)<br>`p_school_id uuid` (opcional) | **Restrita exclusivamente a `service_role` e `postgres`** | `Table (archived_count integer)`: Transfere atomicamente eventos `completed` ou `cancelled` mais antigos que o intervalo de retenção de `pickup_events` para `pickup_events_archive` via CTE com `FOR UPDATE SKIP LOCKED`. Chamadas ativas `called` nunca são afetadas. |
| `public.activate_school_year` | `p_year_id uuid`<br>`p_school_id uuid` | `authenticated`, `service_role` | `public.school_years`: Executa transação atômica que desativa o ano letivo ativo vigente e ativa o ano especificado sob lock `FOR UPDATE`. Elimina o risco de estados intermediários com zero anos ativos. |

---

### 2.1. RPC: Ativação Atômica de Ano Letivo (`activate_school_year`)

Alterna atomicamente o ano letivo ativo de uma escola em uma única transação PostgreSQL. Garante que nunca ocorra a condição de corrida em que uma escola fique temporariamente sem nenhum ano ativo caso uma falha de rede ocorra entre o update de desativação e o de ativação.

* **Endpoint PostgREST:** `POST /rest/v1/rpc/activate_school_year`
* **Assinatura SQL:** `activate_school_year(p_year_id uuid, p_school_id uuid) RETURNS public.school_years`
* **Permissões:** Concedido `EXECUTE` para `authenticated` e `service_role`. Protegido por RLS em `school_years` (o chamador deve ser membro ativo do tenant).
* **Parâmetros:**
  * `p_year_id` (uuid, obrigatório): ID do ano letivo a ser ativado.
  * `p_school_id` (uuid, obrigatório): ID da escola detentora do ano letivo.
* **Comportamento Transacional:**
  1. Adquire bloqueio exclusivo de linha via `SELECT ... FOR UPDATE` sobre o registro do ano alvo em `public.school_years`.
  2. Valida se o ano pertence à escola indicada (dispara exceção caso não exista).
  3. Desativa atomicamente qualquer outro ano ativo existente para aquela escola: `UPDATE public.school_years SET is_active = false WHERE school_id = p_school_id AND id <> p_year_id AND is_active = true`.
  4. Ativa o ano alvo: `UPDATE public.school_years SET is_active = true WHERE id = p_year_id AND school_id = p_school_id RETURNING *`.
* **Chamada via Supabase JS Client:**
  ```javascript
  const { data, error } = await supabase.rpc('activate_school_year', {
    p_year_id: 'e2a7b1c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c',
    p_school_id: '76f29d9f-c6fd-4561-89f8-403fef0ccb40'
  });
  ```
* **Exemplo de Request HTTP:**
  ```http
  POST /rest/v1/rpc/activate_school_year HTTP/1.1
  Host: <supabase-host>
  Authorization: Bearer <user_jwt>
  apikey: <anon_or_service_key>
  Content-Type: application/json

  {
    "p_year_id": "e2a7b1c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "p_school_id": "76f29d9f-c6fd-4561-89f8-403fef0ccb40"
  }
  ```
* **Exemplo de Resposta de Sucesso (`200 OK`):**
  ```json
  {
    "id": "e2a7b1c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "school_id": "76f29d9f-c6fd-4561-89f8-403fef0ccb40",
    "name": "2026",
    "starts_at": "2026-02-01",
    "ends_at": "2026-12-15",
    "is_active": true,
    "created_at": "2026-01-10T12:00:00Z",
    "updated_at": "2026-10-13T14:30:00Z"
  }
  ```
* **Exemplo de Resposta de Erro (`404 Not Found / 400 Bad Request`):**
  ```json
  {
    "code": "P0002",
    "details": null,
    "hint": null,
    "message": "School year e2a7b1c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c not found for school 76f29d9f-c6fd-4561-89f8-403fef0ccb40"
  }
  ```

---

### 2.2. RPC: Arquivamento de Chamadas Históricas (`archive_old_pickup_events`)

Expurga e move eventos operacionais concluídos (`completed`) ou cancelados (`cancelled`) da tabela quente `pickup_events` para a tabela fria de auditoria `pickup_events_archive` em lotes controlados com concorrência segura.

* **Endpoint PostgREST:** `POST /rest/v1/rpc/archive_old_pickup_events`
* **Assinatura SQL:** `archive_old_pickup_events(p_older_than interval DEFAULT '30 days'::interval, p_batch_limit integer DEFAULT 5000, p_school_id uuid DEFAULT NULL::uuid) RETURNS TABLE(archived_count integer)`
* **Permissões:** **Restrita exclusivamente a `service_role` e `postgres`**. Usuários `anon` ou `authenticated` recebem erro SQL `42501` (permissão negada).
* **Parâmetros:**
  * `p_older_than` (interval, padrão `'30 days'`): Janela temporal de retenção. Registros com `called_at < now() - p_older_than` são selecionados.
  * `p_batch_limit` (integer, padrão `5000`): Limite máximo de registros movimentados em uma única execução para evitar locks prolongados e exaustão de memória.
  * `p_school_id` (uuid, opcional, padrão `null`): Quando informado, restringe o arquivamento apenas aos eventos daquela instituição. Se nulo, processa globalmente todas as escolas.
* **Salvaguardas de Integridade:**
  * Eventos com status `called` (chamadas ativas em andamento) **nunca** são elegíveis para arquivamento sob nenhuma circunstância.
  * Utiliza CTE com `DELETE ... FROM pickup_events ... RETURNING *` e cláusula `FOR UPDATE SKIP LOCKED` para evitar deadlocks com a operação em tempo real.
* **Chamada via Supabase JS Client (Service Role):**
  ```javascript
  const { data, error } = await supabaseAdmin.rpc('archive_old_pickup_events', {
    p_older_than: '30 days',
    p_batch_limit: 1000,
    p_school_id: '76f29d9f-c6fd-4561-89f8-403fef0ccb40'
  });
  ```
* **Exemplo de Request HTTP:**
  ```http
  POST /rest/v1/rpc/archive_old_pickup_events HTTP/1.1
  Host: <supabase-host>
  Authorization: Bearer <service_role_key>
  apikey: <service_role_key>
  Content-Type: application/json

  {
    "p_older_than": "30 days",
    "p_batch_limit": 5000,
    "p_school_id": null
  }
  ```
* **Exemplo de Resposta de Sucesso (`200 OK`):**
  ```json
  [
    {
      "archived_count": 142
    }
  ]
  ```
* **Exemplo de Resposta de Não Autorizado (`403 Forbidden` / `42501` via JWT comum):**
  ```json
  {
    "code": "42501",
    "details": null,
    "hint": null,
    "message": "permission denied for function archive_old_pickup_events"
  }
  ```

---

## 3. Rotas HTTP de Navegação Frontend (React Router DOM)

Rotas declarativas gerenciadas no client-side com rewrite de fallback no [vercel.json](../vercel.json):

| Rota | Componente | Proteção / Autoridade | Descrição |
|------|------------|-----------------------|-----------|
| `/` | `Navigate` | Pública | Redirecionamento automático para `/login` |
| `/login` | `Login.jsx` | Pública | Tela de autenticação institucional com toggle de visualização e bloqueio de escolas inativas |
| `/forgot-password` | `ForgotPassword.jsx` | Pública | Solicitação de e-mail de recuperação de senha via Brevo SMTP |
| `/update-password` | `UpdatePassword.jsx` | Pública (com token GoTrue) | Redefinição de senha do usuário autenticado por link de recuperação |
| `/admin/institutions` | `InstitutionsManager.jsx` | **Protegida por `usePlatformAdmin()`** | Painel do Super Admin com catálogo global e impersonation |
| `/painel` | `TenantPanelGate.jsx` | **Protegida por `TenantPanelGate`** | Painel da escola (requer membership ativa em `school_members`) |
| `/tv` | `TvDisplay.jsx` | Pública dedicada | Telão de chamadas em tempo real com anúncios visuais e sonoros |
| `/accept-invite` | `AcceptInvite.jsx` | Pública (com token na URL) | Página de validação de convite e onboarding para novos membros da escola |

---

## 4. Contratos de Persistência DAL

Toda a interação com o Supabase é encapsulada na Camada de Acesso a Dados (`src/services/` e `src/repositories/`):

### 4.1. Fila Operacional de Saída & Arquivamento (`pickupService` / `pickupArchiveService`)

| Operação | Método do DAL | Efeito no Banco |
|---|---|---|
| **Buscar Chamadas Ativas** | `pickupService.getActiveCallsBySchool(schoolId)` | Consulta registros com `status = 'called'` ordenados por `called_at DESC` com joins de aluno, turma e portão. |
| **Acionar Aluno** | `pickupService.callStudent({ schoolId, studentEnrollmentId, gateId })` | Insere evento com status inicial `called`. Protegido contra duplicidade por índice parcial único. |
| **Cancelar Chamada (C1)** | `pickupService.cancelCall(eventId, schoolId)` | Transiciona o status de `called` para `cancelled`, preenchendo o timestamp `cancelled_at` para auditoria. |
| **Filtrar e Ordenar Fila (C2)** | `pickupCallFilter.filterAndSortCalls(calls, filters)` | Módulo determinístico client-side para filtragem multidimensional por portão, turma e busca de aluno. |
| **Concluir Saída** | `pickupService.completeCall(eventId, schoolId)` | Atualiza o evento para `completed` e preenche `completed_at`. |
| **Expurgo e Arquivamento (C3)** | `pickupArchiveService.archiveOldEvents(options)` | Invoca a RPC `public.archive_old_pickup_events` para mover registros antigos para `pickup_events_archive` (uso administrativo). |

### 4.2. Gestão de Anos Letivos (`schoolYearService`)

* `schoolYearService.listYears(schoolId)`: recupera todos os anos letivos cadastrados para a escola.
* `schoolYearService.getActiveYear(schoolId)`: recupera o ano letivo ativo atual do tenant.
* `schoolYearService.createYear(schoolId, params)`: cadastra novo ano letivo com validação defensiva de intervalo (`starts_at <= ends_at`).
* `schoolYearService.activateYear(schoolId, id)`: aciona atomicamente a RPC `public.activate_school_year` via `schoolYearRepository.activate`, garantindo transição transacional sem lacuna de anos ativos.
