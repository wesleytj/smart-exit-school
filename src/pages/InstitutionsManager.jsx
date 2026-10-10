import { useState, useEffect } from "react"
import { 
  Building, Plus, Search, MoreVertical, LogOut, 
  ShieldAlert, X, Edit, Trash2, Ban, CheckCircle, Users,
  LogIn, Clock, RefreshCw, Loader2, KeyRound
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { schoolService } from "../services/schoolService"
import { impersonationService } from "../services/impersonationService"
import { usePlatformAdmin } from "../hooks/usePlatformAdmin"
import { supabase } from "../lib/supabase"

export default function InstitutionsManager() {
  const navigate = useNavigate()
  const { isPlatformAdmin, isLoading: isPlatformAdminLoading } = usePlatformAdmin()
  
  // Controle de Abas Super Admin ('institutions' | 'users')
  const [activeTab, setActiveTab] = useState("institutions")

  // Estados Principais de Instituições
  const [institutions, setInstitutions] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  
  // Estados de UI (Modais e Menus de Instituições)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [dropdownOpenId, setDropdownOpenId] = useState(null)
  
  // Estados do Formulário de Instituições
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    plan: "Basic"
  })
  const [formError, setFormError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados do Catálogo de Usuários (Impersonation)
  const [usersList, setUsersList] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersSearch, setUsersSearch] = useState("")
  const [usersSchoolFilter, setUsersSchoolFilter] = useState("")
  const [usersError, setUsersError] = useState("")

  // Estados do Modal de Impersonation
  const [impersonationTarget, setImpersonationTarget] = useState(null)
  const [impersonationReason, setImpersonationReason] = useState("")
  const [impersonationLoading, setImpersonationLoading] = useState(false)
  const [impersonationError, setImpersonationError] = useState("")

  useEffect(() => {
    if (!isPlatformAdminLoading && !isPlatformAdmin) {
      navigate("/login", { replace: true })
    }
  }, [isPlatformAdmin, isPlatformAdminLoading, navigate])

  useEffect(() => {
    if (!isPlatformAdmin) {
      return
    }

    void loadInstitutions()
  }, [isPlatformAdmin])

  async function loadInstitutions() {
    const savedSchools = await schoolService.getAllSchools()
    setInstitutions(savedSchools)
  }

  useEffect(() => {
    if (!isPlatformAdmin || activeTab !== "users") {
      return
    }

    void loadUsers(usersSearch, usersSchoolFilter)
  }, [activeTab, isPlatformAdmin, usersSchoolFilter, usersSearch])

  async function loadUsers(search = usersSearch, schoolFilter = usersSchoolFilter) {
    try {
      const { data, error } = await impersonationService.listPlatformUsers({
        search: search.trim() || null,
        schoolId: schoolFilter || null,
        limit: 100
      })
      if (error) {
        setUsersError(error.message || "Erro ao consultar usuários da plataforma.")
        setUsersList([])
      } else {
        setUsersList(data || [])
        setUsersError("")
      }
    } catch (err) {
      setUsersError(err.message || "Falha na comunicação com o servidor.")
      setUsersList([])
    } finally {
      setUsersLoading(false)
    }
  }

  // Métricas do Dashboard de Instituições
  const totalInstitutions = institutions.length
  const activeInstitutions = institutions.filter(s => isActiveSchoolStatus(s.status)).length
  const totalStudents = institutions.reduce((acc, curr) => acc + (curr.students || 0), 0)

  // Filtro de Busca de Instituições
  const filteredInstitutions = institutions.filter(school => {
    const name = (school.name || "").toLowerCase()
    const email = (school.email || school.slug || "").toLowerCase()
    const query = searchQuery.toLowerCase()
    return name.includes(query) || email.includes(query)
  })

  // Ações
  async function handleLogout() {
    await supabase.auth.signOut()
    navigate("/login")
  }

  if (isPlatformAdminLoading || !isPlatformAdmin) {
    return null
  }

  function isActiveSchoolStatus(status) {
    const normalized = String(status || "").toLowerCase()
    return normalized === "ativo" || normalized === "active"
  }

  function toUiPlan(plan) {
    const normalized = String(plan || "").toLowerCase()
    if (normalized === "pro" || normalized === "premium") return "Premium"
    if (normalized === "enterprise" || normalized === "diamond") return "Diamond"
    if (normalized === "trial") return "Trial"
    return "Basic"
  }

  function formatDateTime(isoString) {
    if (!isoString) return "Nunca acessou"
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } catch {
      return isoString
    }
  }

  function openCreateModal() {
    setEditingId(null)
    setFormData({ name: "", plan: "Basic" })
    setFormError("")
    setIsSubmitting(false)
    setIsModalOpen(true)
    setDropdownOpenId(null)
  }

  function openEditModal(school) {
    setEditingId(school.id)
    setFormData({
      name: school.name,
      plan: toUiPlan(school.plan)
    })
    setFormError("")
    setIsSubmitting(false)
    setIsModalOpen(true)
    setDropdownOpenId(null)
  }

  async function handleSaveSchool(e) {
    e.preventDefault()

    if (isSubmitting) {
      return
    }

    const name = (formData.name || "").trim()
    if (!name) {
      setFormError("Informe o nome da instituição.")
      return
    }

    setIsSubmitting(true)

    try {
      if (await schoolService.isSchoolNameTaken(name, editingId)) {
        setFormError("Já existe uma instituição com este nome.")
        return
      }

      const payload = editingId
        ? { id: editingId, name, plan: formData.plan }
        : { name, plan: formData.plan, status: "active" }

      const savedSchool = await schoolService.saveSchool(payload)
      if (!savedSchool) {
        const nameTaken = await schoolService.isSchoolNameTaken(name, editingId)
        setFormError(
          nameTaken
            ? "Já existe uma instituição com este nome."
            : "Não foi possível salvar a instituição. Verifique o nome e tente novamente."
        )
        return
      }

      await loadInstitutions()
      setFormError("")
      setIsModalOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (window.confirm("Tem certeza que deseja excluir esta instituição? Todos os dados serão perdidos.")) {
      const deleted = await schoolService.deleteSchool(id)
      if (deleted) {
        await loadInstitutions()
      }
    }
    setDropdownOpenId(null)
  }

  async function handleToggleStatus(id) {
    const current = institutions.find(school => school.id === id)
    if (!current) {
      setDropdownOpenId(null)
      return
    }

    const nextStatus = isActiveSchoolStatus(current.status) ? "inactive" : "active"
    const savedSchool = await schoolService.saveSchool({
      ...current,
      status: nextStatus
    })

    if (savedSchool) {
      await loadInstitutions()
    }
    setDropdownOpenId(null)
  }

  // --- Handlers de Impersonation ---
  function openImpersonationModal(user) {
    setImpersonationTarget(user)
    setImpersonationReason("")
    setImpersonationError("")
    setImpersonationLoading(false)
  }

  function closeImpersonationModal() {
    if (impersonationLoading) return
    setImpersonationTarget(null)
    setImpersonationReason("")
    setImpersonationError("")
  }

  async function handleConfirmImpersonation(e) {
    e.preventDefault()
    if (!impersonationTarget || impersonationLoading) return

    const reason = impersonationReason.trim()
    if (reason.length < 5) {
      setImpersonationError("O motivo do acesso deve ter no mínimo 5 caracteres.")
      return
    }

    setImpersonationLoading(true)
    setImpersonationError("")

    try {
      const { data, error } = await impersonationService.startImpersonation({
        target_user_id: impersonationTarget.user_id,
        reason
      })

      if (error) {
        setImpersonationError(error.message || "Falha ao iniciar suporte.")
        setImpersonationLoading(false)
        return
      }

      const sessionResult = await impersonationService.enterImpersonationSession({
        token: data.access_token,
        target_user: data.target_user || {
          id: impersonationTarget.user_id,
          email: impersonationTarget.email,
          full_name: impersonationTarget.full_name,
          school_id: impersonationTarget.school_id,
          school_name: impersonationTarget.school_name
        },
        impersonation_log_id: data.impersonation_log_id,
        expires_at: data.expires_at
      })

      if (sessionResult.error) {
        setImpersonationError(`Falha ao ativar sessão de suporte local: ${sessionResult.error.message}`)
        setImpersonationLoading(false)
        return
      }

      setImpersonationTarget(null)
      navigate("/painel")
    } catch (err) {
      setImpersonationError(err.message || "Erro inesperado ao iniciar suporte.")
      setImpersonationLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col relative">
      
      {/* HEADER SUPER ADMIN */}
      <header className="bg-gradient-to-r from-[#020817] to-[#02142d] text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <ShieldAlert className="text-orange-500" size={28} />
          <div>
            <h1 className="text-xl font-bold">Painel Super Admin</h1>
            <p className="text-xs text-slate-400">AllTech Solutions - Master Control</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition bg-white/10 hover:bg-red-500/20 hover:text-red-400 px-4 py-2 rounded-lg cursor-pointer"
        >
          <LogOut size={18} />
          Sair
        </button>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        
        {/* NAVEGAÇÃO DE ABAS SUPER ADMIN */}
        <div className="flex items-center gap-2 mb-8 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("institutions")}
            className={`pb-4 px-5 font-bold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "institutions"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building size={18} />
            Instituições ({totalInstitutions})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("users")
              setUsersLoading(true)
            }}
            className={`pb-4 px-5 font-bold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "users"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users size={18} />
            Catálogo de Usuários & Suporte
          </button>
        </div>

        {/* ======================================================== */}
        {/* ABA 1: GESTÃO DE INSTITUIÇÕES */}
        {/* ======================================================== */}
        {activeTab === "institutions" && (
          <>
            {/* CABEÇALHO DA PÁGINA */}
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Visão Geral</h2>
                <p className="text-slate-500 mt-1">Gerencie seu SaaS e as escolas clientes.</p>
              </div>
              
              <button 
                onClick={openCreateModal}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition cursor-pointer"
              >
                <Plus size={20} />
                Nova Instituição
              </button>
            </div>

            {/* CARDS DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <Building size={28} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total de Escolas</p>
                  <h3 className="text-3xl font-bold text-slate-800">{totalInstitutions}</h3>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-medium">Escolas Ativas</p>
                  <h3 className="text-3xl font-bold text-slate-800">{activeInstitutions}</h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                  <Users size={28} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-medium">Alunos Gerenciados</p>
                  <h3 className="text-3xl font-bold text-slate-800">{totalStudents}</h3>
                </div>
              </div>
            </div>

            {/* BARRA DE BUSCA */}
            <div className="bg-white rounded-t-2xl border border-slate-200 border-b-0 p-4 shadow-sm">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar por nome ou slug..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* TABELA DE CLIENTES */}
            <div className="bg-white rounded-b-2xl border border-slate-200 overflow-visible shadow-sm relative z-0">
              <div className="grid grid-cols-[3fr_2fr_1fr_1fr_auto] px-6 py-4 border-b border-slate-100 bg-slate-50 text-sm font-semibold text-slate-600">
                <p>Nome da Instituição</p>
                <p>Acesso e Plano</p>
                <p>Alunos</p>
                <p>Status</p>
                <p className="text-center w-10">Ações</p>
              </div>

              <div className="divide-y divide-slate-100 pb-20">
                {filteredInstitutions.length === 0 ? (
                  <p className="p-8 text-center text-slate-500">Nenhuma escola encontrada.</p>
                ) : (
                  filteredInstitutions.map(school => (
                    <div key={school.id} className="grid grid-cols-[3fr_2fr_1fr_1fr_auto] px-6 py-4 items-center hover:bg-slate-50 transition relative">
                      
                      {/* Info Principal */}
                      <div className="flex items-center gap-3 pr-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isActiveSchoolStatus(school.status) ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                          <Building size={20} />
                        </div>
                        <span className="font-semibold text-slate-800 truncate" title={school.name}>{school.name}</span>
                      </div>
                      
                      {/* Email e Plano */}
                      <div>
                        <p className="text-slate-600 text-sm font-medium">{school.email || school.slug || "—"}</p>
                        <p className="text-xs text-orange-500 font-bold uppercase mt-0.5">Plano {toUiPlan(school.plan)}</p>
                      </div>

                      {/* Alunos */}
                      <p className="text-slate-600 font-medium">{school.students || 0}</p>
                      
                      {/* Status */}
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          isActiveSchoolStatus(school.status)
                            ? 'bg-green-50 text-green-600 border-green-200' 
                            : 'bg-red-50 text-red-500 border-red-200'
                        }`}>
                          {isActiveSchoolStatus(school.status) ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      {/* Botão de Ações (3 pontinhos) */}
                      <div className="relative">
                        <button 
                          onClick={() => setDropdownOpenId(dropdownOpenId === school.id ? null : school.id)}
                          className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                        >
                          <MoreVertical size={20} />
                        </button>

                        {/* Menu Dropdown */}
                        {dropdownOpenId === school.id && (
                          <>
                            {/* Overlay invisível para fechar ao clicar fora */}
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setDropdownOpenId(null)}
                            />
                            
                            <div className="absolute right-0 top-10 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden py-1">
                              <button 
                                onClick={() => openEditModal(school)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Edit size={16} /> Editar Dados
                              </button>
                              
                              <button 
                                onClick={() => handleToggleStatus(school.id)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Ban size={16} className={isActiveSchoolStatus(school.status) ? 'text-orange-500' : 'text-green-500'} /> 
                                {isActiveSchoolStatus(school.status) ? 'Suspender Acesso' : 'Reativar Acesso'}
                              </button>
                              
                              <div className="h-px bg-slate-100 my-1" />
                              
                              <button 
                                onClick={() => handleDelete(school.id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={16} /> Excluir Escola
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* ABA 2: CATÁLOGO DE USUÁRIOS & IMPERSONATION */}
        {/* ======================================================== */}
        {activeTab === "users" && (
          <div>
            {/* CABEÇALHO DA ABA DE USUÁRIOS */}
            <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Catálogo Global de Usuários</h2>
                <p className="text-slate-500 mt-1">
                  Localize contas de usuários e inicie sessões auditadas de suporte (duração máxima de 45 minutos).
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUsersLoading(true)
                  void loadUsers(usersSearch, usersSchoolFilter)
                }}
                disabled={usersLoading}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-60"
              >
                <RefreshCw size={18} className={usersLoading ? "animate-spin text-orange-500" : ""} />
                Atualizar Lista
              </button>
            </div>

            {/* BARRA DE FILTROS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar por nome, e-mail ou escola..." 
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setUsersLoading(true)
                      void loadUsers(usersSearch, usersSchoolFilter)
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={usersSchoolFilter}
                  onChange={(e) => {
                    const newFilter = e.target.value
                    setUsersSchoolFilter(newFilter)
                    setUsersLoading(true)
                    void loadUsers(usersSearch, newFilter)
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:bg-white transition text-sm font-medium w-full md:w-64"
                >
                  <option value="">Todas as Instituições</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setUsersLoading(true)
                    void loadUsers(usersSearch, usersSchoolFilter)
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 transition cursor-pointer shrink-0"
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* TABELA DE USUÁRIOS */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="grid grid-cols-[2.5fr_2fr_1.5fr_1.2fr_1.8fr_auto] px-6 py-4 border-b border-slate-100 bg-slate-50 text-sm font-semibold text-slate-600">
                <p>Usuário</p>
                <p>Instituição</p>
                <p>Papel</p>
                <p>Vínculo</p>
                <p>Último Acesso</p>
                <p className="text-right">Ação de Suporte</p>
              </div>

              {usersLoading ? (
                <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 size={36} className="animate-spin text-orange-500" />
                  <p className="font-medium text-sm">Carregando catálogo de usuários...</p>
                </div>
              ) : usersError ? (
                <div className="p-12 text-center">
                  <p className="text-red-500 font-semibold mb-2">Erro ao carregar usuários</p>
                  <p className="text-slate-500 text-sm">{usersError}</p>
                </div>
              ) : usersList.length === 0 ? (
                <div className="p-16 text-center text-slate-500">
                  <Users size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-700">Nenhum usuário encontrado</p>
                  <p className="text-sm text-slate-400 mt-1">Tente ajustar o termo de busca ou filtro de instituição.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {usersList.map((user) => (
                    <div 
                      key={`${user.user_id}-${user.school_id || 'noschool'}`} 
                      className="grid grid-cols-[2.5fr_2fr_1.5fr_1.2fr_1.8fr_auto] px-6 py-4 items-center hover:bg-slate-50 transition"
                    >
                      {/* Usuário (Nome + Email) */}
                      <div className="flex items-center gap-3 pr-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0 text-sm">
                          {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-900 truncate" title={user.full_name || user.email}>
                            {user.full_name || "Sem nome cadastrado"}
                          </p>
                          <p className="text-xs text-slate-500 truncate" title={user.email}>
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Instituição */}
                      <div className="pr-4 truncate">
                        {user.school_name ? (
                          <div className="flex items-center gap-1.5 text-slate-700 text-sm font-medium truncate" title={user.school_name}>
                            <Building size={15} className="text-slate-400 shrink-0" />
                            <span className="truncate">{user.school_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sem escola vinculada</span>
                        )}
                      </div>

                      {/* Papel */}
                      <div>
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {user.role_name || "Membro"}
                        </span>
                      </div>

                      {/* Status */}
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          user.member_status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : user.member_status === "invited"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-600"
                        }`}>
                          {user.member_status === "active" ? "Ativo" : user.member_status === "invited" ? "Convidado" : "Regular"}
                        </span>
                      </div>

                      {/* Último Acesso */}
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400 shrink-0" />
                        <span>{formatDateTime(user.last_sign_in_at)}</span>
                      </div>

                      {/* Ação de Impersonation */}
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => openImpersonationModal(user)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-amber-500/20 cursor-pointer"
                          title="Iniciar sessão de suporte como este usuário"
                        >
                          <LogIn size={15} />
                          <span>Entrar como</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* MODAL DE CRIAR/EDITAR ESCOLA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">
                {editingId ? "Editar Instituição" : "Nova Instituição"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-700 transition bg-white rounded-full p-1 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSchool} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Nome da Escola</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({...formData, name: e.target.value})
                    if (formError) {
                      setFormError("")
                    }
                  }}
                  placeholder="Ex: Colégio Adventista" 
                  aria-invalid={formError ? "true" : "false"}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:border-orange-500 focus:bg-white transition"
                />
                {formError && (
                  <p className="text-sm text-red-600 font-medium">{formError}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Plano</label>
                <select 
                  value={formData.plan}
                  onChange={(e) => setFormData({...formData, plan: e.target.value})}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:border-orange-500 focus:bg-white transition text-slate-700"
                >
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                  <option value="Diamond">Diamond</option>
                  <option value="Trial">Trial (Teste 14 dias)</option>
                </select>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  {isSubmitting
                    ? "Salvando..."
                    : editingId
                      ? "Salvar Alterações"
                      : "Cadastrar Instituição"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE IMPERSONATION (SUPORTE) */}
      {impersonationTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            
            {/* CABEÇALHO DO MODAL */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-amber-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Iniciar Sessão de Suporte</h3>
                  <p className="text-xs text-slate-500">Impersonation auditada de usuário</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={closeImpersonationModal}
                disabled={impersonationLoading}
                className="text-slate-400 hover:text-slate-700 transition bg-white rounded-full p-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORMULÁRIO */}
            <form onSubmit={handleConfirmImpersonation} className="p-6 space-y-5">
              
              {/* ALERTA DE AUDITORIA */}
              <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-amber-950 text-xs leading-relaxed">
                <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5 text-amber-900">Operação Sensível e Auditada:</span>
                  Você está prestes a entrar no painel escolar com a identidade deste usuário por até <strong>45 minutos</strong>. Todas as ações serão vinculadas ao seu ID de Super Admin e gravadas em <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] font-mono">public.impersonation_audit_logs</code>.
                </div>
              </div>

              {/* DADOS DO USUÁRIO ALVO */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Usuário Alvo:</span>
                  <span className="font-bold text-slate-900 text-right">{impersonationTarget.full_name || "Sem nome"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">E-mail:</span>
                  <span className="font-mono text-xs text-slate-700 text-right">{impersonationTarget.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Instituição:</span>
                  <span className="font-semibold text-slate-800 text-right">{impersonationTarget.school_name || "Nenhuma"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Papel:</span>
                  <span className="font-semibold text-slate-800 text-right">{impersonationTarget.role_name || "Membro"}</span>
                </div>
              </div>

              {/* MOTIVO (OBRIGATÓRIO) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Motivo do Acesso de Suporte <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs ${impersonationReason.trim().length >= 5 ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                    {impersonationReason.trim().length} / 5 caracs. mín.
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={impersonationReason}
                  onChange={(e) => {
                    setImpersonationReason(e.target.value)
                    if (impersonationError) setImpersonationError("")
                  }}
                  placeholder="Ex: Atendimento ao ticket #123 para verificar erro de permissão ou configuração de turmas..."
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:border-amber-500 focus:bg-white transition text-sm text-slate-800 resize-none"
                />
                {impersonationError && (
                  <p className="text-xs font-semibold text-red-600">{impersonationError}</p>
                )}
              </div>

              {/* AÇÕES */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeImpersonationModal}
                  disabled={impersonationLoading}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition text-sm cursor-pointer disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={impersonationLoading || impersonationReason.trim().length < 5}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
                >
                  {impersonationLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Cunhando Sessão...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={16} />
                      <span>Acessar como Usuário</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}