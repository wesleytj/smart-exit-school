# ADR-029: Impersonation User-Level com JWT Manual

## Status
Aceito

---

## Contexto

O Smart Exit School é uma plataforma SaaS multi-tenant que atende escolas de diferentes redes. Durante operações críticas de saída escolar ou parametrizações acadêmicas, diretores, secretários e porteiros frequentemente reportam dificuldades ou comportamentos inesperados.

Anteriormente:
- Não existia mecanismo nativo para que a equipe de suporte (Super Admins) visualizasse o sistema sob a perspectiva exata de um usuário final sem solicitar credenciais de acesso (antipadrão severo de segurança).
- A ADR-028 estabeleceu a separação conceitual entre plataforma (SaaS) e tenant (escola), prevendo a necessidade de um modo seguro de personificação técnica ("Entrar como").

Para viabilizar suporte técnico operacional seguro em primeira pessoa, foi necessária uma arquitetura de personificação de usuário (*user-level impersonation*) que garantisse fidelidade visual e funcional, sem comprometer a integridade de credenciais nem permitir escalonamento de privilégios.

---

## Decisão

Adotar a **Opção B: JWT manual assinado em Edge Function** (`impersonate-user`), utilizando a chave HMAC do Supabase Auth (`SUPABASE_AUTH_JWT_SECRET` / algoritmo HS256).

O fluxo funciona da seguinte forma:
1. O Super Admin autenticado invoca a Edge Function protegida `impersonate-user`, informando o `target_user_id`, a justificativa (`reason >= 5 chars`) e opcionalmente a escola associada.
2. A Edge Function valida a autorização do chamador via RPC `public.is_platform_admin()`.
3. É gerado um registro imutável em `public.impersonation_audit_logs`.
4. A função cunha manualmente um JWT assinado válido para o PostgREST com claims padrão do usuário e claims customizadas de personificação (`impersonated: true`, `impersonated_by`, `impersonation_log_id`), com TTL estrito de 45 minutos (2700 segundos).
5. O cliente Supabase frontend armazena a sessão original do Super Admin no `sessionStorage`, substitui a sessão ativa via `supabase.auth.setSession(...)`, desativa o auto-refresh (`supabase.auth.stopAutoRefresh()`) e exibe o banner global persistente de impersonation.
6. Ao finalizar a sessão, a Edge Function `end-impersonation` registra o `ended_at`, e o frontend restaura a sessão original do Super Admin, reativa o auto-refresh e limpa todos os caches operacionais do tenant.

---

## Alternativas Consideradas

### Opção A: Magic Link (`generateLink`) — Rejeitada
- **Mecanismo:** Gerar um magic link de recuperação/login via API administrativa do GoTrue (`admin.generateLink`) e trocar o código de autorização por uma sessão oficial.
- **Motivos da rejeição:**
  - Gera sessões persistentes na tabela interna `auth.sessions` do GoTrue, poluindo a trilha de sessões reais do usuário alvo.
  - Não permite injeção atômica de claims customizadas no JWT (como `impersonated: true` e `impersonation_log_id`), impossibilitando detecção imediata no PostgREST/RLS via `auth.jwt()`.
  - Dispara efeitos colaterais e notificações potenciais ao usuário final.
  - Complexidade e latência adicionais no ciclo de handshake e retorno de sessão.

### Opção B: JWT Manual Assinado em Edge Function — Escolhida
- **Mecanismo:** A Edge Function assina diretamente o payload do usuário usando a chave criptográfica do projeto (`SUPABASE_AUTH_JWT_SECRET`).
- **Motivos da escolha:**
  - Injeção direta e garantida de claims no token (`auth.jwt()`).
  - Totalmente stateless em relação a `auth.sessions`: zero poluição da base GoTrue.
  - Trilha de auditoria 100% controlada e vinculada ao log antes da entrega do token.
  - Controle exato do tempo de vida (TTL de 45 min) e revogação imediata.

---

## Consequências

### Positivas
- **Claims Customizadas em `auth.jwt()`:** O PostgREST e as políticas de RLS têm acesso imediato a `impersonated: true`, `impersonated_by` e `impersonation_log_id`, permitindo blindagem contra auto-alterações indevidas.
- **Auditoria Imutável e Atômica:** Nenhum token é cunhado sem a gravação prévia de um registro em `public.impersonation_audit_logs`, preservando snapshot do e-mail e nome no instante da ação.
- **Zero Poluição em `auth.sessions`:** Sessões de suporte não concorrem com as sessões ativas do cliente nem aparecem em relatórios de auditoria padrão do GoTrue como logins voluntários.
- **Isolamento Multi-Tenant Preservado:** Como o `sub` do token aponta para o `id` do usuário alvo, o PostgREST aplica estritamente as regras de RLS do tenant correspondente, impedindo acesso a dados de outras instituições.

### Negativas e Mitigações
- **Token não renovável via refresh padrão:** Como não existe entrada em `auth.sessions`, o GoTrue rejeitaria qualquer tentativa de renovação.  
  *Mitigação:* Uso do refresh token sentinela `'impersonation_no_refresh'` e chamada explícita a `stopAutoRefresh()`.
- **TTL Fixo e Curto:** A sessão expira impreterivelmente em 45 minutos.  
  *Mitigação:* Banner de suporte exibe contagem regressiva em tempo real e alerta o operador antes da expiração.
- **Dependência do Segredo JWT:** A Edge Function necessita da secret `SUPABASE_AUTH_JWT_SECRET`.  
  *Mitigação:* Acesso restrito via ambiente Supabase Vault / Secrets nativos da plataforma.

---

## Contrato do JWT

### Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload
```json
{
  "sub": "<uuid_do_target_user>",
  "aud": "authenticated",
  "role": "authenticated",
  "email": "<target_user_email>",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {
    "name": "<target_user_name>"
  },
  "iat": 1775836800,
  "exp": 1775839500,
  "impersonated": true,
  "impersonated_by": "<uuid_do_super_admin>",
  "impersonation_log_id": "<uuid_do_log_de_auditoria>"
}
```

### Assinatura
HMAC-SHA256 (`HS256`) gerada a partir de `base64Url(header) + "." + base64Url(payload)` utilizando a chave simétrica `SUPABASE_AUTH_JWT_SECRET`.

---

## Decisão Técnica Crítica: `refresh_token: 'impersonation_no_refresh'` + `stopAutoRefresh()`

Durante a mini-auditoria técnica de GoTrue (PR #69 / PR #70), verificou-se que o SDK client `@supabase/supabase-js` monitora proativamente a expiração do token através de seu temporizador interno de renovação automática.

Se um token cunhado manualmente for injetado sem desativar o mecanismo:
1. O SDK tentaria enviar o `refresh_token` para o endpoint `/auth/v1/token?grant_type=refresh_token`.
2. Como a sessão de impersonation é propositalmente **stateless** e não existe em `auth.sessions`, a requisição retornaria erro HTTP 400 (`invalid_grant`), desconectando a sessão intempestivamente ou corrompendo o estado de autenticação.

**Padrão Arquitetural Adotado:**
- O payload de retorno da Edge Function fornece explicitamente `refresh_token: 'impersonation_no_refresh'`.
- O serviço `impersonationService.js` no cliente obrigatoriamente executa:
  ```javascript
  supabase.auth.stopAutoRefresh();
  await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  ```
- No encerramento da impersonation (`endImpersonation`), o serviço restaura a sessão original do Super Admin e executa imediatamente:
  ```javascript
  supabase.auth.startAutoRefresh();
  ```

Essa garantia bilateral elimina qualquer tentativa espúria de refresh de token enquanto a sessão de suporte estiver em andamento, assegurando operação estável durante toda a janela de 45 minutos.
