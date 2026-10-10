import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, Loader2, Clock } from 'lucide-react';
import { impersonationService } from '../services/impersonationService.js';

export default function SupportBanner() {
  const navigate = useNavigate();
  const [impersonationState] = useState(() => impersonationService.getImpersonationState());
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = useCallback(async (isExpired = false) => {
    if (isExiting) return;
    setIsExiting(true);

    try {
      await impersonationService.exitImpersonationSession();
    } catch (err) {
      console.warn('Erro ao sair da sessão de suporte:', err);
    } finally {
      if (isExpired) {
        alert('A sua sessão de suporte expirou (45 min). Retornando ao Painel Super Admin.');
      }
      navigate('/admin/institutions', { replace: true });
    }
  }, [isExiting, navigate]);

  useEffect(() => {
    if (!impersonationState?.expires_at) {
      return;
    }

    const targetTime = new Date(impersonationState.expires_at).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diffSeconds = Math.max(0, Math.floor((targetTime - now) / 1000));
      setTimeLeft(diffSeconds);

      if (diffSeconds <= 0) {
        clearInterval(timerInterval);
        void handleExit(true);
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [handleExit, impersonationState?.expires_at]);

  if (!impersonationState) {
    return null;
  }

  const { target_user } = impersonationState;
  const userName = target_user?.full_name || target_user?.email || 'Usuário';
  const userEmail = target_user?.email || '';
  const schoolName = target_user?.school_name || '';

  const formatTime = (totalSeconds) => {
    if (totalSeconds === null) return '--:--';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div
      role="alert"
      aria-label="Barra de Modo Suporte Ativo"
      className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-amber-950 border-b border-amber-600 shadow-sm sticky top-0 z-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm font-medium"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-950/15 text-amber-950 shrink-0">
          <ShieldAlert size={18} className="animate-pulse" />
        </span>
        <div className="truncate">
          <span className="font-bold text-amber-950">Modo Suporte Ativo:</span>{' '}
          <span className="font-semibold">{userName}</span>
          {userEmail && <span className="opacity-80 ml-1">({userEmail})</span>}
          {schoolName && (
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded bg-amber-950/10 text-xs font-semibold">
              {schoolName}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-auto">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/10 rounded-lg text-xs font-bold font-mono">
          <Clock size={14} />
          <span>{formatTime(timeLeft)}</span>
        </div>

        <button
          type="button"
          onClick={() => handleExit(false)}
          disabled={isExiting}
          className="bg-amber-950 hover:bg-black text-amber-50 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
        >
          {isExiting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Encerrando...</span>
            </>
          ) : (
            <>
              <LogOut size={14} />
              <span>Encerrar e Voltar ao Admin</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
