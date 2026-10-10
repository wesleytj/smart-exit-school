# Tecnologias — Smart Exit School

Mapeamento técnico consolidado das tecnologias, bibliotecas, ferramentas de qualidade, infraestrutura de deploy e integração contínua do projeto.

---

## 1. Resumo da Stack

| Categoria | Tecnologia | Versão / Detalhes |
|-----------|------------|-------------------|
| **Linguagem Frontend** | JavaScript (ES Modules, `"type": "module"`) | ES2024+ |
| **Biblioteca UI** | React | 19.2.5 |
| **Renderização DOM** | React DOM | 19.2.5 |
| **Build Tool & Dev Server** | Vite | 8.0.10 |
| **Roteamento** | React Router DOM | 7.17.0 |
| **Estilização** | Tailwind CSS | 4.2.4 (com `@tailwindcss/vite`) |
| **Iconografia** | Lucide React | 1.14.0 |
| **Backend & Banco de Dados** | Supabase (PostgreSQL 15 + RLS + PostgREST) | `@supabase/supabase-js` 2.108.2 |
| **Serverless Edge Functions** | Deno 2 runtime (TypeScript) | Subdiretório `supabase/functions/` |
| **Autenticação & Sessão** | Supabase Auth (JWT manual + GoTrue) | Integrado via DAL e Edge Functions |
| **Áudio & Síntese de Voz** | Web Speech API + Web Audio API | Síntese de voz com debounce e chime harmônico no telão (`/tv`) |
| **Análise Estática (Lint)** | ESLint (Flat Config) | 10.2.1 |
| **Suíte de Testes** | Node Test Runner (`node --test`) | Nativo do Node.js (147 testes automatizados) |
| **Auditoria Estrutural de Banco** | Database Auditor v1 | Script nativo `scripts/db-auditor/` (93 PASS · 0 FAIL) |
| **Automação & CI** | GitHub Actions | Workflows em `.github/workflows/ci.yml` |
| **Deploy & Hosting** | Vercel (Frontend) + Supabase Cloud (Backend/Edge) | Configuração SPA rewrite via `vercel.json` |

---

## 2. Dependências de Produção

Extraídas diretamente de `package.json`:

| Pacote | Versão | Função Principal |
|---|---|---|
| `react` | `^19.2.5` | Core declarativo da interface de usuário |
| `react-dom` | `^19.2.5` | Renderização via `createRoot` |
| `react-router-dom` | `^7.17.0` | Roteamento declarativo no browser |
| `tailwindcss` | `^4.2.4` | Framework utility-first CSS |
| `@tailwindcss/vite` | `^4.2.4` | Plugin oficial do Tailwind 4 para o pipeline do Vite |
| `lucide-react` | `^1.14.0` | Conjunto consistente de ícones SVG |
| `@supabase/supabase-js` | `^2.108.2` | SDK oficial para comunicação com PostgreSQL, Auth e RPCs |
| `dotenv` | `^17.4.2` | Carregamento de variáveis de ambiente para scripts Node |
| `jsonwebtoken` | `^9.0.3` | Manipulação e decodificação de tokens JWT nos scripts de auditoria e validação |

---

## 3. Dependências de Desenvolvimento

| Pacote | Versão | Função Principal |
|---|---|---|
| `vite` | `^8.0.10` | Bundler, HMR e servidor de desenvolvimento ultra-rápido |
| `@vitejs/plugin-react` | `^6.0.1` | Suporte a JSX e Fast Refresh para React |
| `eslint` | `^10.2.1` | Motor de análise estática de código |
| `@eslint/js` | `^10.0.1` | Regras base recomendadas da equipe ESLint |
| `eslint-plugin-react-hooks` | `^7.1.1` | Enforçamento das regras de React Hooks |
| `eslint-plugin-react-refresh` | `^0.5.2` | Validação de exportações para Fast Refresh |
| `globals` | `^17.5.0` | Definição de globais do ambiente browser para o linter |
| `@types/react` | `^19.2.14` | Tipagens de apoio no editor para componentes React |
| `@types/react-dom` | `^19.2.3` | Tipagens de apoio no editor para renderização DOM |
| `@types/node` | `^22.10.0` | Tipagens do runtime Node.js para scripts e suítes de teste |
| `@types/jsonwebtoken` | `^9.0.7` | Tipagens de DX para o módulo `jsonwebtoken` nos testes |

---

## 4. Ferramentas de Build e Scripts npm

Configurado via `package.json`:

| Script | Comando Executado | Finalidade |
|---|---|---|
| `npm run dev` | `vite` | Servidor local com Hot Module Replacement (HMR) em `http://localhost:5173` |
| `npm run build` | `vite build` | Compilação otimizada para produção gerando a pasta `dist/` |
| `npm run preview` | `vite preview` | Servidor local para inspecionar o bundle de produção gerado |
| `npm run lint` | `eslint .` | Verificação estática de conformidade e integridade do código |
| `npm test` | `node --test src/services/*.test.js` | Executa os 147 testes automatizados em 13 arquivos de suíte |
| `npm run audit:db` | `node scripts/db-auditor/index.mjs` | Database Auditor v1 (valida 93 invariantes de schema, RLS e seed) |
| `npm run validate:rls` | `node scripts/validate-rls-foundation.mjs` | Validação da fundação de Row Level Security |

---

## 5. Qualidade, Testes e Auditoria

### 5.1. Suíte de Testes Automatizados (Node Test Runner)
O projeto adota o executor nativo `node --test` (sem dependência de frameworks pesados), totalizando **147 testes em 28 suítes (13 arquivos)**:
1. `src/services/tenantAccess.test.js`: Resolução de contexto e decisões de acesso ao painel.
2. `src/services/gateService.test.js`: Ordenação, deduplicação e normalização de portões.
3. `src/services/platformAdminResolution.test.js`: Autoridade e roteamento de Platform Admin.
4. `src/services/academicStructure.test.js`: Níveis acadêmicos, turnos e grupos.
5. `src/services/studentFlow.test.js`: Cadastro, matrículas e enturmações de alunos.
6. `src/services/pickupService.test.js`: Transição de status da fila operacional de saída e cancelamento de chamadas.
7. `src/services/schoolYearService.test.js`: Gestão de anos letivos configuráveis e alternância do ano ativo.
8. `src/services/multiTenantIsolation.test.js`: Validação de isolamento rigoroso entre múltiplos tenants.
9. `src/services/authPasswordFlows.test.js`: Validação de fluxos de recuperação e alteração de senhas.
10. `src/services/impersonationFoundation.test.js`: Verificação estrutural do schema de auditoria e RPC de usuários.
11. `src/services/impersonationEdgeFunctions.test.js`: Validação de endpoints serverless de impersonation.
12. `src/services/impersonationService.test.js`: Ciclo de vida do serviço client-side de personificação e banner.
13. `src/services/impersonationSecurityAudit.test.js`: Auditoria de segurança e blindagem contra escalonamento de privilégio (29 cenários nos Grupos A, B e C).

### 5.2. Database Auditor v1
Script proprietário em `scripts/db-auditor/` que valida contratos estruturais do banco de desenvolvimento: tabelas esperadas, políticas de isolamento RLS, funções auxiliares e dados invariantes do seed (resultado canônico: 93 PASS · 0 FAIL).

---

## 6. Deploy & Integração Contínua (CI)

* **Integração Contínua (GitHub Actions):** O workflow [ci.yml](../.github/workflows/ci.yml) é disparado em todo Pull Request e push para a branch `main`, executando `npm run lint` e `npm run build` em ambiente Node.js 22.x.
* **Hospedagem Frontend (Vercel):** O projeto está implantado em produção na Vercel com rewrite configurado via [vercel.json](../vercel.json) para suporte ao `BrowserRouter`.
* **Banco de Dados & Edge Functions (Supabase Cloud):** Instância gerenciada do PostgreSQL com Row Level Security (RLS) compulsório e deploy serverless das Edge Functions em Deno via Supabase CLI.
