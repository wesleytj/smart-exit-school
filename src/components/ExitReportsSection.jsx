import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Printer,
  Filter,
  Search,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  DoorOpen,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Users
} from "lucide-react";
import { pickupService } from "../services/pickupService.js";
import { gateService } from "../services/gateService.js";
import { academicGroupService } from "../services/academicGroupService.js";

const PAGE_SIZE = 25;

function downloadCsv(csvContent, filename = "relatorio-saidas.csv") {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ExitReportsSection({ schoolId, schoolPlan = "Basic" }) {
  // Dados de apoio (filtros)
  const [gates, setGates] = useState([]);
  const [groups, setGroups] = useState([]);

  // Estado dos Filtros
  const [period, setPeriod] = useState("today"); // 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom'
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [status, setStatus] = useState("all"); // 'all' | 'completed' | 'cancelled'
  const [selectedGateId, setSelectedGateId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Paginação e Lista
  const [page, setPage] = useState(1);
  const [historyRows, setHistoryRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  // Métricas
  const [metrics, setMetrics] = useState({
    total: 0,
    completed: 0,
    cancelled: 0,
    cancellationRate: 0,
    averageWaitTimeSeconds: 0,
    averageWaitTimeFormatted: "0 min",
    byGate: {},
    byGroup: {}
  });

  // Estados de Interface
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  // Debounce da busca textual
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(handler);
  }, [search]);

  // Carregar Portões e Turmas para os seletores
  useEffect(() => {
    if (!schoolId) return;

    let cancelled = false;

    void (async () => {
      const [gatesRes, groupsRes] = await Promise.all([
        gateService.listForSchool(schoolId),
        academicGroupService.listForSchool(schoolId)
      ]);

      if (cancelled) return;

      if (!gatesRes.error && Array.isArray(gatesRes.data)) {
        setGates(gatesRes.data);
      }
      if (!groupsRes.error && Array.isArray(groupsRes.data)) {
        setGroups(groupsRes.data);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  // Carregar dados de histórico e métricas
  useEffect(() => {
    if (!schoolId) return;

    let cancelled = false;

    async function fetchHistoryAndMetrics() {
      setLoading(true);
      setError("");

      const filterParams = {
        schoolId,
        status,
        gateId: selectedGateId,
        groupId: selectedGroupId,
        search: debouncedSearch,
        period,
        from: period === "custom" ? customFrom : null,
        to: period === "custom" ? customTo : null
      };

      try {
        const [historyRes, metricsRes] = await Promise.all([
          pickupService.getExitHistory({
            ...filterParams,
            limit: PAGE_SIZE,
            offset: (page - 1) * PAGE_SIZE
          }),
          pickupService.getExitMetrics(filterParams)
        ]);

        if (cancelled) return;

        if (historyRes.error) {
          console.error("Erro ao carregar histórico:", historyRes.error);
          setError("Não foi possível carregar os registros de saída.");
          setHistoryRows([]);
          setTotalCount(0);
        } else {
          setHistoryRows(historyRes.data || []);
          setTotalCount(historyRes.total || 0);
        }

        if (!metricsRes.error && metricsRes.data) {
          setMetrics(metricsRes.data);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Falha inesperada ao consultar histórico:", err);
        setError("Ocorreu uma falha ao comunicar com o servidor.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchHistoryAndMetrics();

    return () => {
      cancelled = true;
    };
  }, [
    schoolId,
    status,
    selectedGateId,
    selectedGroupId,
    debouncedSearch,
    period,
    customFrom,
    customTo,
    page,
    reloadKey
  ]);

  // Limpar todos os filtros
  function handleResetFilters() {
    setPeriod("today");
    setCustomFrom("");
    setCustomTo("");
    setStatus("all");
    setSelectedGateId("");
    setSelectedGroupId("");
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  }

  // Exportar CSV nativo (cap de até 2.000 linhas)
  async function handleExportCsv() {
    if (!schoolId || exporting) return;

    setExporting(true);
    try {
      const exportRes = await pickupService.getExitHistory({
        schoolId,
        status,
        gateId: selectedGateId,
        groupId: selectedGroupId,
        search: debouncedSearch,
        period,
        from: period === "custom" ? customFrom : null,
        to: period === "custom" ? customTo : null,
        limit: 2000,
        offset: 0
      });

      if (exportRes.error || !exportRes.data) {
        alert("Erro ao gerar exportação CSV. Tente novamente.");
        return;
      }

      const csvContent = pickupService.buildExitHistoryCsv(exportRes.data);
      const todayStr = new Date().toISOString().slice(0, 10);
      downloadCsv(csvContent, `historico-saidas-${todayStr}.csv`);
    } catch (err) {
      console.error("Erro na exportação CSV:", err);
      alert("Falha inesperada ao exportar arquivo.");
    } finally {
      setExporting(false);
    }
  }

  // Imprimir / Salvar como PDF
  function handlePrint() {
    window.print();
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const hasActiveFilters =
    period !== "today" ||
    status !== "all" ||
    selectedGateId !== "" ||
    selectedGroupId !== "" ||
    debouncedSearch !== "";

  return (
    <div className="p-8 flex-1 overflow-y-auto print:p-0">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 print:mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-primary" size={28} />
            Histórico e Relatórios de Saídas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Auditoria operacional, métricas de fluxo e consulta detalhada de chamadas finalizadas e canceladas.
          </p>
        </div>

        {/* AÇÕES DE EXPORTAÇÃO */}
        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={handleExportCsv}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] font-semibold text-sm transition shadow-sm disabled:opacity-50"
            title="Exportar até 2.000 registros para planilha CSV"
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : (
              <Download size={16} className="text-primary" />
            )}
            {exporting ? "Gerando CSV..." : "Exportar CSV"}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:opacity-90 font-semibold text-sm transition shadow-sm"
            title="Imprimir relatório ou salvar em PDF"
          >
            <Printer size={16} />
            Imprimir / PDF
          </button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 print:mb-6">
        {/* Total Saídas */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total de Saídas
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.total}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            No período selecionado
          </p>
        </div>

        {/* Concluídas */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Concluídas
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.completed}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {metrics.total > 0
              ? `${Math.round((metrics.completed / metrics.total) * 100)}% de taxa de sucesso`
              : "Sem chamadas"}
          </p>
        </div>

        {/* Canceladas */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Canceladas
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <XCircle size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.cancelled}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Taxa de cancelamento: {metrics.cancellationRate}%
          </p>
        </div>

        {/* Tempo Médio */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Tempo Médio
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.averageWaitTimeFormatted}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Da chamada até a saída
          </p>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] shadow-sm mb-8 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white text-sm">
            <Filter size={18} className="text-primary" />
            Filtros de Pesquisa
          </h3>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-primary flex items-center gap-1 font-semibold transition"
            >
              <RotateCcw size={14} />
              Redefinir Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Período */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Período
            </label>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-2.5 text-sm outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white"
            >
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="month">Mês Atual</option>
              <option value="custom">Data Personalizada...</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Status da Chamada
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-2.5 text-sm outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white"
            >
              <option value="all">Todos os Status</option>
              <option value="completed">Concluídas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          {/* Portão */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Portão
            </label>
            <select
              value={selectedGateId}
              onChange={(e) => {
                setSelectedGateId(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-2.5 text-sm outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white"
            >
              <option value="">Todos os Portões</option>
              {gates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Turma */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Turma
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-2.5 text-sm outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white"
            >
              <option value="">Todas as Turmas</option>
              {groups.map((grp) => (
                <option key={grp.id} value={grp.id}>
                  {grp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha extra para Data Personalizada (se selecionado) e Busca Textual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-[#2a2a2a]">
          {period === "custom" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => {
                    setCustomFrom(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-2.5 text-sm outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Data Final
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => {
                    setCustomTo(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-2.5 text-sm outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white"
                />
              </div>
            </>
          )}

          <div className={period === "custom" ? "md:col-span-1" : "md:col-span-3"}>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Buscar Aluno / Matrícula
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Digite o nome do aluno ou número de matrícula..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-[#2a2a2a] rounded-xl text-sm outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MENSAGEM DE ERRO SE HOUVER */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-semibold border border-red-200 dark:border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="underline text-xs hover:opacity-80"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* TABELA DE HISTÓRICO */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] font-semibold text-slate-700 dark:text-slate-300 flex justify-between items-center text-sm">
          <span>Registros de Saída</span>
          <span className="bg-slate-200 dark:bg-[#2a2a2a] text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-md text-xs font-bold">
            {totalCount} registro(s)
          </span>
        </div>

        {/* CONTEÚDO DA TABELA */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-sm font-medium">Carregando histórico de chamadas...</p>
            </div>
          ) : historyRows.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <FileText size={32} className="text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Nenhum registro encontrado para os filtros selecionados.
              </p>
              <p className="text-xs text-slate-400">
                Tente ajustar o período ou limpar os critérios de busca.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#2a2a2a] text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-[#1f1f1f]">
                  <th className="py-3 px-4 font-semibold">Aluno</th>
                  <th className="py-3 px-4 font-semibold">Turma</th>
                  <th className="py-3 px-4 font-semibold">Portão</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Chamado em</th>
                  <th className="py-3 px-4 font-semibold">Finalizado em</th>
                  <th className="py-3 px-4 font-semibold">Espera</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2a2a2a]">
                {historyRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#222222] transition"
                  >
                    {/* Aluno e Matrícula */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {row.studentName}
                      </div>
                      {row.studentIdentifier && (
                        <div className="text-xs text-slate-500 font-mono">
                          Matrícula: {row.studentIdentifier}
                        </div>
                      )}
                    </td>

                    {/* Turma */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen size={14} className="text-slate-400" />
                        {row.groupName}
                      </span>
                    </td>

                    {/* Portão */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <DoorOpen size={14} className="text-slate-400" />
                        {row.gateName}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {row.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                          <CheckCircle2 size={12} /> Concluída
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                          <XCircle size={12} /> Cancelada
                        </span>
                      )}
                    </td>

                    {/* Chamado em */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">
                      {row.calledAtFormatted}
                    </td>

                    {/* Finalizado em */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">
                      {row.finishedAtFormatted}
                    </td>

                    {/* Tempo de Espera */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      {row.waitTimeFormatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINAÇÃO */}
        {totalCount > PAGE_SIZE && (
          <div className="p-4 border-t border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 print:hidden">
            <span>
              Página <strong className="text-slate-900 dark:text-white">{page}</strong> de{" "}
              <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#2a2a2a] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#333333] font-semibold disabled:opacity-40 transition flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Anterior
              </button>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2a2a2a] bg-white dark:bg-[#2a2a2a] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#333333] font-semibold disabled:opacity-40 transition flex items-center gap-1"
              >
                Próxima <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NOTA DE PLANO / UPGRADE INFORMATIVO (Acesso básico garantido a todos) */}
      {schoolPlan === "Basic" && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between print:hidden">
          <span>
            💡 <strong>Dica:</strong> No plano <strong>Basic</strong>, o histórico de saídas e exportação CSV estão liberados para a rotina diária da sua escola. Gráficos preditivos de fluxo e inteligência de filas estão disponíveis nos planos superiores.
          </span>
        </div>
      )}
    </div>
  );
}
