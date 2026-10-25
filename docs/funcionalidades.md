# Funcionalidades — Smart Exit School

Mapeamento completo do estado atual, organizado por perfil de usuário.

---

## Super Admin (AllTech Solutions)

**Rota:** `/admin/institutions`  
**Autenticação:** Supabase Auth + `is_platform_admin()`. Platform Admin não é tenant de escola.  
**Proteção de Rota:** Protegido via `usePlatformAdmin()` (`PlatformAdminGate`), restringindo o acesso exclusivamente a Platform Admins autenticados.

### Implementadas

| Funcionalidade | Descrição | Arquivo |
|----------------|-----------|---------|
| Guard de rota (`/admin/institutions`) | Proteção estrita via `usePlatformAdmin()` (redireciona não-admins) | `PlatformAdminGate.jsx` |
| Dashboard de métricas | Total escolas, ativas, alunos gerenciados | `InstitutionsManager.jsx` |
| Listagem de instituições | Tabela com nome, e-mail, plano, alunos, status | `InstitutionsManager.jsx` |
| Busca de instituições | Por nome ou e-mail | `InstitutionsManager.jsx` |
| Criar instituição | Modal com nome e plano; nome obrigatório e único no Supabase; feedback visual `Salvando...` | `InstitutionsManager.jsx` |
| Editar instituição | Modal pré-preenchido; validação de unicidade de nome e persistência de alteração de plano | `InstitutionsManager.jsx` |
| Excluir instituição | Com confirmação explícita | `InstitutionsManager.jsx` |
| Suspender/Reativar | Toggle status Ativo/Inativo | `InstitutionsManager.jsx` |
| Logout | Encerra sessão Auth e navega para `/login` | `InstitutionsManager.jsx` |
| Catálogo global de usuários | ✅ Super Admin busca usuários por nome, e-mail e instituição via RPC `list_platform_users` | `InstitutionsManager.jsx`, `platformAdminService.js` |
| Impersonar escola (login como usuário) | ✅ Super Admin acessa conta de usuário-alvo via impersonation auditada, com par de tokens JWT efêmeros (v5) compatíveis com GoTrue, TTL 45min, auto-refresh suspenso no cliente e trilha imutável em `impersonation_audit_logs` ([ADR-029](./adr/0029-impersonation-user-level-jwt.md) e [ADR-030](./adr/0030-hardening-verify-jwt-impersonation.md)) | `InstitutionsManager.jsx`, Edge Functions `impersonate-user` / `end-impersonation` |
| Banner de suporte (Impersonation) | ✅ Componente `SupportBanner` com identificação visual, contador regressivo de 45min e botão de encerramento seguro | `SupportBanner.jsx` |
| Logs de auditoria | ✅ Tabela `public.impersonation_audit_logs` com snapshots imutáveis de e-mail/nome, constraints de validação, RLS restritivo e testes de segurança (Grupos A/B) | `impersonation_audit_logs`, Edge Functions |
| Visualizador de auditoria de impersonation (P2) | ✅ Aba dedicada "Auditoria" em `/admin/institutions` com métricas consolidadas, filtros combinados, paginação e modal forense ([Ciclo G — P2](./cycles/historico-entregas-ciclos.md#1-ciclo-g--p2-visualizador-de-auditoria-de-impersonation)) | `ImpersonationAuditSection.jsx`, `impersonationService.js`, `impersonationAuditRepository.js` |
| Migração plano Pro → Basic | Automática no load | `InstitutionsManager.jsx` |

### Auditoria de Suporte
- Consulta detalhada de sessões de impersonation com filtros por super admin, usuário-alvo, escola e período.
- Métricas consolidadas (total, concluídas, em andamento, expiradas, duração média).
- Badges visuais de status (concluída, em andamento, expirada com TTL 45 min).
- Modal de detalhes técnicos (IP, user-agent) para auditoria forense.

### Incompletas / Ausentes

| Funcionalidade | Status |
|----------------|--------|
| Billing / faturamento | **Não identificado** |
| Gestão de planos Trial (expiração 14 dias) | Plano existe no select; **lógica ausente** |

---

## Operador da escola (Painel institucional)

**Rota:** `/painel`  
**Autenticação:** Supabase Auth e membership ativa em `public.school_members`. `localStorage` não autoriza. Em produção, uma conta escolar de teste já abriu `/painel` para o Colégio Adventista de Esteio. Ver [autenticacao.md](autenticacao.md).  
**Proteção de Rota:** Protegido via `TenantPanelGate`, validando sessão ativa no Supabase Auth e membership ativa no tenant escolar correspondente.  
**Domínio e Persistência:** Gestão institucional completa conectada ao Supabase PostgreSQL: níveis acadêmicos (`academic_levels`), turmas (`academic_groups`), anos letivos (`school_years`), alunos (`students`), matrículas (`student_enrollments`, `student_group_assignments`), portões (`public.gates`) e chamadas de saída (`public.pickup_events`).

### Aba: Monitor de Saída ✅

| Funcionalidade | Status |
|----------------|--------|
| Fonte da verdade de chamadas | ✅ `public.pickup_events` é a fonte oficial da fila operacional |
| Listar alunos disponíveis | ✅ Aluno com chamada `called` sai da lista |
| Buscar por nome ou turma | ✅ |
| Selecionar portão por aluno | ✅ Seleção gravada diretamente em `public.pickup_events` (`gate_id`) |
| Chamar aluno | ✅ Insere `pickup_events` com status `called` |
| Cancelamento com confirmação (C1) | ✅ Operador anula chamada acionada via diálogo modal de confirmação (`cancelCallDialog.js`), gravando `cancelled_at` e liberando o aluno para nova chamada (`pickupService.cancelCall`) |
| Ordenação e filtros da fila (C2) | ✅ Controles na interface (`pickupCallFilter.js`) para ordenar por horário/nome e filtrar por portão, turma ou busca dinâmica de alunos |
| Retenção e arquivamento histórico (C3) | ✅ Segregação em `public.pickup_events_archive` e RPC em lote `public.archive_old_pickup_events` restrita a `service_role` (`pickupArchiveService.js`) para expurgo de eventos `completed`/`cancelled` |
| Fila de chamada com horário | ✅ `called_at`, mais recente primeiro, lido de `public.pickup_events` |
| Confirmar saída | ✅ Atualiza para `completed` em `public.pickup_events`; o registro histórico permanece |
| Abrir telão em nova aba | ✅ |
| Impedir chamada duplicada | ✅ Lista ativa + índice único por matrícula no banco (`pickup_events_active_enrollment_unique`) |

### Aba: Anos Letivos ✅

| Funcionalidade | Status |
|----------------|--------|
| Ano letivo configurável | ✅ Cada tenant possui tabela `public.school_years` com gestão de datas e status |
| Ativação atômica de ano letivo | ✅ Transação atômica executada pela RPC `public.activate_school_year` (Migration 0026) sob lock `FOR UPDATE`, desativando o ano anterior e ativando o novo sem lacunas de rede e assegurada pelo índice parcial único `school_years_one_active_per_school` |
| Gestão de datas | ✅ Validação de intervalo (`starts_at`, `ends_at`) e restrição de sobreposição |
| Vinculação de matrículas | ✅ Matrículas e turmas acadêmicas associadas explicitamente ao ano letivo ativo |

### Aba: Gestão de Alunos ✅

| Funcionalidade | Status |
|----------------|--------|
| Persistência relacional | ✅ Dados persistidos no PostgreSQL (`students` e `student_enrollments`) via DAL |
| Cadastrar aluno | ✅ Cadastro via modal com validação de `birth_date` obrigatório e vínculo com ano letivo ativo |
| Editar aluno | ✅ |
| Excluir aluno | ✅ |
| Vincular turma | ✅ Vínculo formal em `public.student_group_assignments` |
| Definir saída padrão | ✅ |
| Herdar saída da turma | ✅ |
| Seleção em massa (checkbox) | ✅ |
| Alteração em massa (turma/saída) | ✅ |
| Contador de alunos | ✅ |

### Aba: Gestão de Turmas ✅

| Funcionalidade | Status |
|----------------|--------|
| Persistência relacional | ✅ Dados persistidos no PostgreSQL (`academic_levels` e `academic_groups`) via DAL |
| Cadastrar turma | ✅ |
| Editar turma | ✅ |
| Excluir turma | ✅ |
| Definir saída padrão da turma | ✅ |
| Propagação ao renomear turma | ✅ |
| Edição em massa de turmas | ⚠️ Lógica existe; **UI ausente** |

### Aba: Gestão de Portões ✅

| Funcionalidade | Status |
|----------------|--------|
| Fonte da verdade | ✅ `public.gates` (vertical fechada e verificada em produção via `gateService`) |
| CRUD portões avançados (nome, horário) | ✅ |
| Vincular turmas como saída padrão | ✅ |
| Propagação para alunos | ✅ |
| CRUD `school.exits` (legado) | ⚠️ Handlers existem; **UI não exposta** |
| Uso de `gates` no monitor | ✅ Seletor usa `gate.id` dos portões ativos em `public.gates` |

### Aba: Importar Dados ✅

| Funcionalidade | Status |
|----------------|--------|
| Upload CSV | ✅ |
| Criação automática de turmas | ✅ |
| Detecção de duplicatas | ✅ |
| Encoding windows-1252 | ✅ |

### Aba: Gestão de Equipe (Convites) ✅

| Funcionalidade | Status |
|----------------|--------|
| Listar membros da escola | ✅ Membros ativos exibidos com papéis vinculados (`TeamManagementSection`) |
| Convidar novo membro por e-mail | ✅ Disparo via Edge Function `invite-member` com token seguro e Brevo SMTP |
| Validação e aceite de convite | ✅ Fluxo na rota `/accept-invite` e RPC atômica `accept_school_invitation` |
| Revogação de convite pendente | ✅ Inativação do token no banco via DAL |

### Aba: Histórico e Relatórios de Saídas ✅ (Ciclo G — P1)

| Funcionalidade | Status |
|----------------|--------|
| Consulta de saídas | ✅ Chamadas finalizadas (`completed`) e canceladas (`cancelled`) com tempos de espera (`ExitReportsSection`) |
| Fonte de dados híbrida transparente | ✅ Consulta direta em `public.pickup_events` (< 30 dias) e união com `public.pickup_events_archive` (> 30 dias) via `pickupEventRepository` |
| Filtros operacionais | ✅ Período rápido (Hoje, Ontem, 7d, 30d, Mês) e personalizado (`from`/`to`), status, portão, turma e busca textual debounced por aluno/matrícula |
| Métricas consolidadas | ✅ Total de saídas, taxa de sucesso, taxa de cancelamento e tempo médio de espera formatado |
| Exportação CSV nativa | ✅ Download com UTF-8 BOM (`\uFEFF`), delimitador `;`, escape pt-BR e cap seguro de 2.000 linhas |
| Impressão / PDF | ✅ Impressão nativa (`window.print()`) com layout otimizado via Tailwind `print:` |
| Disponibilidade por plano | ✅ Liberado para todos os planos (Basic, Premium, Diamond) para a rotina diária da escola |
| Dashboards analíticos avançados | 🚧 Previsto para planos superiores (gráficos preditivos de fluxo e rotas) |

### Aba: Rotas & "Estou Chegando" 🔒 / 🚧

| Plano | Comportamento |
|-------|---------------|
| Basic/Premium | Tela de upgrade Diamond |
| Diamond | Placeholder: "Em breve: Painel de monitoramento..." |

**Funcionalidade incompleta** — geolocalização e app dos pais não implementados.

### Aba: Configurações ⚠️

| Funcionalidade | Plano | Status |
|----------------|-------|--------|
| Visualizar dados cadastrais | Todos | ✅ (readonly) |
| Upload logo customizado | Premium+ | ✅ |
| Remover logo | Premium+ | ✅ |
| Cores whitelabel | Premium+ | ✅ |
| Restaurar cores padrão | Premium+ | ✅ |
| Dark mode toggle | Premium+ | ✅ |
| Seletor de idioma | Diamond | ✅ (salva; **não traduz UI**) |
| Gerar API Key | Diamond | ✅ (não consumida) |
| Reset de fábrica | Todos | ✅ |

### Autenticação & Recuperação de Senha ✅

| Funcionalidade | Status |
|----------------|--------|
| Login com e-mail/senha | ✅ Supabase Auth com suporte a toggle de visualização (`PasswordInput`) |
| Recuperação de senha (`/forgot-password`) | ✅ Envio de e-mail de redefinição integrado ao Supabase Auth / SMTP Brevo |
| Redefinição de senha (`/update-password`) | ✅ Atualização atômica de senha com token de recuperação |
| Logout | ✅ Encerra a sessão Auth e limpa caches de tenant |

---

## Público / Telão

**Rota:** `/tv`  
**Acesso:** Rota pública de telão para exibição de chamadas em tempo real.  
**Fonte de Dados:** `public.pickup_events` lida a cada 5s (polling operacional).

| Funcionalidade | Status |
|----------------|--------|
| Exibir chamada atual | ✅ Primeira chamada ativa (`called`) de `public.pickup_events` |
| Exibir chamadas recentes | ✅ Demais chamadas ativas da fila `called` |
| Relógio e data (pt-BR) | ✅ |
| Sincronização da fila | ✅ Polling a cada 5 segundos contra `public.pickup_events`; sem Realtime |
| Fullscreen (clique no header) | ✅ |
| Whitelabel (logo/cores) | ✅ Premium/Diamond |
| Dark mode | ✅ (lê `@SmartExit:darkMode`) |
| Áudio no telão | ✅ Anúncio sonoro inteligente: chime harmônico (Web Audio API) + síntese de voz (Web Speech API), fila sequencial e debounce |

---

## Responsáveis (pais)

**Não identificado no código.**

Mencionado apenas em copy de marketing na aba Fleet (Diamond):

> "integração com o app dos pais para organizar a fila da chamada antes mesmo deles chegarem no portão"

Não há portal do responsável, app mobile ou autorização de retirada ativa.

---

## Alunos

**Não identificado como perfil autenticado.**

Alunos existem apenas como registros de dados gerenciados pelo operador da escola (persistidos em `public.students` e `public.student_enrollments` via DAL). Não há login ou interface para alunos.

---

## Isolamento Multi-Tenant e Segurança RLS ✅

A arquitetura do Smart Exit School assegura isolamento lógico e relacional estrito entre escolas contratantes:

| Capacidade | Status | Descrição |
|---|---|---|
| Segregação hermética por Tenant | ✅ | Políticas de Row Level Security (RLS) filtram estritamente consultas e mutações pelo `school_id` vinculado à membership ativa do usuário autenticado em `public.school_members`. |
| Alinhamento de privilégios de escrita | ✅ | Privilege grants (`INSERT`, `UPDATE`, `DELETE`) alinhados para o role `authenticated` em alunos, matrículas, portões e turmas (Migrations 0021 e 0027), governados pelas policies RLS. |
| Prevenção de Cross-Tenant Leak | ✅ | Usuários de uma instituição não conseguem ler, alterar ou injetar dados pertencentes a outra instituição, verificado por testes automatizados em runtime (`npm run validate:rls` e suíte E2E). |
| Retenção Histórica Segregada | ✅ | Histórico de chamadas expurgadas em `public.pickup_events_archive` mantém isolamento por escola e leitura restrita aos membros do respectivo tenant. |
| Revogação de TRUNCATE | ✅ | Comando `TRUNCATE` revogado compulsoriamente para roles não-administrativos em todas as tabelas do schema `public`. |

---

## Funcionalidades experimentais / legado

| Item | Descrição |
|------|-----------|
| `StudentCard.jsx` | Componente de card com foto — mantido para futura integração visual |
| `students.js` | Mock inicial com alunos de demonstração |
| `App.css` | Estilos template Vite |
| `school.exits` (legado) | Modelo textual substituído por `public.gates` |

---

## Funcionalidades premium (por plano)

```mermaid
graph TD
    Basic[Plano Basic]
    Premium[Plano Premium]
    Diamond[Plano Diamond]

    Basic --> Monitor[Monitor de Saída & Cancelamento]
    Basic --> CRUD[CRUD Alunos/Turmas/Portões/Anos Letivos]
    Basic --> Import[Import CSV]
    Basic --> TV[Telão com Áudio Sintetizado]

    Premium --> Basic
    Premium --> WL[Whitelabel Logo/Cores]
    Premium --> DM[Dark Mode]
    Premium --> Reports[Relatórios - placeholder]

    Diamond --> Premium
    Diamond --> API[API Key - mock]
    Diamond --> Lang[Seletor Idioma - sem i18n]
    Diamond --> Fleet[Fleet/Estou Chegando - placeholder]
```

---

## Matriz resumida por perfil

| Capacidade | Super Admin | Operador Escola | Telão | Responsável | Aluno |
|------------|:-----------:|:---------------:|:-----:|:-----------:|:-----:|
| Login | ✅ | ✅ | — | ❌ | ❌ |
| Catálogo global de usuários | ✅ | ❌ | ❌ | ❌ | ❌ |
| Impersonation auditada | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD instituições | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD alunos/turmas | ❌ (direto) / ✅ (impersonado) | ✅ | ❌ | ❌ | ❌ |
| Anos letivos configuráveis | ❌ (direto) / ✅ (impersonado) | ✅ | ❌ | ❌ | ❌ |
| Chamar alunos | ❌ (direto) / ✅ (impersonado) | ✅ | ❌ | ❌ | ❌ |
| Cancelar chamadas | ❌ (direto) / ✅ (impersonado) | ✅ | ❌ | ❌ | ❌ |
| Ver chamadas | ❌ (direto) / ✅ (impersonado) | ✅ | ✅ | ❌ | ❌ |
| Configurar whitelabel | ❌ (direto) / ✅ (impersonado) | ✅* | — | ❌ | ❌ |

\* Premium/Diamond apenas
