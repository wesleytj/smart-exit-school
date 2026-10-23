# Ciclo G — P2: Visualizador de Auditoria de Impersonation — Conclusão Oficial

**Status:** ✅ **CONCLUÍDO E INTEGRADO NA MAIN (`c3bf5d8`)**  
**Data de Conclusão:** 22/10/2026  
**Autoridade:** MyHub / AADS  
**Autorização:** Wesley (humana, explícita via Decision Gate G-MERGE)  
**Pull Request:** [#98](https://github.com/wesleytj/smart-exit-school/pull/98)  
**Regime:** Execução Vinculante Automatizada (SES-AADS-001 — Zero testes manuais do usuário)

---

## 1. Objetivo do P2 (Ciclo G — Item F1 do Roadmap)

Implementar o visualizador de auditoria de sessões de suporte e impersonation iniciadas por Platform Admins, fornecendo transparência, conformidade e rastreabilidade forense sobre a tabela `public.impersonation_audit_logs`, com métricas consolidadas, filtros rápidos/personalizados e detalhamento técnico de sessões.

---

## 2. Entregas Técnicas por Camada

### 2.1 Camada de Dados (Repository)
- **Arquivo:** `src/repositories/impersonationAuditRepository.js`
- **Métodos implementados:**
  - `listImpersonationAudit({ superAdminId, targetUserId, schoolId, from, to, limit, offset })`
  - `countImpersonationAudit(filters)`
  - `normalizeDateBoundaries(from, to)`
- **Comportamento e Invariantes:**
  - Consulta direta a `public.impersonation_audit_logs` com embed seguro de `schools:target_school_id(name)`.
  - Ordenação natural por `started_at DESC` apoiada pelo índice `idx_impersonation_audit_logs_started_at`.
  - Paginação fatiada via `.range(offset, offset + limit - 1)` com `count: 'exact'`.

### 2.2 Camada de Serviços (DAL Service)
- **Arquivo:** `src/services/impersonationService.js`
- **Métodos e Funções:**
  - `getImpersonationAuditHistory(params)`: Converte períodos, consulta o repositório, normaliza registros e enriquece os nomes de administradores.
  - `getImpersonationAuditMetrics(params)`: Consolidação de totais (total de sessões, concluídas, ativas, expiradas) e duração média das sessões finalizadas.
  - `getPlatformUsersMap()`: Constrói mapa em memória `user_id → { full_name, email }` através da RPC `list_platform_users` (SECURITY DEFINER) combinada com os dados da sessão ativa.
  - **Funções puras exportadas:**
    - `formatImpersonationDuration(startedAt, endedAt)`: Formatação em `Xs`, `Xm Ys` ou `Xh Ym`, retornando `null` se não encerrada.
    - `classifyImpersonationStatus(row, now)`: Classificação em `completed` (com `ended_at`), `in-progress` (sem `ended_at` e tempo decorrido < 45 min) e `expired` (sem `ended_at` e tempo decorrido ≥ 45 min, alinhado ao TTL do JWT).
    - `resolvePeriodDates(period, customFrom, customTo, now)`: Normalização para limites temporais UTC.
    - `mapImpersonationAuditLog(row, userMap)`: Normalização camelCase completa.

### 2.3 Camada de Apresentação (UI)
- **Arquivos:**
  - `src/components/ImpersonationAuditSection.jsx` (componente modular)
  - `src/pages/InstitutionsManager.jsx` (montagem na terceira aba `audit`)
- **Recursos Entregues:**
  - 4 cards de métricas no topo (Total de Sessões, Concluídas, Ativas/Expiradas, Duração Média).
  - Barra de 4 filtros aprovados: Período (`Hoje`, `Ontem`, `7 dias`, `30 dias`, `Mês Atual`, `Todo o Histórico` e `Data Personalizada`), Super Admin (select dinâmico), Usuário-Alvo (select dinâmico) e Instituição (select dinâmico).
  - Tabela paginada com `PAGE_SIZE = 25`, paginação numérica e badges visuais de status:
    - *Concluída* (verde com `CheckCircle2`)
    - *Em andamento* (azul pulsante com `Radio`)
    - *Expirada (TTL 45 min)* (âmbar com `AlertTriangle`)
  - Modal retrátil *Detalhes Técnicos da Sessão* exibindo UUID do log, ID do Super Admin, ID do Usuário-Alvo, IP de Origem, User Agent do Navegador e Motivo declarado.
  - Botão de reset de filtros aos valores padrão.

### 2.4 Resolução da Restrição Crítica de `public.profiles`
- Conforme diagnosticado na fase read-only, o embed PostgREST direto de `public.profiles` (`profiles:super_admin_id(...)`) falha com `permission denied for table profiles` devido à política `profiles_select_own` e ausência de grant SELECT para `authenticated`.
- A solução implementada cumpriu a restrição de **Zero migrations** resolvendo os nomes através da RPC `list_platform_users` (SECURITY DEFINER), dados desnormalizados da linha e fallback em UUID abreviado (`6f4f26ae...`).

---

## 3. Garantias de Engenharia e Governança

- ✅ **Zero Migrations:** Nenhuma alteração de schema, colunas, DDL ou RLS em `supabase/migrations/`.
- ✅ **Zero Dependências Novas:** Utilização exclusiva de bibliotecas já integradas ao projeto.
- ✅ **Zero Alterações em Edge Functions:** O fluxo de escrita (`impersonate-user` e `end-impersonation`) permaneceu 100% intocado.
- ✅ **Zero Mudança em RLS/Policies/Grants:** Acesso de leitura já restrito no banco a `is_platform_admin()`.
- ✅ **Arquivo Untracked Protegido:** `supabase/migrations/20261020021938_enable_realtime_for_pickup_events.sql` preservado intocado.
- ✅ **Quality Gates 100% Aprovados:**
  - `npm run test:unit`: 241 PASS / 0 FAIL (19 novos testes unitários automatizados em `impersonationAudit.test.js`).
  - `npm run lint`: 0 erros, 0 avisos no ESLint 10.
  - `npm run build`: Compilação de produção Vite bem-sucedida em < 1s.
  - `npm run validate:rls`: 9/9 testes de isolamento multi-tenant aprovados.
  - `npm run audit:db`: 97/97 invariantes do Database Auditor v1 aprovadas.
  - CI GitHub Actions: Lint, Build, Test e Vercel Preview aprovados no PR [#98](https://github.com/wesleytj/smart-exit-school/pull/98).

---

## 4. Recomendações e Próximos Passos (Backlog Técnico)

1. **Item F2 do Roadmap — Política de Retenção de Logs (G-DB):** Criação de rotina de arquivamento/expurgo de logs antigos de impersonation após 90/180 dias.
2. **Índice em `target_school_id` (Follow-up G-DB):** Se o volume de auditoria atingir centenas de milhares de linhas, considerar criação de índice em `target_school_id` via migration dedicada.
3. **Busca Textual Livre:** Avaliar adição de campo de busca textual livre por motivo/email conforme demanda de uso operacional do suporte.
