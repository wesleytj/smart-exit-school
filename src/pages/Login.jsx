import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, LogIn } from "lucide-react"
import { authService } from "../services/authService"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError("")

    if (email === "admin@alltech.com" && password === "admin123") {
      navigate("/admin/institutions")
      return
    }

    const schoolFound = await authService.login(email, password)

    if (schoolFound) {
      navigate("/painel")
    } else {
      setError("E-mail ou senha incorretos.")
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        
        {/* HEADER DO LOGIN */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#020817] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">AES</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Smart Exit School</h1>
          <p className="text-slate-500 text-sm mt-1">Acesse sua conta para continuar</p>
        </div>

        {/* MENSAGEM DE ERRO */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-semibold text-center mb-4 border border-red-100">
            {error}
          </div>
        )}

        {/* FORMULÁRIO */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@escola.com.br"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-2 transition shadow-lg shadow-orange-500/30"
          >
            <LogIn size={20} />
            Entrar no Sistema
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Powered by <span className="font-bold text-orange-500">AllTech Solutions</span></p>
        </div>

      </div>
    </div>
  )
}