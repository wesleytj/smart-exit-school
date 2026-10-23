import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Building,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Loader2,
  UserCheck,
  User,
  Radio
} from "lucide-react";
import { impersonationService } from "../services/impersonationService.js";

const PAGE_SIZE = 25;

function formatDateTime(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function truncateUuid(uuid) {
  if (!uuid || typeof uuid !== "string") return "-";
  if (uuid.length <= 12) return uuid;
  return `${uuid.slice(0, 8)}...${uuid.slice(-4)}`;
}

export default function ImpersonationAuditSection({ institutions = [] }) {
  // Estado dos Filtros
  const [period, setPeriod] = useState("today"); // 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom' | 'all'
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedSuperAdminId, setSelectedSuperAdminId] = useState("");
  const [selectedTargetUserId, setSelectedTargetUserId] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  // Paginação e Dados
  const [page, setPage] = useState(1);
  const [auditRows, setAuditRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Lista de Super Admins e Usuários para os Selects
  const [platformUsers, setPlatformUsers] = useState([]);
  const [userMap, setUserMap] = useState(null);

  // Métricas do Período
  const [metrics, setMetrics] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    expired: 0,
    activeOrExpired: 0,
    averageDurationFormatted: "-"
  });

  // Estados de Interface
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [technicalModalRow, setTechnicalModalRow] = useState(null);

  // Carregar catálogo de usuários para resolução rica e selects
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const map = await impersonationService.getPlatformUsersMap();
        if (cancelled) return;
        setUserMap(map);

        const { data } = await impersonationService.listPlatformUsers({ limit: 100 });
        if (cancelled) return;
        if (Array.isArray(data)) {
          setPlatformUsers(data);
        }
      } catch (err) {
        console.warn("Falha ao carregar catálogo para filtros de auditoria:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Consultar logs de auditoria e métricas
  useEffect(() => {
    let cancelled = false;

    async function fetchAuditData() {
      setLoading(true);
      setError("");

      const filterParams = {
        superAdminId: selectedSuperAdminId || null,
        targetUserId: selectedTargetUserId || null,
        schoolId: selectedSchoolId || null,
        period,
        from: period === "custom" ? customFrom : null,
        to: period === "custom" ? customTo : null
      };

      try {
        const [historyRes, metricsRes] = await Promise.all([
          impersonationService.getImpersonationAuditHistory({
            ...filterParams,
            page,
            pageSize: PAGE_SIZE,
            userMap
          }),
          impersonationService.getImpersonationAuditMetrics(filterParams)
        ]);

        if (cancelled) return;

        if (historyRes.error) {
          console.error("Erro ao carregar auditoria de impersonation:", historyRes.error);
          setError("Não foi possível carregar os registros de auditoria.");
          setAuditRows([]);
          setTotalCount(0);
        } else {
          setAuditRows(historyRes.data || []);
          setTotalCount(historyRes.total || 0);
        }

        if (!metricsRes.error && metricsRes.data) {
          setMetrics(metricsRes.data);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Falha inesperada ao consultar auditoria:", err);
        setError("Ocorreu uma falha ao comunicar com o servidor.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchAuditData();

    return () => {
      cancelled = true;
    };
  }, [
    selectedSuperAdminId,
    selectedTargetUserId,
    selectedSchoolId,
    period,
    customFrom,
    customTo,
    page,
    userMap
  ]);

  // Limpar todos os filtros
  function handleResetFilters() {
    setPeriod("today");
    setCustomFrom("");
    setCustomTo("");
    setSelectedSuperAdminId("");
    setSelectedTargetUserId("");
    setSelectedSchoolId("");
    setPage(1);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const hasActiveFilters =
    period !== "today" ||
    selectedSuperAdminId !== "" ||
    selectedTargetUserId !== "" ||
    selectedSchoolId !== "" ||
    (period === "custom" && (customFrom !== "" || customTo !== ""));

  // Opções para select de Super Admins
  const distinctSuperAdmins = Array.from(
    new Set(auditRows.map((r) => r.superAdminId).filter(Boolean))
  );

  return (
    <div className="p-8 flex-1 overflow-y-auto">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-orange-500" size={28} />
            Auditoria de Suporte & Impersonation
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Trilha de conformidade e auditoria de sessões de suporte temporárias iniciadas por Platform Admins.
          </p>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Sessões */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total de Sessões
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.total}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            No período selecionado
          </p>
        </div>

        {/* Concluídas */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Concluídas
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.completed}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {metrics.total > 0
              ? `${Math.round((metrics.completed / metrics.total) * 100)}% de encerramento normal`
              : "Sem sessões"}
          </p>
        </div>

        {/* Em andamento ou Expiradas */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Ativas / Expiradas
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Radio size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.activeOrExpired}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {metrics.inProgress} ativas · {metrics.expired} expiradas (TTL 45m)
          </p>
        </div>

        {/* Duração Média */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
              Duração Média
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.averageDurationFormatted}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sessões finalizadas
          </p>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-800 text-sm">
            <Clock size={18} className="text-orange-500" />
            Filtros da Trilha de Auditoria
          </h3>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-orange-600 flex items-center gap-1 font-semibold transition cursor-pointer"
            >
              <RotateCcw size={14} />
              Redefinir Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Período */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Período
            </label>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-orange-500 bg-white"
            >
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="month">Mês Atual</option>
              <option value="all">Todo o Histórico</option>
              <option value="custom">Data Personalizada...</option>
            </select>
          </div>

          {/* Super Admin */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Super Admin
            </label>
            <select
              value={selectedSuperAdminId}
              onChange={(e) => {
                setSelectedSuperAdminId(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-orange-500 bg-white"
            >
              <option value="">Todos os Super Admins</option>
              {distinctSuperAdmins.map((adminId) => {
                const info = userMap?.get ? userMap.get(adminId) : null;
                const label = info?.full_name || info?.email || truncateUuid(adminId);
                return (
                  <option key={adminId} value={adminId}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Usuário-Alvo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Usuário-Alvo
            </label>
            <select
              value={selectedTargetUserId}
              onChange={(e) => {
                setSelectedTargetUserId(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-orange-500 bg-white"
            >
              <option value="">Todos os Usuários Alvo</option>
              {platformUsers.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.full_name || u.email} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Escola */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Instituição / Escola
            </label>
            <select
              value={selectedSchoolId}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-orange-500 bg-white"
            >
              <option value="">Todas as Instituições</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Inputs de Data Personalizada */}
        {period === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Data Inicial
              </label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-orange-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Data Final
              </label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  setPage(1);
                }}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-orange-500 bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* ERRO */}
      {error && (
        <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TABELA DE AUDITORIA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">Super Admin</th>
                <th className="py-3.5 px-4">Usuário-Alvo</th>
                <th className="py-3.5 px-4">Instituição</th>
                <th className="py-3.5 px-4">Motivo Informado</th>
                <th className="py-3.5 px-4">Iniciado em</th>
                <th className="py-3.5 px-4">Encerrado em</th>
                <th className="py-3.5 px-4 text-center">Duração</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Loader2 size={28} className="animate-spin text-orange-500 mx-auto mb-2" />
                    Carregando trilha de auditoria...
                  </td>
                </tr>
              ) : auditRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <ShieldAlert size={36} className="text-slate-300 mx-auto mb-2" />
                    Nenhuma sessão de impersonation encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                auditRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    {/* Super Admin */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <UserCheck size={16} className="text-orange-500 shrink-0" />
                        <span>{row.superAdminName || row.superAdminEmail || truncateUuid(row.superAdminId)}</span>
                      </div>
                      {row.superAdminEmail && row.superAdminName && (
                        <span className="text-xs text-slate-400 block ml-5">{row.superAdminEmail}</span>
                      )}
                    </td>

                    {/* Usuário-Alvo */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <User size={16} className="text-blue-500 shrink-0" />
                        <span>{row.targetUserName || row.targetUserEmail || truncateUuid(row.targetUserId)}</span>
                      </div>
                      {row.targetUserEmail && (
                        <span className="text-xs text-slate-400 block ml-5">{row.targetUserEmail}</span>
                      )}
                    </td>

                    {/* Escola */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Building size={16} className="text-slate-400 shrink-0" />
                        <span>{row.schoolName || "-"}</span>
                      </div>
                    </td>

                    {/* Motivo */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="text-slate-600 block line-clamp-2" title={row.reason}>
                        {row.reason}
                      </span>
                    </td>

                    {/* Iniciado em */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {formatDateTime(row.startedAt)}
                    </td>

                    {/* Encerrado em */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {row.endedAt ? formatDateTime(row.endedAt) : "-"}
                    </td>

                    {/* Duração */}
                    <td className="py-3.5 px-4 text-center font-medium text-slate-700 whitespace-nowrap">
                      {row.duration || "-"}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {row.status === "completed" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={12} /> Concluída
                        </span>
                      )}
                      {row.status === "in-progress" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 animate-pulse">
                          <Radio size={12} className="text-blue-600" /> Em andamento
                        </span>
                      )}
                      {row.status === "expired" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <AlertTriangle size={12} /> Expirada (TTL)
                        </span>
                      )}
                    </td>

                    {/* Detalhes Técnicos */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setTechnicalModalRow(row)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition cursor-pointer"
                        title="Ver detalhes técnicos (IP, User Agent, IDs)"
                      >
                        <Info size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 bg-slate-50 gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Exibindo página <strong className="text-slate-800">{page}</strong> de{" "}
            <strong className="text-slate-800">{totalPages}</strong> ({totalCount} sessões no total)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Próxima <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE DETALHES TÉCNICOS DA SESSÃO */}
      {technicalModalRow && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Detalhes Técnicos da Sessão</h3>
                  <p className="text-xs text-slate-400">Trilha de conformidade e auditoria forense</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTechnicalModalRow(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  ID do Registro de Auditoria
                </span>
                <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-800 block break-all">
                  {technicalModalRow.id}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    ID do Super Admin
                  </span>
                  <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-800 block break-all">
                    {technicalModalRow.superAdminId}
                  </code>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    ID do Usuário-Alvo
                  </span>
                  <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-800 block break-all">
                    {technicalModalRow.targetUserId}
                  </code>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Endereço IP de Origem
                </span>
                <div className="font-mono text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs">
                  {technicalModalRow.ipAddress || "Não registrado"}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  User Agent do Navegador
                </span>
                <div className="font-mono text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs break-all leading-relaxed">
                  {technicalModalRow.userAgent || "Não registrado"}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Motivo Declarado
                </span>
                <p className="text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs italic">
                  "{technicalModalRow.reason}"
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setTechnicalModalRow(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
