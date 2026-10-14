# CI — Smart Exit School

CI remoto mínimo com GitHub Actions. Arquivo: `.github/workflows/ci.yml`.

## Gates

O workflow executa, sem mascarar erros:

- `npm run lint`
- `npm run test:unit`
- `npm run build`

A instalação de dependências usa `npm ci` com o lockfile `package-lock.json`.

Node.js **22.x**, alinhado a `docs/instalacao.md` (LTS 20.x ou 22.x) e ao requisito do Vite 8 no lockfile (`^20.19.0 || >=22.12.0`).

## Eventos

- Pull Requests com destino a `main`
- Pushes para `main`

## Suíte de Testes e Segregação

A suíte de testes é segregada para garantir determinismo e isolamento de runtime:

- **Suíte Unitária (`npm run test:unit`):** Executada compulsoriamente no CI remoto. Compreende 204 testes puros em 14 arquivos, 100% determinísticos e independentes de rede ou containers locais (sem necessidade de Docker ou Supabase).
- **Suíte de Integração (`npm run test:integration`):** Compreende 57 testes em 4 arquivos (`impersonationFoundation.test.js`, `impersonationEdgeFunctions.test.js`, `impersonationSecurityAudit.test.js` e `multiTenantIsolationRuntime.test.js`) que exercitam PostgREST local, RPCs de plataforma, isolamento RLS multi-tenant real e endpoints das Edge Functions.
- **Suíte E2E Canônica (`npm run test:e2e`):** 8 cenários executados no navegador Chromium via Playwright (`headless: false` por padrão em `playwright.config.ts`), exercitando os fluxos críticos de ponta a ponta com evidências objetivas salvas em vídeo (`.webm`) e screenshots (`.png`) em `test-results/`. (Abertura de janela gráfica visível no host não confirmada na execução via IDE; auditoria assegurada pelas mídias persistidas).
- **Suíte Completa Local (`npm test`):** Executa 261 testes (204 unitários + 57 de integração locais).

### Por que Integração e E2E não rodam no CI Remoto?
As suítes de integração e E2E requerem o ecossistema completo de containers Docker do Supabase (PostgreSQL 17 relacional com RLS ativo, PostgREST, Auth e Edge Runtime). Para manter o CI remoto ágil (execução em ~15s), determinístico e sem custos de infraestrutura pesada em runners do GitHub Actions, esses testes são executados localmente antes da abertura de Pull Requests.

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

- Este CI remoto **valida lint, testes unitários e build estático do frontend**; ele não valida nem garante a aplicação de migrations no Supabase Cloud ou a publicação de Edge Functions.
- A paridade entre frontend, banco e Edge Functions em produção é governada compulsoriamente pela [Regra de Deploy Parity](./deploy-parity.md) e pelo hook `PreToolUse` do Google Antigravity (`.agents/hooks.json`).
- Merge continua dependente de **revisão e autorização humana explícita**. Checks remotos não autorizam merge automático.
