# CI — Smart Exit School

CI remoto mínimo com GitHub Actions. Arquivo: `.github/workflows/ci.yml`.

## Gates

O workflow executa, sem mascarar erros:

- **Job `lint`:** `npm run lint` (ESLint 10)
- **Job `test`:** `npm run test:unit` (241 testes unitários determinísticos)
- **Job `build`:** `npm run build` (bundle estático Vite 8)
- **Job `integration-db`:** inicialização do Supabase CLI com serviços mínimos (`db`, `rest`, `auth`, `kong`), carga de fixtures multi-tenant (`seed-multi-tenant.sql`), `npm run validate:rls` e `npm run test:integration:db` (21 testes de isolamento e RPCs)

A instalação de dependências usa `npm ci` com o lockfile `package-lock.json`.

Node.js **22.x**, alinhado a `docs/instalacao.md` (LTS 20.x ou 22.x) e ao requisito do Vite 8 no lockfile (`^20.19.0 || >=22.12.0`).

## Eventos

- Pull Requests com destino a `main`
- Pushes para `main`

## Suíte de Testes e Segregação

A suíte de testes é segregada para garantir determinismo e isolamento de runtime:

- **Suíte Unitária (`npm run test:unit`):** Executada no job `test` do CI remoto. Compreende 241 testes puros em 15 arquivos, 100% determinísticos e independentes de rede ou containers locais (~15s).
- **Suíte de Integração DB (`npm run test:integration:db`):** Executada no job `integration-db` do CI remoto e localmente. Compreende 21 testes em 2 arquivos (`impersonationFoundation.test.js` e `multiTenantIsolationRuntime.test.js`) que exercitam PostgREST local, RPCs de plataforma e isolamento RLS multi-tenant real (100% PASS).
- **Validação de RLS Foundation (`npm run validate:rls`):** Executada no job `integration-db` do CI remoto e localmente. Valida 9 cenários de isolamento multi-tenant e segurança em runtime.
- **Suíte de Integração Edge (`npm run test:integration:edge`):** Compreende 36 testes em 2 arquivos (`impersonationEdgeFunctions.test.js` e `impersonationSecurityAudit.test.js`) que validam endpoints das Edge Functions e auditoria de impersonation. Possui probe transparente de conectividade e skip condicional documentado quando o Edge Runtime local está desligado (23 PASS + 13 SKIP), executando 36 PASS quando o runtime está ativo.
- **Suíte de Integração Completa (`npm run test:integration`):** Wrapper que executa `test:integration:db` e `test:integration:edge` em sequência (57 testes).
- **Suíte E2E Canônica (`npm run test:e2e`):** 8 cenários executados no Google Chrome real (`channel: 'chrome'`) via Playwright, com `headless: false` por padrão (headless sob demanda via `E2E_HEADLESS=1`). Exercita os fluxos críticos de ponta a ponta com evidências salvas em vídeo (`.webm`) e screenshots (`.png`) em `test-results/`.
- **Suíte Completa Local (`npm test`):** Executa a suíte combinada unitária e de integração locais (298 testes).

### Arquitetura do Job `integration-db` no CI Remoto
O job `integration-db` utiliza a action oficial `supabase/setup-cli@v1` no GitHub Actions:
1. Inicializa apenas os containers essenciais via `supabase start -x analytics,edge-runtime,functions,imgproxy,inbucket,realtime,storage,studio,vector`, aplicando automaticamente as 28 migrations;
2. Injeta as fixtures multi-tenant via `docker exec -i supabase_db_smart-exit-school psql -U postgres -d postgres < supabase/seed-multi-tenant.sql`;
3. Executa `npm run validate:rls` e `npm run test:integration:db` validando PostgREST, RLS e RPCs de impersonation de forma determinística no pipeline remoto.

### Por que Edge e E2E permanecem locais pré-PR?
A suíte de Edge Functions (`test:integration:edge`) e os cenários E2E com navegador real dependem do Edge Runtime e de ambiente gráfico/Playwright. Para manter o feedback loop do pipeline equilibrado e evitar flakiness de rede ou de runtime externo, esses testes são executados localmente antes da abertura de Pull Requests (ou em workflows dedicados de smoke).

### Instruções para Execução Local Pré-PR
Antes de abrir qualquer Pull Request com destino a `main`:

```bash
# 1. Certifique-se de que os containers do Supabase local estão ativos
npx supabase start

# 2. Carregar fixtures multi-tenant no banco local (se ainda não carregadas)
Get-Content supabase/seed-multi-tenant.sql -Raw | docker exec -i supabase_db_smart-exit-school psql -U postgres -d postgres

# 3. Executar verificações de RLS e qualidade
npm run validate:rls
npm run audit:db

# 4. Executar suítes de integração e E2E
npm run test:integration
npm run test:e2e
```

## Limitações

- O CI remoto valida lint, testes unitários, build estático do frontend e **testes de integração de banco de dados/RLS em instância efêmera do Supabase CLI**; ele não valida nem garante a aplicação direta de migrations no Supabase Cloud ou a publicação de Edge Functions.
- A paridade entre frontend, banco e Edge Functions em produção é governada compulsoriamente pela [Regra de Deploy Parity](./deploy-parity.md) e pelo hook `PreToolUse` do Google Antigravity (`.agents/hooks.json`).
- Merge continua dependente de **revisão e autorização humana explícita**. Checks remotos não autorizam merge automático.
