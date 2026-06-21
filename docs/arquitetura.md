# Arquitetura — Smart Exit School

## Visão geral

O Smart Exit School é uma **SPA (Single Page Application)** 100% client-side. Toda a lógica de negócio, autenticação e persistência ocorre no navegador via **React** e **localStorage**. Não há servidor de aplicação, API REST, banco de dados ou serviços externos integrados no código atual.

```mermaid
graph TB
    subgraph Browser["Navegador do usuário"]
        UI["React SPA<br/>(Vite + React Router)"]
        LS[("localStorage")]
        UI <-->|"Leitura/Escrita JSON"| LS
    end

    subgraph Pages["Páginas"]
        Login["/login"]
        Admin["/admin/institutions"]
        Painel["/painel"]
        TV["/tv"]
    end

    UI --> Login
    UI --> Admin
    UI --> Painel
    UI --> TV

    Painel -->|"window.open + storage event"| TV
```

## Camadas

| Camada | Tecnologia | Responsabilidade |
|--------|------------|------------------|
| Apresentação | React 19 + JSX | UI, formulários, navegação por abas |
| Roteamento | React Router DOM 7 | Rotas declarativas em `App.jsx` |
| Estilização | Tailwind CSS 4 | Utility-first, dark mode via classe `.dark` |
| Estado | React `useState` / `useEffect` | Estado local por componente |
| Persistência | `localStorage` | Escolas, sessão, chamadas, portões, preferências |
| Build | Vite 8 | Bundling, HMR, build estático |

## Frontend

### Rotas

| Rota | Componente | Proteção |
|------|------------|----------|
| `/` | Redirect → `/login` | — |
| `/login` | `Login.jsx` | Pública |
| `/admin/institutions` | `InstitutionsManager.jsx` | **Sem guard de rota** |
| `/painel` | `InstitutionPanel.jsx` | Redirect para `/login` se `@SmartExit:loggedSchool` ausente |
| `/tv` | `TvDisplay.jsx` | **Sem guard**; depende de sessão no localStorage |

### Comunicação entre abas/janelas

O telão (`TvDisplay`) sincroniza chamadas com o painel via:

1. Evento `storage` do navegador (mesma origem, abas diferentes)
2. Polling de fallback a cada **2 segundos**

## Backend

**Não identificado.** Não há pasta `server/`, `api/`, funções serverless, nem chamadas `fetch`/`axios` no código-fonte.

## Banco de dados

**Não identificado.** A persistência é feita exclusivamente via chaves `localStorage`. Ver [banco-de-dados.md](banco-de-dados.md).

## Serviços externos

| Serviço | Status |
|---------|--------|
| API REST própria | Não identificado |
| Autenticação OAuth/JWT | Não identificado |
| CDN de imagens | Apenas URLs em `students.js` legado (`pravatar.cc`) — **não utilizado** |
| Pagamentos / billing | Não identificado |
| Mapas / geolocalização | Mencionado na UI (Diamond); **não implementado** |

## Fluxo de dados

```mermaid
sequenceDiagram
    participant Op as Operador (Painel)
    participant LS as localStorage
    participant TV as Telão (/tv)

    Op->>LS: handleCallStudent()<br/>@SmartExit:called:{schoolId}
    LS-->>TV: storage event (cross-tab)
    TV->>LS: fetchCalls() (fallback 2s)
    TV->>TV: Exibe chamada atual

    Op->>LS: handleDismissStudent()
    LS-->>TV: Atualiza fila
```

### Fluxo de cadastro institucional

```mermaid
flowchart LR
    A[Super Admin cria escola] --> B["@SmartExit:schools"]
    C[Escola faz login] --> D["@SmartExit:loggedSchool"]
    D --> E[Painel carrega dados da escola]
    E --> F[Operações CRUD]
    F --> B
    F --> D
```

## Fluxo de autenticação

```mermaid
flowchart TD
    Start([Usuário acessa /login]) --> Input[E-mail + Senha]
    Input --> AdminCheck{admin@alltech.com<br/>+ admin123?}
    AdminCheck -->|Sim| AdminPanel[/admin/institutions]
    AdminCheck -->|Não| SchoolCheck{Escola em<br/>@SmartExit:schools?}
    SchoolCheck -->|Sim| SaveSession[Salva @SmartExit:loggedSchool]
    SaveSession --> Painel[/painel]
    SchoolCheck -->|Não| Error[Exibe erro]
```

Detalhes em [autenticacao.md](autenticacao.md).

## Fluxo operacional (saída de alunos)

```mermaid
flowchart TD
    A[Operador abre Monitor de Saída] --> B[Lista alunos de studentsList]
    B --> C{Filtrar por portão<br/>ou busca?}
    C --> D[Seleciona portão de saída]
    D --> E[Clica Chamar]
    E --> F{Aluno já na fila?}
    F -->|Não| G[Adiciona à fila calledStudents<br/>com horário e exitGate]
    F -->|Sim| H[Ignora — sem duplicata]
    G --> I[Persiste @SmartExit:called:schoolId]
    I --> J[Telão exibe chamada]
    J --> K[Operador confirma saída]
    K --> L[Remove da fila]
```

## Dependências externas (npm)

Todas as dependências são bibliotecas frontend instaladas via npm. Nenhuma integração runtime com serviços cloud foi identificada.

## Diagrama de componentes

```mermaid
graph LR
    App[App.jsx] --> Login
    App --> InstitutionsManager
    App --> InstitutionPanel
    App --> TvDisplay

    InstitutionPanel --> LogoAllTech[assets/logo.png]
    InstitutionPanel -.->|não importado| StudentCard
    InstitutionPanel -.->|não importado| students.js

    TvDisplay --> localStorage
    Login --> localStorage
    InstitutionsManager --> localStorage
    InstitutionPanel --> localStorage
```

## Pontos que precisam de validação

- Se haverá backend futuro (Node, Supabase, Firebase, etc.) — **não há indícios no repositório**
- Estratégia de deploy em produção (Vercel, Netlify, S3, etc.)
- Se o telão deve funcionar sem login prévio em `/painel` na mesma sessão
- Relação entre `school.exits` (legado) e `gatesList` (portões avançados) — coexistem sem sincronização automática
