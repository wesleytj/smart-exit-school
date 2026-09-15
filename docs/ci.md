# CI — Smart Exit School

CI remoto mínimo com GitHub Actions. Arquivo: `.github/workflows/ci.yml`.

## Gates

O workflow executa, sem mascarar erros:

- `npm run lint`
- `npm run build`

A instalação de dependências usa `npm ci` com o lockfile `package-lock.json`.

Node.js **22.x**, alinhado a `docs/instalacao.md` (LTS 20.x ou 22.x) e ao requisito do Vite 8 no lockfile (`^20.19.0 || >=22.12.0`).

## Eventos

- Pull Requests com destino a `main`
- Pushes para `main`

## Limitações

- Este CI **não substitui Browser E2E** quando houver mudança funcional no produto.
- Este CI **não** faz deploy, publicação, release nem altera ambientes.
- Merge continua dependente de **revisão e autorização humana explícita**. Checks remotos não autorizam merge automático.
