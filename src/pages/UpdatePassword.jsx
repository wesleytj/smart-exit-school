import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { KeyRound, ArrowLeft, AlertTriangle, Loader2 } from "lucide-react"
import PasswordInput from "../components/PasswordInput"
import { authService } from "../services/authService"
import { validatePasswordUpdate } from "../services/authValidation"

export default function UpdatePassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [hasValidSession, setHasValidSession] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true

    async function checkAuthSession() {
      // Verifica se a URL contém erro de token expirado ou inválido retornado pelo Supabase
      const hash = typeof window !== "undefined" ? window.location.hash : ""
      const search = typeof window !== "undefined" ? window.location.search : ""
      const hasUrlError = hash.includes("error=") || search.includes("error=")

      if (hasUrlError) {
        if (mounted) {
          setHasValidSession(false)
          setIsCheckingSession(false)
        }
        return
      }

      try {
        const { data } = await authService.getSession()

        if (mounted) {
          if (data?.session) {
            setHasValidSession(true)
            setIsCheckingSession(false)
          } else {
            // Se ainda não houver sessão imediata no getSession, aguarda listener de authStateChange (processamento do hash)
            const { data: authListener } = authService.onAuthStateChange((event, session) => {
              if (!mounted) return
              if (session || event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
                setHasValidSession(true)
              }
              setIsCheckingSession(false)
            })

            // Timeout de segurança para não prender a tela caso o link seja inválido/sem tokens
            const timer = setTimeout(() => {
              if (mounted) {
                setIsCheckingSession((current) => {
                  if (current) {
                    setHasValidSession(false)
                    return false
                  }
                  return current
                })
              }
            }, 2000)

            return () => {
              clearTimeout(timer)
              authListener?.subscription?.unsubscribe?.()
            }
          }
        }
      } catch (err) {
        console.error("Erro ao verificar sessão de recuperação:", err)
        if (mounted) {
          setHasValidSession(false)
          setIsCheckingSession(false)
        }
      }
    }

    checkAuthSession()

    return () => {
      mounted = false
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    const validation = validatePasswordUpdate(password, confirmPassword)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setIsSubmitting(true)

    try {
      const { error: updateError } = await authService.updatePassword(password)

      if (updateError) {
        setError(updateError.message || "Não foi possível atualizar a senha. Tente novamente.")
        return
      }

      // Logout para forçar login explícito com as novas credenciais
      await authService.logout()

      navigate("/login", {
        replace: true,
        state: {
          successMessage: "Senha atualizada com sucesso! Entre com suas novas credenciais.",
          authMessage: "Senha atualizada com sucesso!"
        }
      })
    } catch (err) {
      console.error(err)
      setError("Erro inesperado ao atualizar senha. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8">

        {/* HEADER */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-[#020817] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">AES</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Definir Nova Senha</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Escolha uma senha segura para acessar sua conta
          </p>
        </div>

        {/* MENSAGEM DE ERRO */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-semibold text-center mb-4 border border-red-100">
            {error}
          </div>
        )}

        {isCheckingSession ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="animate-spin text-orange-500" size={32} />
            <p className="text-sm font-medium">Validando link de recuperação...</p>
          </div>
        ) : !hasValidSession ? (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-2">
              <div className="flex justify-center">
                <AlertTriangle className="text-amber-500" size={36} />
              </div>
              <h2 className="text-sm font-bold text-amber-900">Link expirado ou inválido</h2>
              <p className="text-xs text-amber-700 leading-relaxed">
                Este link de redefinição de senha já foi utilizado ou expirou. Por motivos de segurança, solicite um novo link de redefinição.
              </p>
            </div>

            <Link
              to="/forgot-password"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-orange-500/30"
            >
              Solicitar novo link
            </Link>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                <ArrowLeft size={16} />
                Voltar ao login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-semibold text-slate-700 ml-1">Nova Senha</label>
              <PasswordInput
                id="new-password"
                name="new-password"
                required
                autoFocus
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-semibold text-slate-700 ml-1">Confirmar Nova Senha</label>
              <PasswordInput
                id="confirm-password"
                name="confirm-password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-2 transition shadow-lg shadow-orange-500/30 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Salvando nova senha...
                </>
              ) : (
                <>
                  <KeyRound size={18} />
                  Salvar Nova Senha
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                <ArrowLeft size={16} />
                Cancelar e voltar ao login
              </Link>
            </div>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Powered by <span className="font-bold text-orange-500">AllTech Solutions</span></p>
        </div>

      </div>
    </div>
  )
}
