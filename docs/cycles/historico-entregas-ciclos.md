# Histórico Oficial de Entregas e Conclusão de Ciclos (Ciclos D, F e G)

**Data de Consolidação:** 24/10/2026 (Ciclo I — Higiene Documental)  
**Autoridade:** MyHub / AADS  
**Status:** HISTÓRICO CONSOLIDADO — Catálogo permanente de entregas  
**Nota de Governança:** Este catálogo unifica os relatórios de encerramento dos Ciclos D, F e G (P1 e P2). Os relatórios técnicos de segurança e isolamento multi-tenant permanecem como documentos autônomos em [auditoria-isolamento-multi-tenant.md](auditoria-isolamento-multi-tenant.md) e [validacao-rls-multi-tenant.md](validacao-rls-multi-tenant.md).

---

## 1. Ciclo G — P2: Visualizador de Auditoria de Impersonation

- **Status:** ✅ **CONCLUÍDO E INTEGRADO NA MAIN (`c3bf5d8`)**
- **Data de Conclusão:** 22/10/2026
- **Pull Request:** [#98](https://github.com/wesleytj/smart-exit-school/pull/98)
- **Autorização:** Wesley (humana, explícita via Decision Gate `G-MERGE`)

### Escopo e Entregas
Implementação do visualizador de auditoria de sessões de suporte e impersonation iniciadas por Platform Admins na tabela `public.impersonation_audit_logs`:
1. **Camada de Dados (`impersonationAuditRepository.js`):** Métodos `listImpersonationAudit`, `countImpersonationAudit` e `normalizeDateBoundaries`. Paginação fatiada e ordenação natural por `started_at DESC`.
2. **Camada de Serviços (`impersonationService.js`):** Métodos `getImpersonationAuditHistory`, `getImpersonationAuditMetrics` e `getPlatformUsersMap()`. Funções puras de cálculo de duração, classificação de status (`completed`, `in-progress`, `expired` após TTL 45min) e normalização de datas UTC.
3. **Camada de Apresentação (`ImpersonationAuditSection.jsx` e `InstitutionsManager.jsx`):** 4 cards de métricas no topo, barra de 4 filtros dinâmicos (período, Super Admin, usuário-alvo e escola), tabela paginada com status badges visuais e modal retrátil de detalhes técnicos da sessão forense.
4. **Resolução de RLS em `profiles`:** Resolução dos nomes de administradores via RPC `list_platform_users` (SECURITY DEFINER) sem necessitar de novas migrations ou concessões permissivas de grant.

### Qualidade e Validação
- 241 testes unitários PASS (19 novos testes em `impersonationAudit.test.js`).
- Lint e Build 100% limpos.
- 9/9 testes de isolamento multi-tenant aprovados.
- 97/97 invariantes do Database Auditor v1 aprovadas.

---

## 2. Ciclo G — P1: Histórico e Relatórios de Saídas

- **Status:** ✅ **CONCLUÍDO E INTEGRADO NA MAIN (`ad8a693`)**
- **Data de Conclusão:** 22/10/2026
- **Pull Request:** [#96](https://github.com/wesleytj/smart-exit-school/pull/96)
- **Autorização:** Wesley (humana, explícita via Decision Gate `G-MERGE`)

### Escopo e Entregas
Visualização completa do histórico de saídas escolares, tempos de espera, métricas analíticas e exportação de dados (CSV e impressão):
1. **Camada de Dados (`pickupEventRepository.js`):** Métodos `listHistoryBySchool` e `countHistoryBySchool`. Otimização temporal inteligente: consultas estritamente recentes (< 30 dias) consultam apenas a tabela quente `pickup_events`; períodos que abrangem dados históricos (> 30 dias) unificam transparentemente `pickup_events` e `pickup_events_archive`.
2. **Camada de Serviços (`pickupService.js`):** Métodos `getExitHistory`, `getExitMetrics` e `buildExitHistoryCsv` (geração nativa de CSV com UTF-8 BOM `\uFEFF`, delimitador `;` e teto seguro de 2.000 linhas).
3. **Camada de Apresentação (`ExitReportsSection.jsx` e `InstitutionPanel.jsx`):** 4 cards superiores de métricas, barra de filtros com seleção rápida de período, status da chamada, portão, turma e busca com debounce. Tabela paginada e impressão formatada (`window.print()`).
4. **Plan Gating:** Histórico de Saídas e Exportação CSV liberados para todos os planos (Basic, Premium, Diamond).

### Qualidade e Validação
- 222 testes unitários PASS (14 novos testes adicionados).
- Zero migrations novas e zero dependências externas introduzidas.
- Quality gates de Lint, Build e Database Auditor 100% verdes.

---

## 3. Ciclo F — Sincronização em Tempo Real (Realtime)

- **Status:** ✅ **CONCLUÍDO E VALIDADO EM PRODUÇÃO**
- **Data de Conclusão:** 21/10/2026
- **Pull Requests:** [#94](https://github.com/wesleytj/smart-exit-school/pull/94) (Service) e [#95](https://github.com/wesleytj/smart-exit-school/pull/95) (UI)
- **Deploy:** Produção Vercel (`https://smart-exit-school.vercel.app`)

### Escopo e Entregas
Substituição definitiva do polling periódico de 5 segundos por sincronização via Supabase Realtime (WebSocket) nas chamadas ativas:
1. **Fase 1 — Migration de Realtime:** `20261020021938_enable_realtime_for_pickup_events.sql` habilitando `REPLICA IDENTITY FULL` e adicionando `pickup_events` na publicação `supabase_realtime`.
2. **Fase 2 — Subscription no DAL Service (`pickupService.js`):** Método `subscribeActiveCalls(schoolId, onResult, options)` implementando a arquitetura *Realtime-Triggered Coalesced Refetch* com WebSocket primário, debounce coalescente (50ms), fallback automático para polling de 5s caso a conexão caia, heartbeat de reconciliação (30s) e cleanup robusto ao desmontar.
3. **Fase 3 — Integração na UI (`TvDisplay.jsx` e `InstitutionPanel.jsx`):** Eliminação de `setInterval` fixo de 5s, mantendo `reloadActiveCalls()` para feedback otimista instantâneo após ações do operador.

### Validação E2E em Produção (Resultados Medidos)
- **Chamada no Monitor Cross-Tab:** 1 ms de latência WebSocket.
- **Confirmação de Saída Cross-Tab:** 1 ms de latência WebSocket.
- **Cancelamento de Chamada Cross-Tab:** 52 ms de latência WebSocket.
- **Chamada no Monitor refletida no Telão TV:** 88 ms de latência.
- **Disparo de Áudio (Chime) no Telão:** Imediato.
- **Zero loops de polling residual** e zero erros de console.

---

## 4. Ciclo D — Registro de Higiene do Repositório (Gate D-HYG)

- **Status:** ✅ **EXECUTADO E AUDITADO**
- **Data:** 13/10/2026
- **SHA Base:** `622ae9e2a25db670d6714451c1b462f00e0934c3`
- **Autoridade:** MyHub / AADS

### Arquivos Órfãos Removidos
Remoção autorizada de 4 arquivos versionados por duplicidade ou ausência de uso comprovada:
1. `src/services/core/supabaseClient.js` (256 B): Instanciação redundante; aplicação padronizada exclusivamente em `src/lib/supabase.js`.
2. `src/components/StudentCard.jsx` (2.4 KB): Componente não referenciado herdado do template conceitual inicial.
3. `src/App.css` (2.8 KB): Boilerplate residual da inicialização do Vite sem imports ativos.
4. `public/sounds/call.mp3` (259.1 KB): Duplicata exata de `public/call.mp3`. A aplicação consome exclusivamente `/call.mp3`.

### Ajustes de `.gitignore`
Inclusão formal de regras para exclusão de arquivos temporários de diagnóstico:
```gitignore
# Scripts e arquivos temporários de diagnóstico
scripts/temp/
*.tmp
```
