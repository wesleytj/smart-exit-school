# API — Smart Exit School

## Situação atual

**Não há API REST própria exposta a terceiros nesta fase.** A aplicação opera como uma Single Page Application (SPA) conectada diretamente ao ecossistema do **Supabase**:

1. **Supabase PostgREST (via Repositories DAL):** comunicação relacional segura com `public.schools`, `public.gates`, `public.academic_levels`, `public.academic_groups`, `public.students`, `public.student_enrollments`, `public.student_group_assignments` e a fila operacional `public.pickup_events`.
2. **Supabase Auth:** gestão de sessões, perfis de usuários e autorização baseada em tokens JWT.
3. **localStorage:** retido unicamente para preferências de tema (`@SmartExit:darkMode`) e cache temporário de interface (`@SmartExit:schoolOps:`).

Não há endpoints GraphQL ou WebSockets server-side proprietários.

---

## Rotas HTTP (SPA — React Router)

Estas são rotas de **navegação frontend client-side**, não endpoints de API.

| Rota | Método* | Componente | Autenticação / Proteção | Descrição |
|------|---------|------------|-------------------------|-----------|
| `/` | GET | `Navigate` | Pública | Redirecionamento automático para `/login` |
| `/login` | GET | `Login` | Pública | Tela de autenticação institucional e de plataforma |
| `/admin/institutions` | GET | `InstitutionsManager` | **Protegida por `usePlatformAdmin()`** | Painel exclusivo para Platform Admins (requer RPC `is_platform_admin()`) |
| `/painel` | GET | `TenantPanelGate` | **Protegida por `TenantPanelGate`** | Painel da escola (requer Supabase Auth e membership ativa em `public.school_members`) |
| `/tv` | GET | `TvDisplay` | **Pública** | Telão de chamadas em tempo real para alunos e responsáveis |

\* Em arquitetura SPA, todas as requisições ao servidor estático retornam `index.html` (via rewrite no `vercel.json`). A resolução da rota ocorre no browser pelo React Router DOM 7.

---

## API Key (Funcionalidade Mock)

### Geração
* **Local:** `InstitutionPanel.handleGenerateApiKey()`
* **Plano Requerido:** Diamond
* **Formato:** `sk_live_{random}{random}` (base36)

### Uso
* A chave é gerada e salva localmente para fins de demonstração na UI de configurações.
* Não é enviada a nenhum servidor e não autoriza chamadas de API externas nesta fase.

---

## Contratos de Dados (Persistência via DAL)

### Catálogo de Instituições (`public.schools`)
* `schoolService` e `schoolRepository` interagem exclusivamente com o banco relacional.
* Criação e atualização exigem `name` obrigatório e único (constraint `schools_name_unique`).

### Portões de Saída (`public.gates`)
* `gateService` e `gateRepository` persistem os portões cadastrados e ativos de cada escola no Supabase.

### Estrutura Acadêmica e Alunos
* Níveis, turmas, alunos e matrículas são gerenciados pelos respectivos services e repositories relacionalmente em PostgreSQL, respeitando as constraints de integridade referencial.

### Fila Operacional de Saída (`public.pickup_events`)
`pickupService` e `pickupEventRepository` gerenciam as chamadas no banco:

| Operação | Efeito |
|----------|--------|
| `getActiveCallsBySchool(schoolId)` | Consulta chamadas com `status = 'called'`, ordenadas por `called_at` descendente, com join de aluno, turma e portão |
| `callStudent({ schoolId, studentEnrollmentId, gateId })` | Insere novo evento com status inicial `called` |
| `completeCall(eventId)` | Atualiza o evento para `completed` e preenche `completed_at` |

---

## Releitura da Fila Operacional (Telão e Monitor)

Monitor e Telão (TV) consom a função `getActiveCallsBySchool` na montagem e realizam polling ativo através do intervalo constante `ACTIVE_CALL_POLL_MS` (5 segundos), garantindo convergência imediata entre múltiplos dispositivos na instituição.

---

## Autenticação Necessária

| Operação | Requisito |
|----------|-----------|
| Login Platform Admin | Sessão Supabase Auth + retorno verdadeiro de `is_platform_admin()` → `/admin/institutions` |
| Login Usuário Escolar | Sessão Supabase Auth + membership ativa em `school_members` |
| Painel Institucional | Contexto de tenant resolvido pelo `TenantPanelGate`; `localStorage` não autoriza |
| Telão TV | Rota pública; se autenticado, resolve a escola ativa automaticamente |
| Sem Memberships | Usuário autenticado sem vínculos ativos tem a sessão encerrada e não acessa o painel |

---

## API Futura (Planejada no Roadmap)

| Capacidade | Plano | Status |
|---|---|---|
| Webhooks para catracas | Diamond | Planejado |
| REST API com autenticação por API Key | Diamond | Planejado |
| Geolocalização ("Estou Chegando") | Diamond | Planejado |
| Integração com transporte escolar / vans | Diamond | Planejado |
