# Ciclo G — P1: Histórico e Relatórios de Saídas — Conclusão Oficial

**Status:** ✅ **CONCLUÍDO E INTEGRADO NA MAIN (`ad8a693`)**  
**Data de Conclusão:** 22/10/2026  
**Autoridade:** MyHub / AADS  
**Autorização:** Wesley (humana, explícita via Decision Gate G-MERGE)  
**Pull Request:** [#96](https://github.com/wesleytj/smart-exit-school/pull/96)  
**Regime:** Execução Vinculante Automatizada (SES-AADS-001 — Zero testes manuais do usuário)

---

## 1. Objetivo do P1 (Ciclo G)

Implementar a visualização completa do histórico de saídas escolares, tempos de espera, métricas analíticas e capacidade nativa de exportação de dados (CSV e Impressão/PDF), reaproveitando a persistência consolidada em `public.pickup_events` (recentes) e `public.pickup_events_archive` (eventos com mais de 30 dias).

---

## 2. Entregas Técnicas por Camada

### 2.1 Camada de Dados (Repository)
- **Arquivo:** `src/repositories/pickupEventRepository.js`
- **Métodos implementados:**
  - `listHistoryBySchool({ schoolId, status, gateId, from, to, limit, offset, includeArchive })`
  - `countHistoryBySchool({ schoolId, status, gateId, from, to, includeArchive })`
- **Comportamento e Invariantes:**
  - Chamadas ativas (`called`) são estritamente excluídas das consultas de histórico (`status IN ('completed', 'cancelled')`).
  - Isolamento multi-tenant garantido pelo filtro compulsório de `school_id`.
  - **Otimização Temporal:** Quando o parâmetro `from` indicar intervalo estritamente recente (< 30 dias), consulta apenas a tabela quente `pickup_events`; quando abranger dados históricos (> 30 dias) ou for irrestrito, unifica transparentemente `pickup_events` e `pickup_events_archive`.

### 2.2 Camada de Serviços (DAL)
- **Arquivo:** `src/services/pickupService.js`
- **Métodos e Funções:**
  - `getExitHistory(params)`: Mapeamento dos registros via `mapExitEvent`, cálculo de tempo de espera (`completed_at - called_at`), formatação de timestamps em pt-BR e paginação flexível.
  - `getExitMetrics(params)`: Consolidação de totais (saídas totais, concluídas, canceladas), taxa de cancelamento percentual, tempo médio de espera formatado e distribuição analítica por portão (`byGate`) e turma (`byGroup`).
  - `buildExitHistoryCsv(rows)`: Geração nativa de CSV com UTF-8 BOM (`\uFEFF`), delimitador `;`, escape compatível com Excel/planilhas pt-BR e teto seguro de 2.000 linhas (`MAX_CSV_EXPORT_ROWS`).

### 2.3 Camada de Apresentação (UI)
- **Arquivos:**
  - `src/components/ExitReportsSection.jsx` (componente modular)
  - `src/pages/InstitutionPanel.jsx` (montagem na aba `reports`)
- **Recursos Entregues:**
  - 4 cards superiores de métricas (Total Saídas, Concluídas, Canceladas e Tempo Médio de Espera).
  - Barra de filtros com seleção rápida de período (Hoje, Ontem, 7 dias, 30 dias, Mês Atual e Personalizado com datas `from`/`to`), status da chamada, portão, turma e busca textual com debounce por aluno ou matrícula.
  - Tabela paginada com status badges e tempos de espera destacados.
  - Exportação CSV em um clique via `Blob` nativo do navegador (zero chamadas de backend adicionais).
  - Impressão nativa formatada (`window.print()`) com suporte a classes Tailwind `print:`.

### 2.4 Resolução de Decisão de Produto (Plan Gating)
- O Histórico Operacional de Saídas e Exportação CSV foi liberado para **todos os planos** (Basic, Premium, Diamond), removendo o bloqueio `locked: school.plan === "Basic"` que existia no menu lateral.
- Gráficos preditivos de fluxo e inteligência analítica avançada permanecem reservados como diferencial para os planos superiores.

---

## 3. Garantias de Engenharia e Governança

- ✅ **Zero Migrations:** Nenhuma alteração de schema, colunas, DDL ou RLS em `supabase/migrations/`.
- ✅ **Zero Dependências Novas:** Utilização exclusiva de APIs nativas do navegador (`Blob`, `window.print()`).
- ✅ **Quality Gates 100% Aprovados:**
  - `npm run test:unit`: 222 PASS / 0 FAIL (14 novos testes automatizados adicionados).
  - `npm run lint`: 0 erros, 0 avisos no ESLint 10.
  - `npm run build`: Compilação de produção Vite bem-sucedida em < 1s.
  - `npm run validate:rls`: 9/9 testes de isolamento multi-tenant aprovados.
  - `npm run audit:db`: 97/97 invariantes do Database Auditor v1 aprovadas.
  - CI GitHub Actions: Lint, Build, Test e Vercel Preview aprovados no PR [#96](https://github.com/wesleytj/smart-exit-school/pull/96).

---

## 4. Recomendações e Próximos Passos (Backlog Técnico)

1. **Índices Compostos (Follow-up G-DB):** Se o volume de histórico crescer significativamente, recomenda-se a criação de índice composto `(school_id, status, completed_at DESC)` em `pickup_events` e `pickup_events_archive` via migration dedicada submetida a Decision Gate `G-DB`.
2. **Ciclo G — P2:** Definição dos próximos módulos operacionais ou execução da consolidação de higiene do repositório (Ondas 1 a 3).
