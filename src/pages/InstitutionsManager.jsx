import { useState, useEffect } from "react"
import { 
  Building, Plus, Search, MoreVertical, LogOut, 
  ShieldAlert, X, Edit, Trash2, Ban, CheckCircle, Users 
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function InstitutionsManager() {
  const navigate = useNavigate()
  
  // Estados Principais
  const [institutions, setInstitutions] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  
  // Estados de UI (Modais e Menus)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [dropdownOpenId, setDropdownOpenId] = useState(null)
  
  // Estados do Formulário (Alterado o padrão de "Pro" para "Basic")
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    plan: "Basic"
  })

  // Carrega os dados ao iniciar e limpa cadastros legados com "Pro"
  useEffect(() => {
    const savedSchools = JSON.parse(localStorage.getItem("@SmartExit:schools")) || []
    
    // Mapeia as escolas antigas: se alguma ainda for "Pro", converte automaticamente para "Basic"
    const sanitizedSchools = savedSchools.map(school => ({
      ...school,
      plan: school.plan === "Pro" ? "Basic" : (school.plan || "Basic")
    }))
    
    setInstitutions(sanitizedSchools)
  }, [])

  // Salva no LocalStorage sempre que 'institutions' mudar
  useEffect(() => {
    localStorage.setItem("@SmartExit:schools", JSON.stringify(institutions))
  }, [institutions])

  // Métricas do Dashboard
  const totalInstitutions = institutions.length
  const activeInstitutions = institutions.filter(s => s.status === "Ativo").length
  const totalStudents = institutions.reduce((acc, curr) => acc + (curr.students || 0), 0)

  // Filtro de Busca
  const filteredInstitutions = institutions.filter(school => 
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Ações
  function handleLogout() {
    navigate("/login")
  }

  function openCreateModal() {
    setEditingId(null)
    setFormData({ name: "", email: "", password: "", plan: "Basic" }) // Alterado para "Basic"
    setIsModalOpen(true)
    setDropdownOpenId(null)
  }

  function openEditModal(school) {
    setEditingId(school.id)
    setFormData({ 
      name: school.name, 
      email: school.email, 
      password: school.password,
      plan: school.plan === "Pro" ? "Basic" : (school.plan || "Basic") // Proteção contra o legado "Pro"
    })
    setIsModalOpen(true)
    setDropdownOpenId(null)
  }

  function handleSaveSchool(e) {
    e.preventDefault()

    if (editingId) {
      // Editando
      setInstitutions(institutions.map(school => 
        school.id === editingId ? { ...school, ...formData } : school
      ))
    } else {
      // Criando nova
      const newSchool = {
        id: Date.now(),
        ...formData,
        status: "Ativo",
        students: 0,
        exits: [] 
      }
      setInstitutions([...institutions, newSchool])
    }
    
    setIsModalOpen(false)
  }

  function handleDelete(id) {
    if (window.confirm("Tem certeza que deseja excluir esta instituição? Todos os dados serão perdidos.")) {
      setInstitutions(institutions.filter(school => school.id !== id))
    }
    setDropdownOpenId(null)
  }

  function handleToggleStatus(id) {
    setInstitutions(institutions.map(school => {
      if (school.id === id) {
        return { ...school, status: school.status === "Ativo" ? "Inativo" : "Ativo" }
      }
      return school
    }))
    setDropdownOpenId(null)
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
          className="flex items-center gap-2 text-slate-300 hover:text-white transition bg-white/10 hover:bg-red-500/20 hover:text-red-400 px-4 py-2 rounded-lg"
        >
          <LogOut size={18} />
          Sair
        </button>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        
        {/* CABEÇALHO DA PÁGINA */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Visão Geral</h2>
            <p className="text-slate-500 mt-1">Gerencie seu SaaS e as escolas clientes.</p>
          </div>
          
          <button 
            onClick={openCreateModal}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition"
          >
            <Plus size={20} />
            Nova Instituição
          </button>
        </div>

        {/* CARDS DE MÉTRICAS */}
        <div className="grid grid-cols-3 gap-6 mb-8">
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
              placeholder="Buscar por nome ou e-mail..." 
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
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${school.status === 'Ativo' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                      <Building size={20} />
                    </div>
                    <span className="font-semibold text-slate-800 truncate" title={school.name}>{school.name}</span>
                  </div>
                  
                  {/* Email e Plano */}
                  <div>
                    <p className="text-slate-600 text-sm font-medium">{school.email}</p>
                    <p className="text-xs text-orange-500 font-bold uppercase mt-0.5">Plano {school.plan}</p>
                  </div>

                  {/* Alunos */}
                  <p className="text-slate-600 font-medium">{school.students}</p>
                  
                  {/* Status */}
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      school.status === 'Ativo' 
                        ? 'bg-green-50 text-green-600 border-green-200' 
                        : 'bg-red-50 text-red-500 border-red-200'
                    }`}>
                      {school.status}
                    </span>
                  </div>

                  {/* Botão de Ações (3 pontinhos) */}
                  <div className="relative">
                    <button 
                      onClick={() => setDropdownOpenId(dropdownOpenId === school.id ? null : school.id)}
                      className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition"
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
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Edit size={16} /> Editar Dados
                          </button>
                          
                          <button 
                            onClick={() => handleToggleStatus(school.id)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Ban size={16} className={school.status === 'Ativo' ? 'text-orange-500' : 'text-green-500'} /> 
                            {school.status === 'Ativo' ? 'Suspender Acesso' : 'Reativar Acesso'}
                          </button>
                          
                          <div className="h-px bg-slate-100 my-1" />
                          
                          <button 
                            onClick={() => handleDelete(school.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
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
      </main>

      {/* MODAL DE CRIAR/EDITAR ESCOLA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">
                {editingId ? "Editar Instituição" : "Nova Instituição"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition bg-white rounded-full p-1 shadow-sm">
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
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Colégio Adventista" 
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">E-mail do Responsável</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="ti@escola.com.br" 
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Senha de Acesso</label>
                <input 
                  required
                  type="text" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Ex: mudar123" 
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:border-orange-500 focus:bg-white transition"
                />
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
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-orange-500/20"
                >
                  {editingId ? "Salvar Alterações" : "Gerar Acesso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}