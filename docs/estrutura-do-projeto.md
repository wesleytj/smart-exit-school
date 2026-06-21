# Estrutura do Projeto — Smart Exit School

## Árvore de diretórios

```
smart-exit-school/
├── .gitignore
├── eslint.config.js          # Configuração ESLint (flat config)
├── index.html                # Entry HTML do Vite
├── package.json              # Dependências e scripts npm
├── package-lock.json         # Lockfile npm
├── vite.config.js            # Vite + React + Tailwind
├── README.md                 # Documentação principal
│
├── public/                   # Arquivos servidos estaticamente
│   ├── favicon.svg
│   ├── icons.svg
│   └── sounds/
│       └── call.mp3          # Áudio não referenciado no código
│
├── src/
│   ├── main.jsx              # Bootstrap React (StrictMode)
│   ├── App.jsx               # Router e rotas
│   ├── App.css               # CSS legado do template Vite (não importado)
│   ├── index.css             # Tailwind + tema customizado
│   │
│   ├── assets/
│   │   ├── logotipo_alltech_solutions_icon.png
│   │   └── logotipo_alltech_solutions_icon_branco.png
│   │
│   ├── components/
│   │   └── StudentCard.jsx   # Componente legado (não utilizado)
│   │
│   ├── data/
│   │   └── students.js       # Mock estático (não utilizado)
│   │
│   └── pages/
│       ├── Login.jsx                 # Tela de login
│       ├── InstitutionsManager.jsx   # Painel Super Admin
│       ├── InstitutionPanel.jsx      # Painel da escola (principal)
│       └── TvDisplay.jsx             # Telão de chamadas
│
├── docs/                     # Documentação técnica
└── ai/                       # Contexto para IA
```

## Responsabilidade por pasta

### Raiz do projeto

| Arquivo/Pasta | Responsabilidade |
|---------------|------------------|
| `vite.config.js` | Plugins React e Tailwind; sem aliases ou proxy |
| `eslint.config.js` | Lint para `*.{js,jsx}`; ignora `dist/` |
| `index.html` | Shell HTML; `#root` + script module |
| `package.json` | Scripts: `dev`, `build`, `lint`, `preview` |

### `public/`

Assets estáticos copiados para a raiz do build. O arquivo `sounds/call.mp3` existe mas **não é referenciado** em nenhum componente.

### `src/`

Código-fonte da aplicação React.

### `src/assets/`

Imagens de marca AllTech Solutions. Apenas `logotipo_alltech_solutions_icon.png` é importado em `InstitutionPanel.jsx`.

### `src/components/`

Componentes reutilizáveis. Atualmente contém apenas `StudentCard.jsx`, que **não é importado** por nenhuma página.

### `src/data/`

Dados estáticos. `students.js` exporta 3 alunos mock com fotos externas — **não utilizado** no fluxo atual (substituído por `studentsList` no localStorage).

### `src/pages/`

Páginas mapeadas às rotas. Contém a maior parte da lógica de negócio.

## Responsabilidade por módulo

### `App.jsx`

- Configura `BrowserRouter`
- Define 5 rotas (incluindo redirect `/` → `/login`)
- Não implementa layout compartilhado nem route guards globais

### `Login.jsx` (~109 linhas)

- Formulário e-mail/senha
- Autenticação Super Admin (hardcoded)
- Autenticação escola (localStorage)
- Navegação pós-login

### `InstitutionsManager.jsx` (~388 linhas)

- Dashboard Super Admin com métricas
- CRUD de instituições (modal)
- Busca por nome/e-mail
- Toggle status Ativo/Inativo
- Persistência em `@SmartExit:schools`

### `InstitutionPanel.jsx` (~1305 linhas)

Módulo central da aplicação. Contém:

| Seção interna | Abas / funcionalidades |
|---------------|------------------------|
| Sidebar | Navegação entre 8 abas |
| Monitor | Chamada de alunos, fila, filtro |
| students | CRUD alunos, bulk edit |
| classes | CRUD turmas |
| gates | CRUD portões avançados |
| import | Upload CSV |
| reports | Placeholder + lock Basic |
| fleet | Placeholder + lock Basic/Premium |
| settings | Whitelabel, API key, dark mode, reset |

Também define `MOCK_SCHOOLS` (3 escolas de teste) e handlers de negócio.

### `TvDisplay.jsx` (~206 linhas)

- Telão fullscreen
- Relógio em tempo real
- Chamada atual + recentes
- Sincronização via localStorage
- Whitelabel condicional (Premium/Diamond)

## Componentes compartilhados

| Componente | Usado por | Status |
|------------|-----------|--------|
| `StudentCard.jsx` | Nenhum | Legado / morto |
| Ícones Lucide | Todas as pages | Ativo |
| Logo AllTech | `InstitutionPanel` | Ativo |

**Não há** biblioteca de componentes UI compartilhada (Button, Modal, Input, etc.). Cada página implementa markup Tailwind inline.

## Organização geral do código

### Padrões identificados

1. **Páginas monolíticas** — `InstitutionPanel.jsx` concentra estado, efeitos, handlers e JSX (~1300 linhas)
2. **Estado local** — Sem Context API, Redux ou Zustand
3. **Persistência manual** — Funções `saveSchoolData()` e `useEffect` para sync com localStorage
4. **Nomenclatura mista** — Chaves `@SmartExit:*` e legado `institutions` / `currentUser`
5. **JSX + JavaScript** — Sem TypeScript
6. **Comentários em português** — Especialmente em `InstitutionPanel.jsx` (seções numeradas)

### Convenção de chaves localStorage

Prefixo principal: `@SmartExit:`

| Chave | Escopo |
|-------|--------|
| `@SmartExit:schools` | Global — todas as instituições |
| `@SmartExit:loggedSchool` | Sessão da escola logada |
| `@SmartExit:darkMode` | Preferência global de tema |
| `@SmartExit:gates:{schoolId}` | Portões por escola |
| `@SmartExit:called:{schoolId}` | Fila de chamadas por escola |

Chaves legadas (uso parcial): `institutions`, `currentUser`

## Arquivos órfãos / legado

| Arquivo | Observação |
|---------|------------|
| `src/App.css` | Template Vite original; não importado |
| `src/components/StudentCard.jsx` | Não referenciado |
| `src/data/students.js` | Não referenciado |
| `public/sounds/call.mp3` | Não referenciado |
| `logotipo_alltech_solutions_icon_branco.png` | Não importado |
