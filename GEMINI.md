# Smart Exit School — Project Architecture & Context

**Projeto:** Smart Exit School (SES)  
**Tipo:** SPA de Gestao e Chamada Inteligente de Saida Escolar  
**Governanca:** Herda compulsoriamente a Governanca Global AADS (`~/.gemini/GEMINI.md`)  
**Protocolo Operacional:** Estabelecido compulsoriamente em [AGENTS.md](./AGENTS.md)  

---

## 1. Visao Geral e Proposito do Produto

O Smart Exit School e um sistema voltado para otimizar, organizar e dar seguranca ao fluxo de saida de alunos em instituicoes escolares, conectando operadores de portao, painel administrativo da escola e telao de TV para os alunos.

## 2. Stack Tecnologica

- **Frontend:** React 19, JSX, Vite 8, React Router DOM 7.
- **Estilizacao:** Tailwind CSS 4 (classes utilitarias puras, suporte a dark mode).
- **Iconografia e Midia:** Lucide React, assets sonoros e visuais em `sounds/` e `assets/`.
- **Backend / Persistencia Remota:** Supabase (PostgreSQL relacional com RLS habilitado).
- **Persistencia Local / Runtime:** Abstracao via `src/services/storageClient.js` (localStorage).
- **Testes e Auditoria:** Node Test Runner nativo (`node --test`), Database Auditor v1 (`scripts/db-auditor/`).

## 3. Arquitetura e Camadas da Aplicacao

O projeto adota estrita separacao em camadas:

1. **Apresentacao (`src/pages/`, `src/components/`):** Componentes visuais React, navegacao declarativa. **Nunca** acessam diretamente o Supabase ou o `localStorage`.
2. **Camada de Servicos — DAL (`src/services/`):** Unica responsavel por leitura e gravacao de dados. Abstrai a transicao entre o armazenamento local e o banco remoto.
3. **Persistência Relacional e Serviços DAL:**
   - Catálogo de escolas (`public.schools`): Supabase PostgreSQL (`schoolService`).
   - Portões (`public.gates`): Supabase PostgreSQL (`gateService`).
   - Autenticação e membros (`public.school_members`): Supabase Auth (`authService`, `tenantAccess`).
   - Níveis e turmas acadêmicas (`public.academic_levels`, `public.academic_groups`): Supabase PostgreSQL (`academicLevelService`, `academicGroupService`).
   - Alunos e matrículas (`public.students`, `public.student_enrollments`, `public.student_group_assignments`): Supabase PostgreSQL (`studentService`, `studentEnrollmentService`, `studentGroupAssignmentService`).
   - Eventos de saída e chamada (`public.pickup_events`): Supabase PostgreSQL como fonte de verdade operacional do Pickup (`pickupService`).
   - Persistência local / runtime (`src/services/storageClient.js`): Mantida exclusivamente como camada de cache operacional e eventos de interface cross-tab.

## 4. Multi-Tenancy e Seguranca

- **Isolamento de Tenant:** Cada instituicao possui seu proprio `school_id`.
- **Controle de Acesso:** O usuario autenticado tem seu escopo resolvido via membership ativa em `public.school_members`.
- **Platform Admin:** Acesso irrestrito a gestao de instituicoes concedido exclusivamente pela funcao `public.is_platform_admin()`.

## 5. Scripts de Validacao e Comandos Oficiais

Para cumprir os Quality Gates e o Completion Model do AADS neste projeto, utilize:

| Comando | Finalidade |
|---|---|
| `npm run lint` | Validacao estatica com ESLint 10 |
| `npm run build` | Compilacao de producao com Vite |
| `npm test` | Suite de testes unitarios e de servicos (Node Test Runner) |
| `npm run audit:db` | Database Auditor v1 (valida tabelas, RLS e seed baseline) |
| `npm run validate:rls` | Validacao especifica da fundacao de Row Level Security |

## 6. Documentacao Canonica de Referencia

Antes de propor alteracoes no SES, consulte a documentacao relevante em `docs/`:
- Arquitetura geral: `docs/arquitetura.md`
- Decisoes consolidadas: `docs/arquitetura/decisoes.md`
- Governanca de QA: `docs/qa-data-governance.md`
- Banco de dados e schema: `docs/banco-de-dados.md`
- Autenticacao e permissoes: `docs/autenticacao.md` e `docs/permissoes.md`
