import { useEffect, useState } from "react"
import { BookOpen, Pencil, Plus } from "lucide-react"
import { academicLevelService } from "../services/academicLevelService.js"
import { academicGroupService } from "../services/academicGroupService.js"
import { shiftLabel, sortShifts } from "../services/academicShiftLabels.js"

export default function AcademicStructureSection({ schoolId }) {
  const [levelsList, setLevelsList] = useState([]);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const [levelsSaving, setLevelsSaving] = useState(false);
  const [levelsError, setLevelsError] = useState("");
  const [editingLevelId, setEditingLevelId] = useState(null);
  const [levelFormName, setLevelFormName] = useState("");
  const [groupsList, setGroupsList] = useState([]);
  const [shiftsList, setShiftsList] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsSaving, setGroupsSaving] = useState(false);
  const [groupsError, setGroupsError] = useState("");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupFormName, setGroupFormName] = useState("");
  const [groupFormLevelId, setGroupFormLevelId] = useState("");
  const [groupFormShiftId, setGroupFormShiftId] = useState("");

  useEffect(() => {
    if (!schoolId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const [levelsResult, groupsResult, shiftsResult] = await Promise.all([
        academicLevelService.listForSchool(schoolId),
        academicGroupService.listForSchool(schoolId),
        academicGroupService.listShifts()
      ]);

      if (cancelled) {
        return;
      }

      if (levelsResult.error) {
        console.error(levelsResult.error);
        setLevelsList([]);
        setLevelsError("Não foi possível carregar os níveis acadêmicos.");
      } else {
        setLevelsList(levelsResult.data);
        setLevelsError("");
      }

      if (groupsResult.error) {
        console.error(groupsResult.error);
        setGroupsList([]);
        setGroupsError("Não foi possível carregar as turmas.");
      } else {
        setGroupsList(groupsResult.data);
        setGroupsError("");
      }

      if (shiftsResult.error) {
        console.error(shiftsResult.error);
        setShiftsList([]);
        setGroupsError((current) => current || "Não foi possível carregar os turnos.");
      } else {
        setShiftsList(sortShifts(shiftsResult.data));
      }

      setLevelsLoading(false);
      setGroupsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  const levelNameById = new Map(levelsList.map((level) => [level.id, level.name]));
  const shiftById = new Map(shiftsList.map((shift) => [shift.id, shift]));
  const levelOptions = levelsList.filter((level) => level.status !== "inactive" || level.id === groupFormLevelId);

  async function reloadAcademicStructure() {
    if (!schoolId) {
      setLevelsError("Escola autorizada ausente.");
      setGroupsError("Escola autorizada ausente.");
      return null;
    }

    const [levelsResult, groupsResult] = await Promise.all([
      academicLevelService.listForSchool(schoolId),
      academicGroupService.listForSchool(schoolId)
    ]);

    if (levelsResult.error) {
      console.error(levelsResult.error);
      setLevelsError("Não foi possível atualizar os níveis acadêmicos.");
    } else {
      setLevelsList(levelsResult.data);
      setLevelsError("");
    }

    if (groupsResult.error) {
      console.error(groupsResult.error);
      setGroupsError("Não foi possível atualizar as turmas.");
    } else {
      setGroupsList(groupsResult.data);
      setGroupsError("");
    }

    if (levelsResult.error || groupsResult.error) {
      return null;
    }

    return { levels: levelsResult.data, groups: groupsResult.data };
  }

  function resetLevelForm() {
    setEditingLevelId(null);
    setLevelFormName("");
    setLevelsError("");
  }

  async function handleSubmitLevel(e) {
    e.preventDefault();

    if (!schoolId || !levelFormName.trim()) {
      setLevelsError("Informe o nome do nível acadêmico.");
      return;
    }

    setLevelsSaving(true);
    setLevelsError("");

    const result = editingLevelId
      ? await academicLevelService.updateLevel(schoolId, editingLevelId, { name: levelFormName })
      : await academicLevelService.createLevel(schoolId, { name: levelFormName, existingLevels: levelsList });

    if (result.error || !result.data) {
      console.error(result.error);
      setLevelsError(result.error?.message || "Não foi possível salvar o nível acadêmico.");
      setLevelsSaving(false);
      return;
    }

    const reloaded = await reloadAcademicStructure();
    setLevelsSaving(false);

    if (!reloaded) {
      return;
    }

    resetLevelForm();
  }

  async function handleToggleLevelStatus(level) {
    if (!schoolId) {
      setLevelsError("Escola autorizada ausente.");
      return;
    }

    setLevelsSaving(true);
    setLevelsError("");
    const nextStatus = level.status === "inactive" ? "active" : "inactive";
    const { error } = await academicLevelService.setLevelStatus(schoolId, level.id, nextStatus);
    setLevelsSaving(false);

    if (error) {
      console.error(error);
      setLevelsError(error.message || "Não foi possível alterar o status do nível.");
      return;
    }

    await reloadAcademicStructure();
  }

  function resetGroupForm() {
    setEditingGroupId(null);
    setGroupFormName("");
    setGroupFormLevelId("");
    setGroupFormShiftId("");
    setGroupsError("");
  }

  async function handleSubmitGroup(e) {
    e.preventDefault();

    if (!schoolId || !groupFormName.trim() || !groupFormLevelId || !groupFormShiftId) {
      setGroupsError("Informe nome, nível acadêmico e turno.");
      return;
    }

    setGroupsSaving(true);
    setGroupsError("");

    const payload = {
      name: groupFormName,
      academicLevelId: groupFormLevelId,
      academicShiftId: groupFormShiftId
    };
    const result = editingGroupId
      ? await academicGroupService.updateGroup(schoolId, editingGroupId, payload)
      : await academicGroupService.createGroup(schoolId, { ...payload, existingGroups: groupsList });

    if (result.error || !result.data) {
      console.error(result.error);
      setGroupsError(result.error?.message || "Não foi possível salvar a turma.");
      setGroupsSaving(false);
      return;
    }

    const reloaded = await reloadAcademicStructure();
    setGroupsSaving(false);

    if (!reloaded) {
      return;
    }

    resetGroupForm();
  }

  async function handleToggleGroupStatus(group) {
    if (!schoolId) {
      setGroupsError("Escola autorizada ausente.");
      return;
    }

    setGroupsSaving(true);
    setGroupsError("");
    const nextStatus = group.status === "inactive" ? "active" : "inactive";
    const { error } = await academicGroupService.setGroupStatus(schoolId, group.id, nextStatus);
    setGroupsSaving(false);

    if (error) {
      console.error(error);
      setGroupsError(error.message || "Não foi possível alterar o status da turma.");
      return;
    }

    await reloadAcademicStructure();
  }

  return (
    <div className="p-8 flex-1 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuração acadêmica</h1>
        <p className="text-slate-500">Cadastre os níveis e as turmas desta escola.</p>
      </div>

      <div className={`p-6 rounded-2xl border shadow-sm mb-8 transition-colors max-w-3xl ${editingLevelId ? "border-secondary bg-slate-50 dark:bg-slate-900/50" : "bg-white border-slate-200 dark:bg-[#1a1a1a] dark:border-[#2a2a2a]"}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-bold flex items-center gap-2 ${editingLevelId ? "text-secondary" : "text-slate-800 dark:text-white"}`}>
            {editingLevelId ? <Pencil size={20} className="text-secondary" /> : <Plus size={20} className="text-primary" />}
            {editingLevelId ? "Editando Nível" : "Cadastrar Nível Acadêmico"}
          </h3>
          {editingLevelId && (
            <button type="button" onClick={resetLevelForm} className="text-slate-500 hover:text-red-500 text-sm font-bold bg-white dark:bg-[#2a2a2a] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#333333]">
              Cancelar
            </button>
          )}
        </div>
        {levelsError && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold border border-red-100">
            {levelsError}
          </div>
        )}
        <form onSubmit={handleSubmitLevel} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do Nível</label>
            <input type="text" required disabled={levelsSaving} value={levelFormName} onChange={e => setLevelFormName(e.target.value)} className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-3 outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white" placeholder="Ex: Ensino Fundamental" />
          </div>
          <button type="submit" disabled={levelsSaving} className={`h-[50px] font-bold px-6 rounded-xl transition shadow-lg text-white hover:opacity-90 disabled:opacity-60 ${editingLevelId ? "bg-secondary" : "bg-primary"}`}>
            {levelsSaving ? "Salvando..." : editingLevelId ? "Salvar" : "Adicionar"}
          </button>
        </form>
      </div>

      <div className="max-w-3xl bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden mb-10">
        <div className="p-4 border-b border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
          <span>Níveis Acadêmicos</span>
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md text-xs">{levelsList.length}</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-[#2a2a2a]">
          {levelsLoading ? (
            <p className="p-8 text-center text-slate-500">Carregando níveis...</p>
          ) : levelsList.length === 0 ? (
            <p className="p-8 text-center text-slate-500">Nenhum nível cadastrado.</p>
          ) : levelsList.map((level) => (
            <div key={level.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800 dark:text-white">{level.name}</p>
                <p className="text-sm text-slate-500">{level.status === "inactive" ? "Inativo" : "Ativo"}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setEditingLevelId(level.id); setLevelFormName(level.name); setLevelsError(""); }} className="p-2 text-secondary hover:bg-slate-100 dark:hover:bg-[#2a2a2a] rounded-lg transition"><Pencil size={20} /></button>
                <button type="button" disabled={levelsSaving} onClick={() => handleToggleLevelStatus(level)} className="px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] rounded-lg transition disabled:opacity-60">
                  {level.status === "inactive" ? "Ativar" : "Inativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`p-6 rounded-2xl border shadow-sm mb-8 transition-colors max-w-3xl ${editingGroupId ? "border-secondary bg-slate-50 dark:bg-slate-900/50" : "bg-white border-slate-200 dark:bg-[#1a1a1a] dark:border-[#2a2a2a]"}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-bold flex items-center gap-2 ${editingGroupId ? "text-secondary" : "text-slate-800 dark:text-white"}`}>
            {editingGroupId ? <Pencil size={20} className="text-secondary" /> : <BookOpen size={20} className="text-primary" />}
            {editingGroupId ? "Editando Turma" : "Cadastrar Nova Turma"}
          </h3>
          {editingGroupId && (
            <button type="button" onClick={resetGroupForm} className="text-slate-500 hover:text-red-500 text-sm font-bold bg-white dark:bg-[#2a2a2a] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#333333]">
              Cancelar
            </button>
          )}
        </div>
        {groupsError && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold border border-red-100">
            {groupsError}
          </div>
        )}
        <form onSubmit={handleSubmitGroup} className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome da Turma</label>
            <input type="text" required disabled={groupsSaving} value={groupFormName} onChange={e => setGroupFormName(e.target.value)} className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-3 outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white" placeholder="Ex: 5º Ano A" />
          </div>
          <div className="w-56">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nível acadêmico</label>
            <select required disabled={groupsSaving} value={groupFormLevelId} onChange={e => setGroupFormLevelId(e.target.value)} className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-3 outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white">
              <option value="">Selecione...</option>
              {levelOptions.map((level) => (
                <option key={level.id} value={level.id}>{level.name}{level.status === "inactive" ? " (inativo)" : ""}</option>
              ))}
            </select>
          </div>
          <div className="w-44">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Turno</label>
            <select required disabled={groupsSaving} value={groupFormShiftId} onChange={e => setGroupFormShiftId(e.target.value)} className="w-full border border-slate-200 dark:border-[#2a2a2a] rounded-xl p-3 outline-none focus:border-primary bg-white dark:bg-[#1a1a1a] dark:text-white">
              <option value="">Selecione...</option>
              {shiftsList.map((shift) => (
                <option key={shift.id} value={shift.id}>{shiftLabel(shift.name)}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={groupsSaving} className={`h-[50px] font-bold px-6 rounded-xl transition shadow-lg text-white hover:opacity-90 disabled:opacity-60 ${editingGroupId ? "bg-secondary" : "bg-primary"}`}>
            {groupsSaving ? "Salvando..." : editingGroupId ? "Salvar" : "Adicionar"}
          </button>
        </form>
      </div>

      <div className="max-w-3xl bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a] font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
          <span>Turmas</span>
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md text-xs">{groupsList.length}</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-[#2a2a2a]">
          {groupsLoading ? (
            <p className="p-8 text-center text-slate-500">Carregando turmas...</p>
          ) : groupsList.length === 0 ? (
            <p className="p-8 text-center text-slate-500">Nenhuma turma cadastrada.</p>
          ) : groupsList.map((group) => (
            <div key={group.id} className="p-4 flex justify-between items-center gap-4">
              <div>
                <p className="font-bold text-slate-800 dark:text-white">{group.name}</p>
                <p className="text-sm text-slate-500">
                  {levelNameById.get(group.academic_level_id) || "Nível indisponível"}
                  {" • "}
                  {shiftLabel(shiftById.get(group.academic_shift_id)?.name)}
                  {" • "}
                  {group.status === "inactive" ? "Inativo" : "Ativo"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => { setEditingGroupId(group.id); setGroupFormName(group.name); setGroupFormLevelId(group.academic_level_id); setGroupFormShiftId(group.academic_shift_id); setGroupsError(""); }} className="p-2 text-secondary hover:bg-slate-100 dark:hover:bg-[#2a2a2a] rounded-lg transition"><Pencil size={20} /></button>
                <button type="button" disabled={groupsSaving} onClick={() => handleToggleGroupStatus(group)} className="px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] rounded-lg transition disabled:opacity-60">
                  {group.status === "inactive" ? "Ativar" : "Inativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
