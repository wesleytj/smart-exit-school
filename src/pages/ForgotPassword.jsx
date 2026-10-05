import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react"
import { authService } from "../services/authService"
import { validateEmail } from "../services/authValidation"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    const validation = validateEmail(email)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setIsSubmitting(true)

    try {
      const { error: resetError } = await authService.resetPasswordForEmail(validation.email)

      if (resetError) {
        console.error("Erro ao solicitar redefinição:", resetError)
      }

      // Mensagem neutra por segurança: sempre indica envio sem revelar existência de conta
      setIsSubmitted(true)
    } catch (err) {
      console.error(err)
      setError("Ocorreu um erro ao processar a solicitação. Tente novamente.")
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
          <h1 className="text-2xl font-bold text-slate-900">Recuperar Senha</h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            {isSubmitted
              ? "Instruções enviadas para seu e-mail"
              : "Informe seu e-mail para receber as instruções de redefinição"}
          </p>
        </div>

        {/* MENSAGEM DE ERRO */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-semibold text-center mb-4 border border-red-100">
            {error}
          </div>
        )}

        {isSubmitted ? (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
              <div className="flex justify-center">
                <CheckCircle2 className="text-emerald-500" size={36} />
              </div>
              <h2 className="text-sm font-bold text-emerald-900">E-mail de redefinição enviado</h2>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Se o e-mail existir, enviaremos um link de redefinição. Verifique também a caixa de spam ou lixo eletrônico.
              </p>
            </div>

            <Link
              to="/login"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition"
            >
              <ArrowLeft size={18} />
              Voltar ao Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="forgot-email" className="text-sm font-semibold text-slate-700 ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@escola.com.br"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-2 transition shadow-lg shadow-orange-500/30 cursor-pointer"
            >
              <Send size={18} />
              {isSubmitting ? "Enviando..." : "Enviar link de redefinição"}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                <ArrowLeft size={16} />
                Voltar ao login
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
