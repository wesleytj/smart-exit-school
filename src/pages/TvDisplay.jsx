import { useEffect, useState } from "react"
import { Clock, GraduationCap, MapPin, User, Volume2 } from "lucide-react"
import { authService } from "../services/authService"
import { callService } from "../services/callService"
import { themeService } from "../services/themeService"
import { STORAGE_KEYS } from "../services/core/keys"

export default function TvDisplay() {
  const [calledStudents, setCalledStudents] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [schoolInfo, setSchoolInfo] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    void themeService.getThemePreference().then(setIsDarkMode)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let unsubscribeCalls = () => {}

    async function init() {
      const loggedSchool = await authService.getCurrentSession()
      if (!loggedSchool) return

      setSchoolInfo(loggedSchool)
      setCalledStudents(await callService.getCallsBySchool(loggedSchool.id))
      unsubscribeCalls = callService.subscribeToCalls(loggedSchool.id, setCalledStudents)
    }

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.LOGGED_SCHOOL) {
        void authService.getCurrentSession().then((updatedSchool) => {
          if (updatedSchool) setSchoolInfo(updatedSchool)
        })
      }

      if (e.key === STORAGE_KEYS.DARK_MODE) {
        void themeService.getThemePreference().then(setIsDarkMode)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    void init()

    return () => {
      unsubscribeCalls()
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err))
    } else {
      document.exitFullscreen()
    }
  }

  const currentCall = calledStudents[0]
  const recentCalls = calledStudents.slice(1)

  const dateFormatted = currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeFormatted = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const isPremium = schoolInfo?.plan?.toLowerCase() === "premium" || schoolInfo?.plan?.toLowerCase() === "diamond"

  const customStyles = {
    '--color-primary': isPremium && schoolInfo?.primaryColor ? schoolInfo.primaryColor : '#f97316',
    '--color-secondary': isPremium && schoolInfo?.secondaryColor ? schoolInfo.secondaryColor : '#3b82f6',
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div style={customStyles} className="h-screen w-screen bg-[#f4f7fb] dark:bg-[#020817] flex flex-col overflow-hidden font-sans select-none transition-colors duration-300">
        
        <header className="h-20 bg-white dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-[#2a2a2a] flex justify-between items-center px-10 shadow-sm shrink-0 transition-colors duration-300" onClick={toggleFullScreen} title="Clique para Tela Cheia">
          <div className="flex items-center gap-4 cursor-pointer">
            <div className="w-12 h-12 bg-[#020817] dark:bg-black rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0 border border-transparent dark:border-[#333333]">
              {isPremium && schoolInfo?.customLogo ? (
                <img src={schoolInfo.customLogo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
              ) : "AES"}
            </div>
            <div className="leading-tight">
              <h1 className="text-slate-900 dark:text-white font-bold text-xl tracking-tight transition-colors">{schoolInfo?.name || "Carregando..."}</h1>
              <p className="text-xs text-secondary font-semibold uppercase">Plano {schoolInfo?.plan || "Basic"}</p>
            </div>
          </div>

          <div className="flex flex-col items-end text-slate-800 dark:text-white transition-colors">
            <div className="flex items-center gap-2 font-bold text-2xl">
              <Clock size={24} className="text-slate-400 dark:text-slate-500" />
              {timeFormatted}
            </div>
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium capitalize">{dateFormatted}</span>
          </div>
        </header>

        <main className="flex-1 p-8 flex flex-col gap-6 overflow-hidden">
          
          <section className="shrink-0 flex flex-col">
            <h3 className="text-primary font-bold text-xl uppercase tracking-wider mb-3">Chamada Atual</h3>
            
            {currentCall ? (
              <div className="bg-white dark:bg-[#1a1a1a] border-2 border-primary rounded-3xl p-6 flex items-center justify-between shadow-lg animate-in slide-in-from-top-4 fade-in duration-500 transition-colors duration-300">
                <div className="flex items-center gap-8">
                  
                  {isPremium && (
                    <div className="w-40 h-40 bg-slate-100 dark:bg-[#2a2a2a] border border-slate-200 dark:border-[#333333] rounded-2xl flex items-center justify-center shrink-0 overflow-hidden transition-colors">
                      <User size={80} className="text-slate-300 dark:text-slate-500" />
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-3">
                    <h2 className="text-slate-900 dark:text-white font-black text-5xl tracking-tight mb-2 transition-colors">{currentCall.name}</h2>
                    
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xl font-medium transition-colors">
                      <GraduationCap size={24} className="text-primary" />
                      Turma: <span className="font-bold text-slate-800 dark:text-slate-100">{currentCall.grade}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xl font-medium transition-colors">
                      <MapPin size={24} className="text-green-600 dark:text-green-500" />
                      Saída: <span className="font-bold text-green-600 dark:text-green-500 uppercase">{currentCall.exitGate}</span>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium transition-colors">Por favor, dirija-se à saída indicada.</p>
                  </div>
                </div>

                <div className="w-40 h-40 border-4 border-slate-100 dark:border-[#2a2a2a] rounded-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#111111] shrink-0 mr-4 shadow-inner transition-colors">
                  <MapPin size={28} className="text-green-600 dark:text-green-500 mb-1" />
                  <span className="text-green-600 dark:text-green-500 font-black text-lg text-center leading-tight uppercase px-2">
                    {currentCall.exitGate}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-3xl p-10 flex flex-col items-center justify-center shadow-sm text-slate-400 dark:text-slate-500 transition-colors duration-300">
                <span className="text-xl font-medium">Nenhum aluno sendo chamado no momento.</span>
              </div>
            )}
          </section>

          <section className="flex-1 flex flex-col min-h-0">
            <h3 className="text-secondary font-bold text-lg uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock size={20} /> Chamadas Recentes
            </h3>
            
            <div className="flex gap-4 overflow-x-auto pb-4 h-full items-start">
              {recentCalls.map((student) => (
                <div key={student.id} className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2a2a2a] rounded-2xl w-64 h-full max-h-64 p-4 flex flex-col items-center shadow-sm shrink-0 animate-in fade-in transition-colors duration-300">
                  <div className="w-full flex justify-start mb-2 text-secondary font-bold text-sm">
                    {student.time}
                  </div>
                  
                  {isPremium && (
                    <div className="w-20 h-20 bg-slate-100 dark:bg-[#2a2a2a] border border-slate-200 dark:border-[#333333] rounded-xl flex items-center justify-center overflow-hidden mb-4 transition-colors">
                      <User size={40} className="text-slate-300 dark:text-slate-500" />
                    </div>
                  )}
                  
                  <h4 className={`text-slate-900 dark:text-white font-bold text-center leading-tight mb-1 truncate w-full px-2 transition-colors ${!isPremium ? 'mt-4 text-lg' : ''}`} title={student.name}>
                    {student.name}
                  </h4>
                  
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-auto transition-colors">
                    {student.grade}
                  </p>
                  
                  <div className="mt-4 flex items-center gap-1 text-green-600 dark:text-green-500 font-bold text-sm uppercase transition-colors">
                    <MapPin size={16} />
                    {student.exitGate}
                  </div>
                </div>
              ))}
              
              {recentCalls.length === 0 && currentCall && (
                 <div className="w-full h-32 border-2 border-dashed border-slate-200 dark:border-[#333333] rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium transition-colors">
                   A fila de chamadas recentes está vazia.
                 </div>
              )}
            </div>
          </section>
        </main>

        <footer className="h-12 bg-slate-900 dark:bg-black flex items-center justify-center text-white font-medium text-sm shrink-0 gap-2 border-t border-slate-800 transition-colors">
          <Volume2 size={16} className="text-primary" />
          Mantenha o corredor livre e seguro. Contamos com a colaboração de todos!
        </footer>
      </div>
    </div>
  )
}
