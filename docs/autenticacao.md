# Autenticação — Smart Exit School

A identidade do usuário é a sessão do Supabase Auth ([ADR-004](./arquitetura/decisoes.md#adr-004-identidade-e-autenticacao-via-supabase-auth)). O identificador usado pela aplicação é `auth.uid()`. `public.schools` representa a organização e não guarda credencial ([ADR-005](./arquitetura/decisoes.md#adr-005-representacao-de-escola-em-publicschools)). `public.profiles` não carrega `school_id` ([ADR-007](./arquitetura/decisoes.md#adr-007-perfil-de-usuario-em-publicprofiles)). A autorização do tenant não é lida de `profiles`.

```text
Supabase Auth
    ↓
auth.uid()
    ↓
school_members.profile_id
    ↓
active membership
    ↓
school_id
    ↓
schools
    ↓
tenant context
    ↓
tenant-aware application
    ↓
RLS
```

Platform Admin não é tenant de escola:

```text
Platform Admin
    ↓
is_platform_admin()
    ↓
/admin/institutions
```

---

## Três Contextos de Identidade

A arquitetura do Smart Exit School reconhece e isola três contextos distintos de sessão:

| Contexto | Origem & Mecanismo | Ciclo de Vida & Refresh | Escopo de Acesso |
|---|---|---|---|
| **1. Sessão Autenticada Normal** | Supabase Auth via credenciais do usuário (`signInWithPassword`) | Renovável via GoTrue `refresh_token`; `autoRefreshToken = true` | Resolvido via `school_members` para operador de escola, ou `/admin/institutions` para Platform Admin |
| **2. Sessão de Suporte (Impersonation)** | Edge Function `impersonate-user` (JWT manual HS256 assinado com a secret da plataforma) | **Não renovável**; sentinela `impersonation_no_refresh`; `stopAutoRefresh()`; TTL estrito de 45 min | Assume em primeira pessoa a identidade do operador-alvo com isolamento RLS do tenant; banner visual no topo |
| **3. Sessão de Recuperação de Senha** | Token temporário via link enviado por e-mail (`resetPasswordForEmail`) | Temporária, restrita ao fluxo de redefinição de credenciais | Redireciona para `/update-password` para invocação de `updatePassword()`; sem acesso aos painéis de tenant até conclusão |

---

## Usuário de escola

`school_members` é a fonte de autorização do tenant. A membership precisa estar ativa. A escola autorizada é `school_members.school_id` da linha ativa cujo `profile_id` é o `auth.uid()` da sessão, e somente se a RLS também devolver essa escola.

| Situação | Comportamento |
|---|---|
| Sem sessão | `/painel` volta para `/login`. Não há contexto de tenant. |
| Sessão e zero memberships ativas | O usuário não recebe contexto de escola. O painel não abre. A sessão de operador é encerrada. |
| Uma membership ativa | O contexto é resolvido automaticamente e o painel abre. |
| Várias memberships ativas | A seleção é explícita, somente entre memberships autorizadas. Um id fora dessa lista não vira contexto. |

A escolha entre várias escolas fica na memória da interface e é revalidada com nova leitura de membership. Ela não é gravada em `profiles`.

Logout encerra a sessão do Supabase Auth (`supabase.auth.signOut()`) e limpa caches de sessão locais.

---

## Platform Admin

Platform Admin e usuário de escola são domínios rigorosamente separados ([ADR-028](./arquitetura/decisoes.md#adr-028-separacao-entre-platform-admin-e-dominio-operacional-de-escola)).

- A autoridade de plataforma é a RPC `is_platform_admin()`, não `school_members`.
- O fluxo oficial de Platform Admin é `/admin/institutions`.
- `is_platform_admin()` não concede acesso direto ao painel de escola sem impersonation.
- Membership ativa não concede privilégio de plataforma.
- Em `/painel`, a autoridade de plataforma é resolvida antes do contexto tenant. Se ela estiver presente, a rota vai para `/admin/institutions` e o painel de escola não é montado, mesmo que existam memberships.

---

## Impersonation User-Level (Suporte Técnico)

A funcionalidade de **Impersonation User-Level** ("Entrar como usuário") permite que um Platform Admin acesse temporariamente a conta de um usuário-alvo em "primeira pessoa" para fins de diagnóstico e suporte técnico operacional, sem necessidade de compartilhar, solicitar ou alterar as credenciais reais do usuário ([ADR-029](./adr/0029-impersonation-user-level-jwt.md)).

```text
[Platform Admin em /admin/institutions]
         │
         │ 1. Seleciona usuário no catálogo (RPC list_platform_users)
         │ 2. Preenche justificativa de suporte (mínimo 5 caracteres)
         ▼
[Edge Function: impersonate-user]
         │
         │ 3. Valida autoridade via public.is_platform_admin() (HTTP 403 / 42501 se não-admin)
         │ 4. Cria registro em public.impersonation_audit_logs (started_at = now())
         │ 5. Assina JWT manual HS256 com claims customizadas e expiração de +45 minutos
         ▼
[Frontend: Sessão de Impersonation Ativa]
         │
         │ 6. Salva sessão do admin em sessionStorage ("ses_admin_session_backup")
         │ 7. Invoca supabase.auth.stopAutoRefresh() (bloqueia renovação GoTrue)
         │ 8. Injeta token com supabase.auth.setSession() usando refresh sentinela
         │ 9. Limpa caches locais de escolas e exibe Banner persistente com timer regressivo
         ▼
[Restauração / Encerramento]
         │
         │ 10. Admin clica em "Voltar para Super Admin" ou token expira (45 min)
         │ 11. Edge Function end-impersonation registra ended_at = now()
         │ 12. Frontend restaura sessão de admin e reinicia supabase.auth.startAutoRefresh()
```

### Especificação Técnica do Token e Contrato

- **Autorização:** Apenas chamadores que possuem `is_platform_admin() = true`. Usuários comuns que tentarem chamar a Edge Function recebem `HTTP 403 Forbidden`.
- **Assinatura & Algoritmo:** Token JWT manual assinado com `HS256` utilizando a secret do Supabase (`SUPABASE_JWT_SECRET`).
- **Claims Customizadas:**
  - `sub`: ID do usuário-alvo (`target_user_id`);
  - `role`: `'authenticated'`;
  - `is_impersonated`: `true`;
  - `impersonator_id`: ID do Platform Admin;
  - `impersonation_log_id`: UUID do registro de auditoria criado;
  - `exp`: Timestamp Unix correspondente a 45 minutos (2700 segundos) a partir da emissão.
- **Sentinela Anti-Refresh:** A resposta retorna `refresh_token: 'impersonation_no_refresh'`. O token é intencionalmente não renovável pelo GoTrue.
- **Controle de SDK no Cliente:** O cliente chama compulsoriamente `supabase.auth.stopAutoRefresh()` ao entrar no modo de impersonation e `supabase.auth.startAutoRefresh()` ao restaurar a sessão do Platform Admin.
- **Auditoria Imutável:** O início e encerramento gravam snapshots imutáveis em `public.impersonation_audit_logs` (`super_admin_id`, `target_user_id`, `target_user_email`, `target_user_name`, `reason`, `started_at`, `ended_at`).

Para detalhes operacionais passo a passo, consulte o [Guia de Operação: Fluxo de Suporte Técnico via Impersonation User-Level](./impersonation-support-flow.md).

---

## Fluxos de Senha e Recuperação

A autenticação do Smart Exit School inclui recuperação de credenciais e utilitários visuais de acessibilidade:

### 1. Solicitação de Redefinição (`/forgot-password`)
- Rota pública acessível pelo link "Esqueceu sua senha?" na tela de login.
- O usuário insere seu e-mail e clica em enviar.
- O serviço `authService.resetPasswordForEmail(email)` aciona o Supabase Auth com URL de redirecionamento configurada para `/update-password`.
- **Proteção contra enumeração de usuários:** Por diretriz de segurança, a interface exibe confirmação neutra de envio independentemente de o e-mail estar ou não cadastrado no banco.

### 2. Atualização de Senha (`/update-password`)
- Rota acessada quando o usuário abre o link recebido por e-mail com token temporário de recuperação.
- Permite informar uma nova senha (validada contra requisitos mínimos).
- Invoca `authService.updatePassword(newPassword)`, que executa `supabase.auth.updateUser({ password })`.
- Ao concluir com sucesso, exibe confirmação e redireciona o usuário para `/login`.

### 3. Alternância de Visibilidade de Senha (`PasswordInput`)
- Componente de formulário reutilizável que inclui botão de alternância (Eye / EyeOff) para exibir ou ocultar caracteres da senha.
- Implementado em `/login` e `/update-password`.

---

## Estado local

`localStorage` não é autoridade. `@SmartExit:loggedSchool` não autoriza acesso e não escolhe o tenant.

Alunos, turmas e chamadas do painel operam no banco Supabase (`public.students`, `public.academic_groups`, `public.pickup_events`), com `localStorage` atuando apenas como cache temporário de interface cross-tab. Portões persistidos residem em `public.gates`. Caches locais nunca sobrepõem permissões e são limpos na transição de impersonation.

---

## Segurança

- RLS no PostgreSQL continua sendo a autoridade máxima e soberana do sistema.
- Impersonation opera sob estrita auditoria, com token não renovável, TTL de 45 minutos e isolamento RLS preservado.
- Não existe bypass de autorização por `localStorage`.
- Não existe provisioning automático de membership sem intervenção administrativa.
- Não existe uso de `service_role` no código do cliente frontend.
- Rota `/admin/institutions` é inacessível para operadores de escola e bloqueia tokens de impersonation via verificação de privilégio de plataforma.
