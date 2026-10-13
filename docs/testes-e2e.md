# Testes End-to-End (E2E) — Smart Exit School

## 1. Visão Geral

Os testes End-to-End (E2E) no Smart Exit School representam a camada canônica de validação com navegador real (**Playwright + Chromium**). Eles exercitam a aplicação de ponta a ponta simulando as ações de usuários humanos reais através da interface gráfica (UI): preenchimento de formulários, cliques de mouse, navegação por abas e rotas, diálogos modais e reatividade em tempo real.

A suíte valida os fluxos críticos de negócio do sistema:
- Autenticação real via formulário de login (sem injeção de tokens artificiais ou `service_role`);
- Isolamento multi-tenant estrito governado por Row Level Security (RLS) no PostgreSQL;
- Ciclo de vida escolar: cadastro de alunos com `birth_date`, matrículas e vinculação de turmas;
- Operação de saída escolar: criação de chamadas no portão, consumo e conclusão de saída;
- Cancelamento operacional de chamadas com diálogo de confirmação rápida;
- Ativação atômica e transacional de ano letivo via RPC PostgreSQL (`activate_school_year`);
- Consulta e paginação de histórico/arquivo de chamadas;
- Sessão de suporte corporativo (impersonation de operador por Super Admin) com token de curta duração e banner ativo.

---

## 2. Arquitetura e Frameworks

- **Framework Canônico:** [Playwright](https://playwright.dev/) com automação de navegador Chromium real em modo headless (ou headed para debug visual).
- **Localização dos Arquivos:** `tests/e2e/`, segregados das suítes de testes unitários (`npm run test:unit`) e de integração de serviços (`npm run test:integration`).
- **Configuração:** `playwright.config.ts`, gerenciando o `webServer` local (`npm run dev` na porta 5173), timeout de 120s e gravação de trace/vídeo em falhas.
- **Fixtures e Helpers:**
  - `tests/e2e/fixtures/auth.fixture.ts`: Fixture que automatiza o login real via UI reutilizando o contexto de autenticação do operador do tenant.
  - `tests/e2e/helpers/auth.helper.ts`: Helper de autenticação limpo via formulário HTML de login.
- **Governança de Segurança:** É estritamente proibido o uso de `service_role` ou contorno de segurança nos testes E2E. Todas as interações respeitam a autenticação corporativa real e as políticas de RLS.

---

## 3. Pré-requisitos de Ambiente

Os testes E2E necessitam do ambiente local do Supabase em execução com as migrações aplicadas e as fixtures multi-tenant carregadas.

1. **Supabase Local em Execução:**
   ```bash
   npx supabase start
   ```
   * PostgREST: `http://127.0.0.1:54321`
   * PostgreSQL: `127.0.0.1:54322`
   * GoTrue Auth: `http://127.0.0.1:54321/auth/v1`

2. **Edge Runtime Ativo:**
   O container Docker `supabase_edge_runtime_smart-exit-school` deve estar em execução para atender a rota de impersonation:
   ```bash
   docker start supabase_edge_runtime_smart-exit-school
   ```

3. **Arquivo de Credenciais E2E (`.env.e2e`):**
   Baseado no template versionado `.env.e2e.example`, contendo as credenciais dos usuários de teste:
   ```env
   E2E_BASE_URL=http://localhost:5173
   E2E_USER_EMAIL=alpha-user@smart-exit.local
   E2E_USER_PASSWORD=SenhaForte123!
   E2E_PLATFORM_ADMIN_EMAIL=admin@alltech.com
   E2E_PLATFORM_ADMIN_PASSWORD=SenhaForte123!
   ```
   > **Nota de Segurança:** O arquivo `.env.e2e` é estritamente ignorado pelo `.gitignore` e nunca deve ser versionado no Git.

4. **Carga das Fixtures Multi-Tenant:**
   ```powershell
   Get-Content supabase/seed-multi-tenant.sql -Raw | docker exec -i supabase_db_smart-exit-school psql -U postgres -d postgres
   ```

---

## 4. Como Executar

### Execução Completa da Suíte E2E (Canônica)
```bash
npm run test:e2e
```
ou diretamente:
```bash
npx playwright test --reporter=list
```

### Execução com Interface Visual Interativa (Playwright UI Mode)
```bash
npm run test:e2e:ui
```

### Execução com Navegador Visível (Modo Headed / Debug)
```bash
npx playwright test --headed
```

### Execução de um Cenário E2E Específico
```bash
npx playwright test tests/e2e/02-student-lifecycle.spec.ts --reporter=list
npx playwright test tests/e2e/08-platform-impersonation.spec.ts --reporter=list
```

### Exibição do Relatório HTML
```bash
npx playwright show-report
```

---

## 5. Matriz Canônica dos 8 Cenários E2E

A suíte cobre 100% dos fluxos operacionais críticos com navegador real:

| ID | Cenário | Atores / Roles | Fluxo Principal na UI | Assertivas Críticas de Aceite | Arquivo de Teste |
|---|---|---|---|---|---|
| **E2E-01** | Login Real e Dashboard | Operador de Tenant | Login via formulário web (`alpha-user@smart-exit.local`) e entrada no painel. | URL transiciona para `/painel`, exibição do nome da instituição e menu principal. | `tests/e2e/01-login-and-dashboard.spec.ts` |
| **E2E-02** | Ciclo de Vida do Aluno | Operador de Tenant | Cadastro de novo aluno com data de nascimento obrigatória (`birth_date`), matrícula e vinculação a turma. | Aluno visível na lista operacional, persistência de `birth_date` validada sem erro de constraint NOT NULL. | `tests/e2e/02-student-lifecycle.spec.ts` |
| **E2E-03** | Ciclo Completo de Retirada | Operador de Portão | Disparo de chamada de aluno no portão e confirmação de entrega. | Chamada entra na lista ativa como `Chamado` e transiciona para `Entregue` após confirmação. | `tests/e2e/03-pickup-call-lifecycle.spec.ts` |
| **E2E-04** | Cancelamento de Chamada | Operador de Portão | Acionamento de cancelamento de chamada ativa via modal de confirmação rápida. | Modal binário confirma cancelamento, item é removido da fila ativa e retorna à lista de aptos. | `tests/e2e/04-call-cancellation.spec.ts` |
| **E2E-05** | Ativação Atômica de Ano Letivo | Gestor Escolar | Criação de novo ano letivo e alternância atômica do ano operacional ativo. | RPC `activate_school_year` executa transação atômica. Apenas um ano permanece ativo por escola. | `tests/e2e/05-school-year-activation.spec.ts` |
| **E2E-06** | Isolamento Multi-Tenant | Usuário Alpha vs Usuário Beta | Login sequencial com usuários de tenants distintos (`Tenant Alpha` e `Tenant Beta`). | Usuário de um tenant não enxerga dados, turmas, alunos ou portões do outro tenant. | `tests/e2e/06-multi-tenant-isolation.spec.ts` |
| **E2E-07** | Histórico e Arquivo de Chamadas | Gestor / Operador | Navegação para a aba de histórico e visualização de eventos arquivados. | Lista de histórico carrega registros do arquivo histórico sem erros de consulta. | `tests/e2e/07-archive-and-history.spec.ts` |
| **E2E-08** | Suporte e Impersonation | Super Admin (`Platform Admin`) | Super Admin acessa catálogo global de usuários, inicia sessão de suporte de operador e retorna ao painel admin. | Emissão de par de tokens (`access_token` + `refresh_token` HS256), exibição do banner de suporte ativo, encerramento limpo sem logout do Super Admin. | `tests/e2e/08-platform-impersonation.spec.ts` |

---

## 6. Higiene de Dados e Idempotência

- **Expurgo Automático:** Ao final das execuções de testes, alunos temporários gerados (`E2E-%` ou `Aluno E2E Playwright%`) e anos letivos de teste (`>= 2028`) são expurgados do banco de dados local.
- **Preservação de Fixtures Canônicos:** Os fixtures canônicos permanentes (`smart-exit-dev-school`, `qa-cursor-escola-teste`, `Tenant Alpha`, `Tenant Beta`, `ALPHA-001`, `BETA-001`, `STU-0001`) são protegidos contra mutação ou exclusão arbitrária.
- **Regeneração de Fixtures:** Em caso de corrupção do estado de desenvolvimento local, as fixtures multi-tenant podem ser reaplicadas a partir de `supabase/seed-multi-tenant.sql`.

---

## 7. Integração Contínua e Quality Gates

A esteira de garantia da qualidade do repositório exige que as seguintes validações passem sem falhas antes de qualquer entrega:

```bash
npm run lint             # ESLint 10 (0 erros, 0 warnings)
npm run build            # Compilação Vite para produção
npm run test:unit        # 203 testes unitários offline determinísticos
npm run test:integration # 57 testes de integração (Edge Functions + RLS multi-tenant)
npm run validate:rls     # 9 validações completas de isolamento RLS multi-tenant
npm run audit:db         # 97 invariantes de schema, RLS e seed verificados pelo Database Auditor
npm run test:e2e         # 8 cenários E2E canônicos via navegador real (Playwright)
```
