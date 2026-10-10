# Smart Exit School

[![React](https://img.shields.io/badge/React-19.2.5-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0.10-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Auth%20%2B%20Edge%20Functions-3ECF8E?logo=supabase)](https://supabase.com/)
[![Deno](https://img.shields.io/badge/Deno-2-000000?logo=deno)](https://deno.land/)
[![Tests](https://img.shields.io/badge/Tests-147%20passing-brightgreen)](./src)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=github-actions)](./.github/workflows)

> Sistema SaaS moderno de gestão, organização e chamada inteligente de saída de alunos para instituições de ensino.

---

## 1. Visão Geral do Produto

O **Smart Exit School (SES)** é uma plataforma desenvolvida pela **AllTech Solutions** voltada para otimizar, organizar e garantir a segurança do fluxo logístico de saída de alunos em escolas e redes de ensino:

* **Elimina aglomerações e poluição sonora:** substitui o uso caótico de megafones e microfones manuais por chamadas visuais em tempo real e avisos sonoros inteligentes com chime harmônico e voz sintetizada.
* **Fila operacional digitalizada:** registro instantâneo, transição de status e cancelamento operacional de chamadas com auditoria e controle de portões de saída.
* **Acompanhamento no telão (TV):** permite que alunos, professores e responsáveis acompanhem o status visual da chamada através de monitores estrategicamente posicionados.
* **Suporte operacional seguro:** capacidade nativa de suporte técnico em primeira pessoa para administradores de plataforma via personificação auditável de usuários (*user-level impersonation*).
* **Gestão multi-tenant integrada:** centraliza a administração de instituições parceiras, anos letivos configuráveis, etapas pedagógicas, turmas, matrículas de alunos e operadores de portaria sob isolamento relacional rigoroso.

---

## 2. Principais Módulos do Sistema

### 2.1 Gestão de Instituições & Super Admin (`/admin/institutions`)
* **Acesso:** restrito a Platform Admins (avaliado via `usePlatformAdmin()` e pela RPC `public.is_platform_admin()`).
* **Catálogo Institucional:** cadastro de escolas parceiras, controle de planos de assinatura (Basic, Premium, Diamond) e suspensão/reativação de status.
* **Catálogo Global de Usuários:** busca unificada e filtragem de operadores e gestores de todas as escolas cadastradas por nome, e-mail, instituição e papel.
* **Impersonation User-Level ("Entrar como usuário"):** suporte técnico operacional em primeira pessoa. Permite que um Super Admin acesse o painel sob a ótica de qualquer usuário, com autorização estrita, registro imutável em `public.impersonation_audit_logs` e cunhagem atômica de JWT manual de 45 minutos.

### 2.2 Painel Institucional da Escola (`/painel`)
* **Acesso:** protegido pelo guard `TenantPanelGate` (requer Supabase Auth e membership ativa em `public.school_members`).
* **Anos Letivos Configuráveis (`public.school_years`):** criação e alternância atômica do ano letivo ativo da escola, vinculando matrículas e agrupamentos de forma dinâmica.
* **Gestão Acadêmica Completa:** cadastro de níveis educacionais, criação de turmas por turno (manhã, tarde, noite, integral), enturmação de alunos e matrículas por ano letivo.
* **Portões de Saída:** configuração e ordenação de múltiplos portões físicos (`public.gates`).

### 2.3 Monitor Operacional de Chamadas
* **Acionamento em Tempo Real:** operadores de pátio e portaria acionam chamadas selecionando explicitamente o portão de saída correspondente.
* **Fonte da Verdade:** eventos persistidos diretamente em `public.pickup_events` no PostgreSQL (com prevenção de duplicidade via índice parcial único).
* **Cancelamento Operacional de Chamadas:** suporte à anulação de chamadas indevidas com modal de confirmação, justificativa e preenchimento de `cancelled_at` sob auditoria completa.

### 2.4 Monitor de Chamadas Telão TV (`/tv`)
* **Exibição Dedicada:** layout de alta visibilidade e legibilidade otimizado para TVs, monitores de pátio e salas de aula.
* **Anúncio Sonoro Inteligente:** execução sequencial de chime de alerta harmônico seguido por síntese de voz (Web Speech API) anunciando o nome do aluno, turma e portão de saída, com fila assíncrona e debounce.

### 2.5 Banner Global de Suporte Técnico (Impersonation Banner)
* **Identificação Visual Ostensiva:** barra fixa persistente no topo da tela com cor de destaque informando quem está sendo personificado.
* **Contador Regressivo (Countdown Timer):** temporizador regressivo de 45 minutos exibindo o tempo restante de sessão em tempo real.
* **Encerramento Seguro:** botão de saída que aciona a Edge Function `end-impersonation`, limpa caches do tenant no navegador, restaura a sessão original do Super Admin arquivada no `sessionStorage` e reativa a renovação automática de tokens.

### 2.6 Autenticação, Recuperação de Senha & Whitelabel
* **Login Corporativo:** tela de autenticação institucional com toggle de visualização de senha (`PasswordInput`).
* **Recuperação de Senhas:** rotas públicas `/recuperar-senha` (`ForgotPassword`) e `/redefinir-senha` (`UpdatePassword`) integradas a relay SMTP transacional (Brevo).
* **Customização Institucional:** suporte a temas visuais claros e escuros (Dark Mode nativo) e exibição de logos institucionais nos planos elegíveis.

---

## 3. Arquitetura e Engenharia de Software

### 3.1 Frontend SPA
* Desenvolvido em **React 19**, **Vite 8** e roteamento declarativo com **React Router DOM 7**.
* Estilização utilitária de alta performance com **Tailwind CSS 4** (utilizando o plugin oficial `@tailwindcss/vite`).

### 3.2 Backend Serverless & Edge
* **Supabase PostgreSQL:** banco relacional principal com PostgREST e triggers de integridade.
* **Supabase Edge Functions (Deno 2):** endpoints serverless desacoplados responsáveis por operações privilegiadas:
  * `impersonate-user`: valida autorização de plataforma, grava auditoria e assina token JWT manual.
  * `end-impersonation`: encerra o ciclo de auditoria registrando o timestamp de término (`ended_at`).

### 3.3 Separação em Camadas (DAL — Data Access Layer)
* **Repositórios (`src/repositories/`):** encapsulam queries, mutations e filtros diretos com o Supabase.
* **Serviços (`src/services/`):** encapsulam regras de negócio, formatação de dados, orquestração e validações de domínio.
* **Camada de Apresentação (`src/components/`, `src/pages/`):** componentes puramente declarativos — **nunca** acessam o Supabase ou o `localStorage` diretamente.

### 3.4 Persistência & Isolamento Multi-Tenant
* **Row Level Security (RLS) Compulsório:** todas as tabelas do schema `public` possuem RLS habilitado e políticas de isolamento baseadas em `school_id` e memberships ativas.
* **Princípio do Menor Privilégio:** privilégios destrutivos (`TRUNCATE`) revogados do role `authenticated`, garantindo grants mínimos e imutabilidade dos logs de auditoria.
* **Defesa em Profundidade:** validação bilateral tanto no banco de dados quanto na camada de serviços (DAL).

### 3.5 Ciclo de Vida da Sessão de Impersonation
* **JWT Manual Assinado:** cunhado na Edge Function com algoritmo HMAC-SHA256 (`HS256`) utilizando a chave `SUPABASE_AUTH_JWT_SECRET`.
* **Claims Customizadas:** injeção direta de `impersonated: true`, `impersonated_by` e `impersonation_log_id`, consumíveis no PostgREST via `auth.jwt()`.
* **Token Sentinela:** uso de `refresh_token: 'impersonation_no_refresh'` associado à desativação voluntária do temporizador via `supabase.auth.stopAutoRefresh()`, prevenindo falhas de refresh e poluição na tabela interna `auth.sessions`.

---

## 4. Stack Tecnológica

| Categoria | Tecnologia | Versão / Detalhes |
|---|---|---|
| **UI Framework** | React | 19.2.5 |
| **Bundler & Dev Server** | Vite | 8.0.10 |
| **Styling** | Tailwind CSS | 4.2.4 (com `@tailwindcss/vite`) |
| **Routing** | React Router DOM | 7.17.0 |
| **Backend & Banco de Dados** | Supabase (PostgreSQL 15 + RLS + PostgREST) | `@supabase/supabase-js` 2.108.2 |
| **Serverless Edge Runtime** | Deno | 2.x (Edge Functions em TypeScript) |
| **Iconografia** | Lucide React | 1.14.0 |
| **Test Runner** | Node Test Runner (`node --test`) | Nativo (147 testes automatizados) |
| **Análise Estática (Lint)** | ESLint | 10.2.1 |
| **Integração Contínua** | GitHub Actions | Workflows de Lint + Build |
| **Deploy & Hosting** | Vercel (Frontend SPA) + Supabase Cloud (Backend) | SPA rewrite configurado via `vercel.json` |

---

## 5. Como Executar Localmente

### 5.1 Pré-requisitos
* **Node.js:** versão 20.x ou 22.x LTS (recomendado: `22.x`)
* **Docker Desktop:** em execução (obrigatório para containers locais do Supabase)
* **Supabase CLI:** instalado localmente (`npx supabase`) ou globalmente (`npm install -g supabase`)

### 5.2 Passo a Passo

```bash
# 1. Clonar o repositório
git clone https://github.com/wesleytj/smart-exit-school.git
cd smart-exit-school

# 2. Instalar dependências do frontend
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencha .env.local com os endpoints e chaves do Supabase local (ou remoto):
# VITE_SUPABASE_URL=http://127.0.0.1:54321
# VITE_SUPABASE_ANON_KEY=sua-chave-anon-local
# SUPABASE_AUTH_JWT_SECRET=seu-jwt-secret-local

# 4. Iniciar infraestrutura de containers do Supabase local
npx supabase start

# 5. Executar as Edge Functions locais (em terminal separado)
npx supabase functions serve --no-verify-jwt

# 6. Iniciar o servidor de desenvolvimento do frontend
npm run dev
```

### 5.3 Endereços de Acesso
* **Aplicação Web:** `http://localhost:5173`
* **Supabase Studio Local:** `http://localhost:54323`
* **Edge Functions Runtime:** `http://127.0.0.1:54321/functions/v1/`

---

## 6. Scripts e Qualidade

| Comando | Descrição | Resultado Esperado |
|---|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Vite com HMR | Servidor ativo em `http://localhost:5173` |
| `npm run build` | Compila o bundle otimizado de produção | Diretório `dist/` gerado com sucesso |
| `npm run lint` | Executa a validação estática de código | 0 erros com ESLint 10 |
| `npm test` | Executa a suíte de testes unitários e de integração | 147 testes passando (28 suítes) |
| `npm run audit:db` | Executa o Database Auditor v1 | 93 PASS · 0 FAIL (valida schema, RLS e seed) |
| `npm run validate:rls` | Valida as políticas e helper functions de RLS | Sucesso |

---

## 7. Governança e Agentes de IA (AADS)

O Smart Exit School é governado compulsoriamente pelo protocolo operacional **AADS (AllTech Agent Development Standard)**:

* [AGENTS.md](./AGENTS.md): Protocolo operacional de agentes no workspace (Regra Zero, autoridade normativa, políticas Git e catálogo de Decision Gates).
* [GEMINI.md](./GEMINI.md): Contexto consolidado de arquitetura, padrões de persistência e stack tecnológica.
* [.agents/rules/](./.agents/rules/): Regras permanentes de persistência DAL, governança de dados de QA e segurança de banco de dados.
* [.agents/skills/](./.agents/skills/): Procedimentos padronizados para auditoria local de banco e testes operacionais de smoke.

---

## 8. Documentação Técnica & ADRs

### 8.1 Manuais Técnicos Oficiais
* [Estrutura do Projeto](docs/estrutura-do-projeto.md) — Árvore de diretórios, convenções e responsabilidades de pastas.
* [Banco de Dados & Schema](docs/banco-de-dados.md) — Schema relacional, catálogo de migrations e diagramas ER.
* [Autenticação & Multi-Tenancy](docs/autenticacao.md) — Identidade Supabase Auth, resolução de tenant e guards de sessão.
* [Permissões & Planos](docs/permissoes.md) — Matriz de acesso entre perfis (Super Admin vs Operador) e restrições por plano.
* [Funcionalidades Mapeadas](docs/funcionalidades.md) — Catálogo detalhado de recursos entregues por módulo.
* [Arquitetura Geral](docs/arquitetura.md) — Camadas da aplicação, fluxo de dados e integrações.
* [Roadmap de Produto](docs/roadmap.md) — Histórico de entregas e backlog planejado.
* [Stack Tecnológica](docs/tecnologias.md) — Mapeamento detalhado de versões, bibliotecas e dependências.
* [Guia de Instalação](docs/instalacao.md) — Procedimentos para configuração do ambiente de desenvolvimento.
* [Deploy & Infraestrutura](docs/deploy.md) — Estrutura de deploy na Vercel e Supabase Cloud.
* [API & Rotas](docs/api.md) — Rotas de navegação client-side e contratos das Edge Functions.
* [Troubleshooting](docs/troubleshooting.md) — Diagnóstico e resolução de erros comuns.

### 8.2 Guias Operacionais Específicos
* [Guia de Suporte Técnico via Impersonation](docs/impersonation-support-flow.md) — Passo a passo do operador, banner, encerramento e consultas de auditoria.
* [Setup de E-mail Transacional (Brevo SMTP)](docs/infra/smtp-brevo-setup.md) — Configuração do relay SMTP para fluxos de redefinição de senha.

### 8.3 Decisões Arquiteturais (ADRs)
* [ADRs Consolidadas 001–028](docs/arquitetura/decisoes.md) — Decisões estruturais permanentes da fundação do sistema.
* [ADR-029: Impersonation User-Level com JWT Manual](docs/adr/0029-impersonation-user-level-jwt.md) — Decisão arquitetural de personificação via Edge Functions em Deno.

### 8.4 Governança de QA
* [Governança de Dados de QA](docs/qa-data-governance.md) — Princípio de reutilização de fixtures e regras de isolamento.
* [Inventário de Fixtures de QA](docs/qa-inventory.md) — Snapshot canônico de instituições e fixtures autorizados.
* [Roteiro de Smoke em Produção](docs/qa-production-smoke.md) — Roteiro operacional para testes de fumaça via UI.

---

## 9. Licença & Direitos

© 2026 **AllTech Solutions**. Todos os direitos reservados.