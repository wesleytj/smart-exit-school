# ADR-030: Governança de Validação de JWT nas Edge Functions de Impersonation

## Status
Aceito

---

## Contexto

A inspeção remota das Edge Functions no Supabase Cloud (`npx supabase functions list --project-ref yantfnekslrzhussewdh`) indicou que as funções `impersonate-user` (v5) e `end-impersonation` (v4) possuem a diretiva `verify_jwt: false` no gateway de API da plataforma.

A ativação indiscriminada de `verify_jwt: true` no nível de gateway do Supabase Edge Runtime bloqueia antecipadamente qualquer requisição HTTP cujo cabeçalho `Authorization: Bearer <token>` não seja um JWT emitido e assinado diretamente pelo GoTrue do projeto atual.

No ecossistema do Smart Exit School:
1. No Supabase Cloud de produção, o serviço de autenticação (GoTrue) emite tokens assinados de forma assimétrica utilizando chaves elípticas **ES256**.
2. Conforme definido na **ADR-029**, a sessão de suporte e personificação (*impersonation*) cunha um JWT efêmero próprio contendo claims customizadas (`is_impersonated: true`, `impersonator_id`, `impersonation_log_id`) assinado simetricamente via **HS256** com `SUPABASE_AUTH_JWT_SECRET`.
3. Ao finalizar a sessão de suporte (`end-impersonation`), o cliente web autenticado encontra-se temporariamente operando sob o token cunhado de personificação (HS256) ou restaurando a sessão de administrador (ES256).
4. O commit histórico `11b9458` (PR #81) corrigiu previamente uma quebra em produção decorrente da incompatibilidade entre tokens assimétricos ES256 e verificação simétrica exclusiva HS256, introduzindo uma estratégia de verificação em duas etapas (*dual verification*).

Se `verify_jwt: true` for ativado no gateway das Edge Functions:
- O gateway rejeitará requisições direcionadas a `end-impersonation` enviadas a partir da sessão ativa de suporte (pois o gateway do Cloud não valida tokens HS256 cunhados sob chave customizada quando configurado para ES256).
- O fluxo de retorno e auditoria de encerramento da personificação ficaria quebrado em produção, violando os requisitos de segurança e encerramento limpo da ADR-029.

---

## Decisão

Manter **`verify_jwt: false` no gateway** de ambas as Edge Functions (`impersonate-user` e `end-impersonation`), estabelecendo a **validação manual interna em camada de aplicação como controle compensatório estrito e auditável**.

### Controles Compensatórios Implementados

Ambas as Edge Functions implementam verificação em múltiplas barreiras no início da execução:

1. **Validação Estrutural e de Assinatura:**
   - **Tentativa 1 (HS256 Local):** A função valida o token contra `SUPABASE_JWT_SECRET` via `verifyHs256Jwt`. Caso válido e dentro do prazo de validade (`exp > now`), extrai as claims confiáveis.
   - **Tentativa 2 (Fallback GoTrue ES256):** Caso o token não seja HS256, a função delega a validação criptográfica diretamente ao servidor de autenticação do Supabase via `callerClient.auth.getUser(callerToken)`. Se o token for inválido, adulterado ou expirado, a chamada falha e retorna HTTP 401 imediatamente.

2. **Autorização Rígida de Papéis (RBAC):**
   - Em `impersonate-user`: A função exige compulsoriamente que o chamador seja Platform Admin, validado via RPC `public.is_platform_admin()`. Usuários comuns ou tokens forjados sem autorização em `public.platform_admins` recebem HTTP 403 `Forbidden`.
   - Em `end-impersonation`: A função exige que o chamador seja um Platform Admin autenticado OU que o token pertença comprovadamente à sessão impersonada correspondente (`is_impersonated === true && impersonation_log_id === payload.impersonation_log_id`).

3. **Ciclo de Vida Restrito e Auditoria Imutável:**
   - O token cunhado de impersonation possui TTL estrito de 45 minutos (2700 segundos), sem renovação contínua.
   - Cada sessão gera obrigatoriamente um registro prévio na tabela `public.impersonation_audit_logs`, contendo IP, User-Agent, justificativa textual (`reason >= 5 chars`) e identificadores do operador e do alvo.

---

## Plano de Migração Futura (Roadmap)

A transição para `verify_jwt: true` no gateway poderá ocorrer quando:
1. O Supabase disponibilizar suporte nativo a *User Impersonation* diretamente no GoTrue API, gerando tokens oficiais assinados pelo par de chaves do projeto.
2. Ou quando a arquitetura de suporte migrar a assinatura de tokens locais para a chave assimétrica privada do projeto, compatível com a verificação de chave pública no gateway.

Até que esse suporte nativo esteja disponível, o controle em camada de aplicação permanece como a arquitetura mais segura, auditável e resiliente para o produto.
