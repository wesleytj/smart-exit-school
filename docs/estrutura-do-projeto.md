# Estrutura do Projeto — Smart Exit School

## Árvore de diretórios

```
smart-exit-school/
├── .github/                  # Templates de Issue e Pull Request
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
├── README.md
│
├── ai/                       # Contexto para ferramentas de IA
├── docs/                     # Documentação técnica
│   └── arquitetura/          # ADRs, modelagem, padrões
│
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── sounds/call.mp3       # Não referenciado no código
│
├── supabase/
│   ├── config.toml
│   ├── migrations/           # Schema PostgreSQL versionado
│   ├── seed.sql
│   └── README.md
│
├── scripts/
│   ├── validate-rls-foundation.mjs  # Smoke parcial de RLS (legado)
│   └── db-auditor/                  # Database Auditor v1
│       ├── index.mjs
│       ├── expected-foundation.mjs
│       ├── inspect-schema.mjs
│       ├── inspect-rls.mjs
│       ├── inspect-seed.mjs
│       ├── report.mjs
│       ├── runtime.mjs
│       └── README.md
│
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.css               # Legado Vite — não importado
    ├── index.css
    │
    ├── assets/               # Logotipos AllTech
    ├── components/
    │   └── StudentCard.jsx   # Legado — não utilizado
    ├── lib/
    │   └── supabase.js       # Client Supabase (usado por schoolService)
    │
    ├── pages/
    │   ├── Login.jsx
    │   ├── InstitutionsManager.jsx
    │   ├── InstitutionPanel.jsx
    │   └── TvDisplay.jsx
    │
    └── services/             # Data Abstraction Layer (DAL)
        ├── authService.js
        ├── schoolService.js
        ├── gateService.js
        ├── callService.js
        ├── themeService.js
        └── core/
            ├── keys.js
            ├── storageClient.js
            └── supabaseClient.js  # Duplicata de lib/supabase.js
```

## Responsabilidade por pasta

### `supabase/`

Infraestrutura de banco PostgreSQL via Supabase CLI.

| Item | Responsabilidade |
|------|------------------|
| `migrations/` | Schema versionado (0001 Auth, 0002 Academic, 0003 Enrollment Assignment, 0004 Pickup Core, 0005 RLS Foundation) |
| `seed.sql` | Dados iniciais idempotentes (roles, shifts, massa dev acadêmica e portões) |
| `config.toml` | Configuração local Supabase |

### `scripts/db-auditor/`

Ferramenta técnica que **valida a fundação do banco local até a Migration 0005** (**Database Auditor v1**). **Não faz parte do domínio da aplicação** e não é o futuro Audit Core (`audit_logs`).

Verifica presença das tabelas esperadas, RLS foundation, policies/helper functions esperadas e invariantes do seed atual. Não substitui testes funcionais nem o futuro Audit Core. Execução: `npm run audit:db`.

| Arquivo | Responsabilidade |
|---------|------------------|
| `index.mjs` | Orquestra os inspectors e define o exit code |
| `expected-foundation.mjs` | Contrato declarado (tabelas, policies, functions, seed) |
| `inspect-schema.mjs` | Verifica existência das tabelas esperadas |
| `inspect-rls.mjs` | Verifica RLS, policies e helper functions |
| `inspect-seed.mjs` | Verifica invariantes do `seed.sql` |
| `report.mjs` | Normaliza resultados `PASS` / `FAIL` / `WARN` / `SKIP` e imprime o relatório |
| `runtime.mjs` | Helpers de conexão e consulta ao Postgres local |

Detalhes: [banco-de-dados.md](banco-de-dados.md) e [scripts/db-auditor/README.md](../scripts/db-auditor/README.md).

### `src/services/`

Camada de abstração de dados. **Páginas não acessam localStorage ou Supabase diretamente.**

| Service | Persistência atual |
|---------|-------------------|
| `authService` | localStorage |
| `schoolService` | Supabase (`public.schools` CRUD) |
| `gateService` | localStorage |
| `callService` | localStorage |
| `themeService` | localStorage |

### `src/lib/` vs `src/services/core/supabaseClient.js`

Dois arquivos criam client Supabase idêntico — **duplicação a consolidar**.

### `docs/arquitetura/`

| Arquivo | Conteúdo |
|---------|----------|
| `decisoes.md` | ADRs congeladas (fonte de verdade arquitetural) |
| `modelagem.md` | Entidades de domínio |
| `padroes.md` | Convenções código/DB/commits |
| `checklist-modelagem.md` | Fluxo antes de migrations |
| `workflow.md` | Fluxo de trabalho |
| `arquitetura-futura.md` | Roadmap arquitetural |

## Arquivos órfãos / legado

| Arquivo | Status |
|---------|--------|
| `src/App.css` | Não importado |
| `src/components/StudentCard.jsx` | Não referenciado |
| `src/data/` | Removido (pasta vazia/inexistente) |
| `public/sounds/call.mp3` | Não referenciado |

## Convenção localStorage

Prefixo `@SmartExit:` — ver [banco-de-dados.md](banco-de-dados.md).
