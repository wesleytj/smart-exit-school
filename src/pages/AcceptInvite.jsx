import { useState, useEffect } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { Building, UserCheck, AlertTriangle, CheckCircle, Loader2, ArrowRight } from "lucide-react"
import PasswordInput from "../components/PasswordInput"
import { invitationService } from "../services/invitationService"
import { authService } from "../services/authService"

const ROLE_LABELS = {
  owner: "Proprietário(a) / Gestor Geral",
  administrator: "Administrador(a) Escolar",
  secretary: "Secretaria Escolar",
  gatekeeper: "Operador(a) de Portaria"
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""
  const navigate = useNavigate()

  // Estados: 'validating' | 'ready' | 'error' | 'success'
  const [viewState, setViewState] = useState("validating")
  const [inviteData, setInviteData] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [currentUser, setCurrentUser] = useState(null)

  // Formulário para conta nova
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true

    async function initialize() {
      if (!token || token.trim().length < 16) {
        if (mounted) {
          setErrorMessage("O link de convite é inválido ou está incompleto.")
          setViewState("error")
        }
        return
      }

      // 1. Checar se há usuário logado
      try {
        const { data: sessionData } = await authService.getSession()
        if (sessionData?.session?.user) {
          if (mounted) {
            setCurrentUser(sessionData.session.user)
          }
        }
      } catch (err) {
        console.warn("Erro ao obter sessão no aceite:", err)
      }

      // 2. Validar token na Edge Function
      const { data, error } = await invitationService.validateInvite(token)

      if (!mounted) return

      if (error || !data?.valid) {
        const msg = data?.message || error?.message || "Convite inválido ou expirado."
        setErrorMessage(msg)
        setViewState("error")
      } else {
        setInviteData(data)
        setViewState("ready")
      }
    }

    void initialize()

    return () => {
      mounted = false
    }
  }, [token])

  // Submissão do aceite
  async function handleConfirmInvite(e) {
    if (e) e.preventDefault()
    setFormError("")

    // Se não estiver logado, valida nome e senha
    if (!currentUser) {
      if (!fullName.trim()) {
        setFormError("Informe seu nome completo.")
        return
      }
      if (!password || password.length < 6) {
        setFormError("A senha deve conter no mínimo 6 caracteres.")
        return
      }
      if (password !== confirmPassword) {
        setFormError("As senhas não coincidem.")
        return
      }
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await invitationService.acceptInvite({
        token,
        fullName: fullName.trim(),
        password
      })

      if (error || !data?.ok) {
        const msg = data?.message || error?.message || "Falha ao aceitar o convite."
        setFormError(msg)
        setIsSubmitting(false)
        return
      }

      setViewState("success")
      setTimeout(() => {
        navigate("/painel", { replace: true })
      }, 1500)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro inesperado ao aceitar convite.")
      setIsSubmitting(false)
    }
  }

  const roleLabel = inviteData?.role_name
    ? ROLE_LABELS[inviteData.role_name] || inviteData.role_name
    : "Membro da Equipe"

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Building size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Smart Exit School</h1>
          <p className="text-orange-100 text-sm mt-1">Convite para a Equipe Escolar</p>
        </div>

        {/* Conteúdo dinâmico por estado */}
        <div className="p-8">

          {/* 1. ESTADO: VALIDANDO */}
          {viewState === "validating" && (
            <div className="text-center py-8 space-y-4">
              <Loader2 size={36} className="animate-spin text-orange-500 mx-auto" />
              <p className="text-slate-600 font-medium">Validando token de convite...</p>
            </div>
          )}

          {/* 2. ESTADO: ERRO / EXPIRADO */}
          {viewState === "error" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Não foi possível prosseguir</h2>
              <p className="text-sm text-slate-600 leading-relaxed bg-red-50 p-4 rounded-xl border border-red-100">
                {errorMessage}
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition"
                >
                  Ir para a tela de Login
                </Link>
              </div>
            </div>
          )}

          {/* 3. ESTADO: SUCESSO */}
          {viewState === "success" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Convite Aceito!</h2>
              <p className="text-sm text-slate-600">
                Seu acesso foi vinculado com sucesso à instituição. Redirecionando para o painel...
              </p>
            </div>
          )}

          {/* 4. ESTADO: PRONTO PARA ACEITAR */}
          {viewState === "ready" && inviteData && (
            <div className="space-y-6">
              
              {/* Card de Informações do Convite */}
              <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
                  <Building size={16} className="text-orange-600 shrink-0" />
                  <span className="truncate">{inviteData.school_name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-xs">
                  <UserCheck size={14} className="text-slate-400 shrink-0" />
                  <span>Papel: <strong>{roleLabel}</strong></span>
                </div>
                <div className="text-xs text-slate-500">
                  Destinado a: <code className="bg-white px-1.5 py-0.5 rounded text-slate-700 font-mono">{inviteData.masked_email}</code>
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-semibold border border-red-100 flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Se o usuário já estiver logado */}
              {currentUser ? (
                <div className="space-y-4 pt-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600">
                    Você está conectado como <strong>{currentUser.email}</strong>.
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmInvite}
                    disabled={isSubmitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Confirmando...</span>
                      </>
                    ) : (
                      <>
                        <span>Aceitar Convite e Entrar</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Se não estiver logado, formulário de cadastro */
                <form onSubmit={handleConfirmInvite} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nome Completo</label>
                    <input
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Maria dos Santos"
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm outline-none focus:border-orange-500 focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Criar Senha de Acesso</label>
                    <PasswordInput
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm outline-none focus:border-orange-500 focus:bg-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Confirmar Senha</label>
                    <PasswordInput
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-sm outline-none focus:border-orange-500 focus:bg-white transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Criando acesso...</span>
                      </>
                    ) : (
                      <>
                        <span>Concluir Cadastro e Acessar</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
                  Já possui conta? Entrar pelo Login
                </Link>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  )
}
