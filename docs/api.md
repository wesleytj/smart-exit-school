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

## 2. Remote Procedure Calls (RPCs no PostgREST)

Funções armazenadas em banco acessíveis via SDK do Supabase (`supabase.rpc('nome_funcao', params)`):

| RPC | Parâmetros | Autorização | Retorno / Finalidade |
|---|---|---|---|
| `public.is_platform_admin()` | Nenhum | `authenticated` | `boolean`: Retorna `true` se o `auth.uid()` constar na tabela `public.platform_admins`. |
| `public.list_platform_users` | `search_term text`<br>`school_filter uuid`<br>`role_filter text` | Platform Admin exclusivo (`is_platform_admin() = true`) | `Table`: Listagem agregada de usuários da plataforma (id, email, full_name, escola, role, status). Rejeitado com erro SQL `42501` se invocado por usuário comum. |
| `public.activate_school_year` | `p_school_id uuid`<br>`p_school_year_id uuid` | Membro da escola com permissão | `void`: Desativa atomicamente os demais anos letivos da escola e marca o ano indicado como `is_active = true`. |

---

## 3. Rotas HTTP de Navegação Frontend (React Router DOM)

Rotas declarativas gerenciadas no client-side com rewrite de fallback no [vercel.json](../vercel.json):

| Rota | Componente | Proteção / Autoridade | Descrição |
|------|------------|-----------------------|-----------|
| `/` | `Navigate` | Pública | Redirecionamento automático para `/login` |
| `/login` | `Login.jsx` | Pública | Tela de autenticação com toggle de visualização de senha |
| `/recuperar-senha` | `ForgotPassword.jsx` | Pública | Solicitação de e-mail de recuperação de senha via Brevo SMTP |
| `/redefinir-senha` | `UpdatePassword.jsx` | Pública (com token) | Redefinição de senha do usuário autenticado por link de recuperação |
| `/admin/institutions` | `InstitutionsManager.jsx` | **Protegida por `usePlatformAdmin()`** | Painel do Super Admin com catálogo global e impersonation |
| `/painel` | `TenantPanelGate.jsx` | **Protegida por `TenantPanelGate`** | Painel da escola (requer membership ativa em `school_members`) |
| `/tv` | `TvDisplay.jsx` | Pública dedicada | Telão de chamadas em tempo real com anúncios visuais e sonoros |

---

## 4. Contratos de Persistência DAL

Toda a interação com o Supabase é encapsulada na Camada de Acesso a Dados (`src/services/` e `src/repositories/`):

### 4.1. Fila Operacional de Saída (`public.pickup_events`)

| Operação | Método do DAL | Efeito no Banco |
|---|---|---|
| **Buscar Chamadas Ativas** | `pickupService.getActiveCallsBySchool(schoolId)` | Consulta registros com `status = 'called'` ordenados por `called_at DESC` com joins de aluno, turma e portão. |
| **Acionar Aluno** | `pickupService.callStudent({ schoolId, studentEnrollmentId, gateId })` | Insere evento com status inicial `called`. Protegido contra duplicidade por índice parcial único. |
| **Cancelar Chamada** | `pickupService.cancelCall(eventId, reason)` | Transiciona o status de `called` para `cancelled`, preenchendo o timestamp `cancelled_at` para auditoria. |
| **Concluir Saída** | `pickupService.completeCall(eventId)` | Atualiza o evento para `completed` e preenche `completed_at`. |

### 4.2. Gestão de Anos Letivos (`public.school_years`)

* `schoolYearService.listSchoolYears(schoolId)`: recupera todos os anos letivos cadastrados para a escola.
* `schoolYearService.activateSchoolYear(schoolId, schoolYearId)`: invoca a RPC `activate_school_year` garantindo unicidade do ano ativo por escola.
