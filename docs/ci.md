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

- **Suíte Unitária (`npm run test:unit`):** Executada no CI. Compreende 191 testes puros em 14 arquivos, 100% determinísticos e independentes de rede ou containers locais (sem necessidade de Docker ou Supabase).
- **Suíte de Integração (`npm run test:integration`):** Compreende 44 testes em 3 arquivos (`impersonationFoundation.test.js`, `impersonationEdgeFunctions.test.js` e `impersonationSecurityAudit.test.js`) que exercitam PostgREST local, RPCs de plataforma e endpoints das Edge Functions. Não é executada no GitHub Actions padrão por depender de infraestrutura local (Docker / PostgREST / `supabase_edge_runtime`).
- **Suíte Completa (`npm test`):** Executa todos os 235 testes.

## Limitações

- Este CI **não substitui Browser E2E** quando houver mudança funcional no produto.
- Este CI **não** faz deploy, publicação, release nem altera ambientes.
- Este CI **valida lint, testes unitários e build estático do frontend**; ele não valida nem garante a aplicação de migrations no Supabase Cloud ou a publicação de Edge Functions.
- A paridade entre frontend, banco e Edge Functions em produção é governada compulsoriamente pela [Regra de Deploy Parity](./deploy-parity.md) e pelo hook `PreToolUse` do Google Antigravity (`.agents/hooks.json`).
- Merge continua dependente de **revisão e autorização humana explícita**. Checks remotos não autorizam merge automático.
