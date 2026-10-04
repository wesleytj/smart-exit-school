# Smart Exit School (SES)

> Sistema SaaS moderno de gestão, organização e chamada inteligente de saída de alunos para instituições de ensino.

![React](https://img.shields.io/badge/React-19.2.5-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8.0.10-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.4-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Node Test Runner](https://img.shields.io/badge/Tests-Node_Test_Runner-339933?logo=node.js)
![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=github-actions)

---

## 1. Visão Geral do Produto

O **Smart Exit School** é uma solução desenvolvida pela **AllTech Solutions** voltada para otimizar, organizar e dar segurança ao fluxo logístico de saída escolar:

- **Elimina aglomerações e poluição sonora:** substitui o uso caótico de microfones manuais por chamadas visuais e anúncios sonoros inteligentes com voz sintetizada e chime configurável.
- **Fila operacional digitalizada:** registro, transição e cancelamento operacional de chamadas em tempo real conectando portarias e salas.
- **Acompanhamento no telão (TV):** permite que alunos e responsáveis acompanhem o status visual e sonoro através de monitores estrategicamente posicionados com áudio integrado.
- **Gestão integrada:** centraliza a administração de instituições, anos letivos configuráveis, turmas, alunos e portões de saída.

---

## 2. Principais Módulos do Sistema

### 2.1. Gestão de Instituições (Platform Admin)
- **Rota:** `/admin/institutions`
- **Acesso:** restrito a Platform Admins (controlado via `usePlatformAdmin()` e RPC `public.is_platform_admin()`).
- **Funcionalidades:** cadastro de instituições escolares parceiras, controle de planos de assinatura (Basic, Premium, Diamond) e gestão de ciclos de vida/status.

### 2.2. Painel Institucional da Escola
- **Rota:** `/painel`
- **Acesso:** protegido por `TenantPanelGate` (autenticação via Supabase Auth + membership ativa em `public.school_members`).
- **Funcionalidades:** gestão de anos letivos configuráveis (`public.school_years`) com definição de ano ativo, níveis acadêmicos, turmas, cadastro e enturmação de alunos, matrículas e configuração de portões de saída.

### 2.3. Monitor Operacional de Chamadas
- **Funcionalidades:** acionamento de chamadas de alunos em tempo real com seleção explícita do portão de saída e suporte a cancelamento operacional de chamadas (transição para `cancelled` com auditoria e preenchimento de `cancelled_at`).
- **Persistência:** `public.pickup_events` (Supabase PostgreSQL como Fonte da Verdade com coerência garantida via triggers).
- **Acesso:** operadores escolares com membership ativa.

### 2.4. Monitor de Chamadas Telão (TV)
- **Rota:** `/tv`
- **Funcionalidade:** exibição otimizada para televisores e monitores de alta visibilidade com fila de chamadas em tempo real, indicação de turma e portão, acompanhada de anúncio sonoro inteligente (chime e síntese de voz com fila sequencial e debounce).
- **Acesso:** público dedicado na escola.

### 2.5. Personalização & Whitelabel
- Suporte a temas institucionais, logos personalizados da escola parceira e Dark Mode nativo.

---

## 3. Arquitetura e Engenharia de Software

### 3.1. Frontend SPA
- Desenvolvido em **React 19**, **Vite 8** e roteamento declarativo com **React Router DOM 7**.
- Estilização utilitária moderna com **Tailwind CSS 4**.

### 3.2. Separação em Camadas (DAL — Data Access Layer)
- **Repositórios (`src/repositories/`):** encapsulam as operações de leitura, escrita e relacionamentos diretos com o Supabase.
- **Serviços (`src/services/`):** abstraem as regras de negócio, transformações e validações de dados.
- **Camada de Apresentação (`src/components/`, `src/pages/`):** componentes puramente declarativos — **nunca** acessam o banco de dados ou o armazenamento local diretamente.

### 3.3. Backend & Persistência
- **Supabase (PostgreSQL):** fonte oficial da verdade relacional.
- **Row Level Security (RLS):** habilitado compulsoriamente em todas as tabelas de dados do schema `public`.
- **Multi-Tenancy Endurecido:** isolamento estrito de tenants por `school_id`, garantido fim a fim via policies RLS, revogação de privilégios destrutivos (`TRUNCATE`), grants mínimos necessários para o role `authenticated` e defesa em profundidade validada na DAL e em suíte de testes dedicada.
- **Cache Local:** `localStorage` retido exclusivamente para preferências de tema e cache operacional de interface.

### 3.4. Autenticação & Sessão
- Identidade corporativa gerenciada via **Supabase Auth** (`auth.uid()`).
- Separação estrita entre autoridade de plataforma (`is_platform_admin()`) e autoridade de tenant escolar (`public.school_members`).
- Gestão reativa de estado através de Context Providers (`PlatformAdminProvider`, `TenantSessionProvider`).

---

## 4. Stack Tecnológica

| Categoria | Tecnologia | Versão |
|---|---|---|
| **UI Framework** | React | 19.2.5 |
| **Build Tool / Bundler** | Vite | 8.0.10 |
| **Styling** | Tailwind CSS | 4.2.4 |
| **Routing** | React Router DOM | 7.17.0 |
| **Backend / DB / Auth** | Supabase (PostgreSQL + Auth + RLS) | `@supabase/supabase-js` 2.108.2 |
| **Iconografia** | Lucide React | 1.14.0 |
| **Test Runner** | Node Test Runner (`node --test`) | Nativo |
| **Code Quality** | ESLint | 10.2.1 |
| **CI** | GitHub Actions | Lint + Build |
| **Deploy / Hosting** | Vercel | SPA rewrite configurado (`vercel.json`) |

---

## 5. Como Executar Localmente

### 5.1. Pré-requisitos
- **Node.js:** versão 20.x ou 22.x LTS (recomendado: 22.x)
- **Docker Desktop:** em execução (para a infraestrutura local do Supabase)
- **Supabase CLI:** instalado localmente via `npx supabase`

### 5.2. Passo a Passo

```bash
# 1. Clonar o repositório
git clone https://github.com/wesleytj/smart-exit-school.git
cd smart-exit-school

# 2. Instalar dependências do projeto
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Atualize .env.local com as credenciais do Supabase local (ou remoto)

# 4. Iniciar containers do Supabase local (Docker)
npx supabase start

# 5. Aplicar migrations e seed baseline de desenvolvimento
npx supabase db reset

# 6. Iniciar o servidor de desenvolvimento Vite
npm run dev
```

### 5.3. Endereços de Acesso
* **Aplicação Web:** `http://localhost:5173`
* **Supabase Studio Local:** `http://localhost:54323`

---

## 6. Scripts e Qualidade

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento com HMR |
| `npm run build` | Compila o bundle otimizado de produção em `dist/` |
| `npm run lint` | Executa a verificação estática com ESLint 10 |
| `npm test` | Executa a suíte de testes unitários automatizados (Node Test Runner) |
| `npm run audit:db` | Executa o Database Auditor v1 (validação do schema, policies e seed baseline) |
| `npm run validate:rls` | Executa a validação da fundação de Row Level Security |

---

## 7. Governança e Agentes de IA (AADS)

O Smart Exit School é governado compulsoriamente pelo protocolo operacional **AADS (AllTech Agent Development Standard)**:

- [AGENTS.md](./AGENTS.md): Protocolo operacional de agentes no workspace (Regra Zero, hierarquia normativa, governança de Decision Gates e Completion Model).
- [GEMINI.md](./GEMINI.md): Contexto consolidado de arquitetura, stack tecnológica e separação de camadas.
- [.agents/rules/](./.agents/rules/): Regras permanentes de persistência DAL, governança de dados de QA e segurança de banco de dados.
- [.agents/skills/](./.agents/skills/): Procedimentos padronizados para auditoria de banco de dados e testes de fumaça (Smoke).

---

## 8. Documentação Técnica & Roadmap

### 8.1. Manuais Técnicos Oficiais
* [Arquitetura Geral](docs/arquitetura.md)
* [Estrutura do Projeto](docs/estrutura-do-projeto.md)
* [Banco de Dados & Schema](docs/banco-de-dados.md)
* [Autenticação & Multi-Tenancy](docs/autenticacao.md)
* [Permissões & Planos](docs/permissoes.md)
* [Funcionalidades Mapeadas](docs/funcionalidades.md)
* [Roadmap de Produto](docs/roadmap.md)
* [API & Rotas](docs/api.md)
* [Deploy & Infraestrutura](docs/deploy.md)
* [Governança de Dados de QA](docs/qa-data-governance.md)

### 8.2. Decisões Arquiteturais
* [ADRs Consolidadas](docs/arquitetura/decisoes.md) *(Architecture Decision Records 001–028)*

---

## 9. Licença

Este projeto é proprietário da **AllTech Solutions**. Todos os direitos reservados.