import { useState, useEffect } from "react"
import { 
  Users, UserCheck, Plus, X, RefreshCw, Trash2, Mail, 
  ShieldCheck, Clock, CheckCircle2, AlertCircle, Loader2 
} from "lucide-react"
import { invitationService } from "../services/invitationService"
import { authService } from "../services/authService"

const ROLE_BADGES = {
  owner: { label: "Proprietário(a)", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  administrator: { label: "Administrador(a)", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  secretary: { label: "Secretaria", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  gatekeeper: { label: "Portaria", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" }
}

export default function TeamManagementSection({ schoolId, isPlatformAdmin = false }) {
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Permissões do usuário logado
  const [currentUserRole, setCurrentUserRole] = useState("secretary")

  // Modal de Convite
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("secretary")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState("")
  const [revokingId, setRevokingId] = useState(null)
  const [resendingEmail, setResendingEmail] = useState(null)

  useEffect(() => {
    if (!schoolId) return

    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError("")

      try {
        const [membersRes, invitesRes, sessionRes] = await Promise.all([
          invitationService.listMembers(schoolId),
          invitationService.listInvitations(schoolId),
          authService.getSession()
        ])

        if (cancelled) return

        if (membersRes.error) {
          console.error("Erro ao carregar membros:", membersRes.error)
        } else {
          setMembers(membersRes.data || [])

          // Detectar role do usuário logado
          const currentUserId = sessionRes.data?.session?.user?.id
          if (currentUserId && membersRes.data) {
            const currentMember = membersRes.data.find(m => m.profile_id === currentUserId)
            if (currentMember?.roles?.name) {
              setCurrentUserRole(currentMember.roles.name)
            }
          }
        }

        if (invitesRes.error) {
          console.error("Erro ao carregar convites:", invitesRes.error)
        } else {
          setInvitations(invitesRes.data || [])
        }
      } catch {
        if (!cancelled) {
          setError("Falha ao comunicar com o servidor.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [schoolId])

  async function reloadData() {
    if (!schoolId) return
    const [membersRes, invitesRes] = await Promise.all([
      invitationService.listMembers(schoolId),
      invitationService.listInvitations(schoolId)
    ])

    if (!membersRes.error) setMembers(membersRes.data || [])
    if (!invitesRes.error) setInvitations(invitesRes.data || [])
  }

  // Enviar convite
  async function handleSendInvite(e) {
    e.preventDefault()
    setModalError("")

    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      setModalError("Informe um endereço de e-mail válido.")
      return
    }

    setIsSubmitting(true)

    const { data, error: inviteErr } = await invitationService.inviteMember({
      schoolId,
      email: inviteEmail.trim(),
      role: inviteRole
    })

    setIsSubmitting(false)

    if (inviteErr || !data?.ok) {
      setModalError(inviteErr?.message || data?.error || "Erro ao enviar convite.")
      return
    }

    setSuccessMessage(data.message || "Convite enviado com sucesso!")
    setIsModalOpen(false)
    setInviteEmail("")
    setInviteRole("secretary")
    void reloadData()

    setTimeout(() => setSuccessMessage(""), 4000)
  }

  // Revogar convite
  async function handleRevokeInvite(invitationId) {
    if (!confirm("Tem certeza que deseja revogar este convite?")) return

    setRevokingId(invitationId)
    const { error: revokeErr } = await invitationService.revokeInvitation(invitationId)
    setRevokingId(null)

    if (revokeErr) {
      setError(revokeErr.message || "Falha ao revogar convite.")
      return
    }

    setSuccessMessage("Convite revogado com sucesso.")
    void reloadData()
    setTimeout(() => setSuccessMessage(""), 4000)
  }

  // Reenviar convite existente
  async function handleResendInvite(inv) {
    setResendingEmail(inv.email)
    const { data, error: resendErr } = await invitationService.inviteMember({
      schoolId,
      email: inv.email,
      role: inv.roles?.name || "secretary"
    })
    setResendingEmail(null)

    if (resendErr || !data?.ok) {
      setError(resendErr?.message || "Erro ao reenviar convite.")
      return
    }

    setSuccessMessage("Convite revalidado e reenviado com sucesso!")
    void reloadData()
    setTimeout(() => setSuccessMessage(""), 4000)
  }

  const canInviteOwner = isPlatformAdmin || currentUserRole === "owner"
  const pendingInvitations = invitations.filter(inv => inv.status === "pending")

  return (
    <div className="p-8 flex-1 overflow-y-auto space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="text-primary" size={26} />
            Equipe Escolar & Gestão de Acessos
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie os operadores, administradores e convites de membros desta unidade escolar.
          </p>
        </div>

        <button
          onClick={() => {
            setModalError("")
            setIsModalOpen(true)
          }}
          className="bg-primary hover:opacity-90 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Convidar Membro</span>
        </button>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl text-sm flex items-center gap-2.5">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-xl text-sm flex items-center gap-2.5">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Carregando membros e convites...</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* SEÇÃO 1: MEMBROS ATIVOS */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-[#2a2a2a] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck size={20} className="text-primary" />
                  Membros Cadastrados ({members.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Usuários com acesso ativo à instituição de ensino.</p>
              </div>
            </div>

            {members.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Nenhum membro ativo cadastrado nesta escola.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#2a2a2a]">
                {members.map(member => {
                  const roleKey = member.roles?.name || "secretary"
                  const badge = ROLE_BADGES[roleKey] || { label: roleKey, bg: "bg-slate-100 text-slate-700 border-slate-200" }

                  return (
                    <div key={member.id} className="p-5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-[#222222] transition">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center shrink-0">
                          {(member.profiles?.full_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                            {member.profiles?.full_name || "Sem nome cadastrado"}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {member.profiles?.phone || "Membro institucional"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          member.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {member.status === "active" ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* SEÇÃO 2: CONVITES PENDENTES */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-[#2a2a2a]">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail size={20} className="text-orange-500" />
                Convites Pendentes ({pendingInvitations.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Convites enviados aguardando confirmação do convidado.</p>
            </div>

            {pendingInvitations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nenhum convite pendente no momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#2a2a2a]">
                {pendingInvitations.map(inv => {
                  const roleKey = inv.roles?.name || "secretary"
                  const badge = ROLE_BADGES[roleKey] || { label: roleKey, bg: "bg-slate-100 text-slate-700 border-slate-200" }
                  const isExpiringSoon = new Date(inv.expires_at) - new Date() < 2 * 24 * 3600 * 1000

                  return (
                    <div key={inv.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-[#222222] transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {inv.email}
                          </p>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className={isExpiringSoon ? "text-amber-500" : "text-slate-400"} />
                            Expira em: {new Date(inv.expires_at).toLocaleDateString("pt-BR")}
                          </span>
                          {inv.profiles?.full_name && (
                            <span>Convidado por: {inv.profiles.full_name}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleResendInvite(inv)}
                          disabled={resendingEmail === inv.email}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-60 cursor-pointer"
                          title="Revalidar expiração e reenviar e-mail de convite"
                        >
                          <RefreshCw size={13} className={resendingEmail === inv.email ? "animate-spin" : ""} />
                          <span>Reenviar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRevokeInvite(inv.id)}
                          disabled={revokingId === inv.id}
                          className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-60 cursor-pointer"
                          title="Cancelar e revogar este convite"
                        >
                          <Trash2 size={13} />
                          <span>Revogar</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL: CONVIDAR MEMBRO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-[#2a2a2a] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#222222]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Convidar Membro</h3>
                  <p className="text-xs text-slate-500">Enviar link de acesso por e-mail</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-700 transition bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-semibold border border-red-100 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-red-500" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  E-mail do Convidado
                </label>
                <input
                  required
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="exemplo@escola.com.br"
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-sm outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-950 transition text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Papel na Instituição
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-sm outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-950 transition text-slate-900 dark:text-white"
                >
                  {canInviteOwner && (
                    <option value="owner">Proprietário(a) / Gestor Geral (owner)</option>
                  )}
                  <option value="administrator">Administrador(a) Escolar (administrator)</option>
                  <option value="secretary">Secretaria Escolar (secretary)</option>
                  <option value="gatekeeper">Operador(a) de Portaria (gatekeeper)</option>
                </select>
                {!canInviteOwner && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    * Administradores podem convidar outros administradores, secretários e porteiros.
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:opacity-90 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Enviando convite...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Enviar Convite por E-mail</span>
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
