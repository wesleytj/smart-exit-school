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
| `migrations/` | Schema versionado (Auth Core, Academic Core) |
| `seed.sql` | Dados iniciais idempotentes (roles, shifts) |
| `config.toml` | Configuração local Supabase |

### `src/services/`

Camada de abstração de dados. **Páginas não acessam localStorage ou Supabase diretamente.**

| Service | Persistência atual |
|---------|-------------------|
| `authService` | localStorage |
| `schoolService` | Supabase (read) + localStorage (write) ⚠️ híbrido |
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
