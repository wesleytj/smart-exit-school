import { useEffect, useState } from "react"
import { Calendar, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { schoolYearService } from "../services/schoolYearService.js"

export default function SchoolYearsSection({ schoolId, onYearActivated }) {
  const [yearsList, setYearsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activatingId, setActivatingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formYear, setFormYear] = useState(new Date().getFullYear() + 1);
  const [formStartsAt, setFormStartsAt] = useState(`${new Date().getFullYear() + 1}-01-01`);
  const [formEndsAt, setFormEndsAt] = useState(`${new Date().getFullYear() + 1}-12-31`);
  const [formIsActive, setFormIsActive] = useState(false);

  useEffect(() => {
    if (!schoolId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      const result = await schoolYearService.listYears(schoolId);
      if (cancelled) return;

      if (result.error) {
        console.error(result.error);
        setError("Não foi possível carregar os anos letivos.");
        setYearsList([]);
      } else {
        setYearsList(result.data);
        setError("");
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  async function reloadYears() {
    if (!schoolId) return;
    const result = await schoolYearService.listYears(schoolId);
    if (!result.error) {
      setYearsList(result.data);
      setError("");
    }
  }

  function handleYearChange(newYear) {
    setFormYear(newYear);
    setFormStartsAt(`${newYear}-01-01`);
    setFormEndsAt(`${newYear}-12-31`);
  }

  async function handleCreateYear(e) {
    e.preventDefault();
    if (!schoolId) {
      setError("Escola autorizada ausente.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    const result = await schoolYearService.createYear(schoolId, {
      year: formYear,
      startsAt: formStartsAt,
      endsAt: formEndsAt,
      isActive: formIsActive
    });

    setSaving(false);

    if (result.error) {
      console.error(result.error);
      setError(result.error.message || "Não foi possível criar o ano letivo.");
      return;
    }

    setSuccessMessage(`Ano letivo ${formYear} cadastrado com sucesso.`);
    await reloadYears();

    if (formIsActive && onYearActivated) {
      onYearActivated(result.data);
    }

    setFormYear(Number(formYear) + 1);
    setFormStartsAt(`${Number(formYear) + 1}-01-01`);
    setFormEndsAt(`${Number(formYear) + 1}-12-31`);
    setFormIsActive(false);
  }

  async function handleActivateYear(yearRow) {
    if (!schoolId || yearRow.is_active) {
      return;
    }

    setActivatingId(yearRow.id);
    setError("");
    setSuccessMessage("");

    const result = await schoolYearService.activateYear(schoolId, yearRow.id);
    setActivatingId(null);

    if (result.error) {
      console.error(result.error);
      setError(result.error.message || "Não foi possível ativar o ano letivo.");
      return;
    }

    setSuccessMessage(`Ano letivo ${yearRow.year} ativado com sucesso.`);
    await reloadYears();

    if (onYearActivated) {
      onYearActivated(result.data);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    const parts = String(dateStr).slice(0, 10).split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  return (
    <div className="p-8 flex-1 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Calendar className="text-primary" size={28} />
          Anos Letivos
        </h1>
        <p className="text-slate-500 mt-1">
          Configure os períodos letivos da escola e defina qual ano está ativo para chamadas operacionais e matrículas.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-semibold border border-red-100 dark:border-red-500/20 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-xl text-sm font-semibold border border-green-200 dark:border-green-500/20 flex items-center gap-2">
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      )}

      {/* Card Novo Ano Letivo */}
      <div className="p-6 rounded-2xl border bg-white border-slate-200 dark:bg-[#1a1a1a] dark:border-[#2a2a2a] shadow-sm mb-8">
        <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white mb-4">
          <Plus size={20} className="text-primary" />
          Cadastrar Novo Ano Letivo
        </h3>

        <form onSubmit={handleCreateYear} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ano
              </label>
              <input
                type="number"
                min="2020"
                max="2100"
                required
                value={formYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-3 outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Início do Período
              </label>
              <input
                type="date"
                required
                value={formStartsAt}
                onChange={(e) => setFormStartsAt(e.target.value)}
                className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-3 outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Término do Período
              </label>
              <input
                type="date"
                required
                value={formEndsAt}
                onChange={(e) => setFormEndsAt(e.target.value)}
                className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-3 outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-primary rounded"
              />
              Definir como ano letivo ativo imediatamente
            </label>

            <button
              type="submit"
              disabled={saving}
              className="bg-primary hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition shadow-md flex items-center gap-2"
            >
              <Plus size={18} />
              {saving ? "Salvando..." : "Cadastrar Ano Letivo"}
            </button>
          </div>
        </form>
      </div>

      {/* Listagem de Anos Letivos */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] font-semibold text-slate-700 dark:text-slate-300 flex justify-between items-center">
          <span>Anos Cadastrados</span>
          <span className="bg-slate-200 dark:bg-[#2a2a2a] text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-md text-xs font-bold">
            {yearsList.length}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-[#2a2a2a]">
          {loading && (
            <p className="p-6 text-sm text-slate-500 flex items-center gap-2">
              <Clock size={16} className="animate-spin text-primary" /> Carregando anos letivos...
            </p>
          )}

          {!loading && yearsList.length === 0 && (
            <p className="p-6 text-sm text-slate-500">Nenhum ano letivo cadastrado.</p>
          )}

          {yearsList.map((yearRow) => (
            <div
              key={yearRow.id}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-slate-50/50 dark:hover:bg-[#2a2a2a]/40 ${
                yearRow.is_active ? "bg-orange-500/5 dark:bg-orange-500/10" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    yearRow.is_active
                      ? "bg-primary text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {yearRow.year}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      Ano Letivo {yearRow.year}
                    </h4>
                    {yearRow.is_active ? (
                      <span className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Ativo
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-xs px-2.5 py-0.5 rounded-full font-medium">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Período: {formatDate(yearRow.starts_at)} até {formatDate(yearRow.ends_at)}
                  </p>
                </div>
              </div>

              <div>
                {yearRow.is_active ? (
                  <span className="text-xs font-semibold text-primary px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Ano Operacional Ativo
                  </span>
                ) : (
                  <button
                    onClick={() => handleActivateYear(yearRow)}
                    disabled={activatingId === yearRow.id}
                    className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-100 hover:bg-primary hover:text-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-primary dark:hover:text-white border border-slate-200 dark:border-slate-700 transition shadow-sm disabled:opacity-50"
                  >
                    {activatingId === yearRow.id ? "Ativando..." : "Definir como Ativo"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
