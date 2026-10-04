# Tecnologias — Smart Exit School

Mapeamento técnico consolidado das tecnologias, bibliotecas, ferramentas de qualidade, infraestrutura de deploy e integração contínua do projeto.

---

## 1. Resumo da Stack

| Categoria | Tecnologia | Versão |
|-----------|------------|--------|
| **Linguagem** | JavaScript (ES Modules, `"type": "module"`) | ES2024+ |
| **Biblioteca UI** | React | 19.2.5 |
| **Renderização DOM** | React DOM | 19.2.5 |
| **Build Tool & Dev Server** | Vite | 8.0.10 |
| **Roteamento** | React Router DOM | 7.17.0 |
| **Estilização** | Tailwind CSS | 4.2.4 (com `@tailwindcss/vite`) |
| **Iconografia** | Lucide React | 1.14.0 |
| **Backend & Banco de Dados** | Supabase (PostgreSQL + RLS + PostgREST) | `@supabase/supabase-js` 2.108.2 |
| **Autenticação & Sessão** | Supabase Auth (JWT) | Integrado via DAL |
| **Análise Estática (Lint)** | ESLint (Flat Config) | 10.2.1 |
| **Suíte de Testes** | Node Test Runner (`node --test`) | Nativo do Node.js |
| **Automação & CI** | GitHub Actions | Workflows em `.github/workflows/ci.yml` |
| **Deploy & Hosting** | Vercel | Configuração SPA rewrite via `vercel.json` |

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
| `jsonwebtoken` | `^9.0.3` | Manipulação e decodificação de tokens JWT nos scripts de validação de RLS |

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
| `@types/react` | `^19.2.14` | Tipagens de apoio no editor |
| `@types/react-dom` | `^19.2.3` | Tipagens de apoio no editor |

---

## 4. Ferramentas de Build e Scripts npm

Configurado via `package.json`:

| Script | Comando Executado | Finalidade |
|---|---|---|
| `npm run dev` | `vite` | Servidor local com Hot Module Replacement (HMR) |
| `npm run build` | `vite build` | Compilação otimizada para produção gerando a pasta `dist/` |
| `npm run preview` | `vite preview` | Servidor local para inspecionar o bundle de produção gerado |
| `npm run lint` | `eslint .` | Verificação estática de conformidade e integridade do código |
| `npm test` | `node --test ...` | Executa as 6 suítes unitárias automatizadas de serviços |
| `npm run audit:db` | `node scripts/db-auditor/index.mjs` | Database Auditor v1 (valida schema, RLS e seed baseline) |
| `npm run validate:rls` | `node scripts/validate-rls-foundation.mjs` | Validação de fundação de Row Level Security |

---

## 5. Qualidade, Testes e Auditoria

### 5.1. Suíte de Testes Automatizados (Node Test Runner)
O projeto adota o executor nativo `node --test` (sem dependência de frameworks pesados como Jest/Vitest), cobrindo:
1. `src/services/tenantAccess.test.js`: Resolução de contexto e decisões de acesso ao painel.
2. `src/services/gateService.test.js`: Ordenação, deduplicação e normalização de portões.
3. `src/services/platformAdminResolution.test.js`: Autoridade e roteamento de Platform Admin.
4. `src/services/academicStructure.test.js`: Níveis acadêmicos, turnos e grupos.
5. `src/services/studentFlow.test.js`: Cadastro, matrículas e enturmações de alunos.
6. `src/services/pickupService.test.js`: Transição de status da fila operacional de saída.

### 5.2. Database Auditor v1
Script proprietário em `scripts/db-auditor/` que valida contratos estruturais do banco de desenvolvimento: tabelas esperadas, políticas de isolamento RLS, funções auxiliares e dados invariantes do seed.

---

## 6. Deploy & Integração Contínua (CI)

* **Integração Contínua (GitHub Actions):** O workflow [ci.yml](../.github/workflows/ci.yml) é disparado em todo Pull Request e push para a branch `main`, executando `npm run lint` e `npm run build` em ambiente Node.js 22.x.
* **Hospedagem & Deploy (Vercel):** O projeto está implantado em produção na Vercel com rewrite configurado via [vercel.json](../vercel.json) para garantir suporte completo ao `BrowserRouter`.
* **Banco de Dados (Supabase Cloud):** Instância gerenciada do PostgreSQL com Row Level Security (RLS) compulsório para isolamento de dados.
