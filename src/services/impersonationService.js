import { supabase } from '../lib/supabase.js';

const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
const nodeEnv = typeof globalThis !== 'undefined' && globalThis.process ? globalThis.process.env : undefined;

const supabaseUrl = metaEnv?.VITE_SUPABASE_URL || nodeEnv?.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = metaEnv?.VITE_SUPABASE_ANON_KEY || nodeEnv?.VITE_SUPABASE_ANON_KEY || 'anon-key';

export const SESSION_BACKUP_KEY = 'ses_admin_session_backup';
export const IMPERSONATION_STATE_KEY = 'ses_impersonation_state';

function getSessionStorage() {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage;
  }
  if (typeof globalThis !== 'undefined' && globalThis.sessionStorage) {
    return globalThis.sessionStorage;
  }
  return null;
}

function getLocalStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return null;
}

/**
 * Limpa chaves de cache e estado operacional de escolas no localStorage
 */
export function clearSchoolLocalCache() {
  const storage = getLocalStorage();
  if (storage) {
    try {
      const keysToRemove = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && (key.startsWith('@SmartExit:') || key === '@SmartExit:loggedSchool')) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        storage.removeItem(key);
      }
    } catch (err) {
      console.warn('Erro ao limpar cache local de escola:', err);
    }
  }
}

/**
 * Retorna os dados da sessão ativa de impersonation guardados em sessionStorage
 */
export function getImpersonationState() {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(IMPERSONATION_STATE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Indica se há uma sessão de impersonation em andamento
 */
export function isImpersonating() {
  return Boolean(getImpersonationState());
}

/**
 * Retorna o backup da sessão original de Super Admin
 */
export function getAdminSessionBackup() {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(SESSION_BACKUP_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const impersonationService = {
  /**
   * Consulta o catálogo global de usuários do sistema via RPC
   */
  async listPlatformUsers({ search = null, schoolId = null, limit = 50, offset = 0 } = {}) {
    const { data, error } = await supabase.rpc('list_platform_users', {
      p_search: search || null,
      p_school_id: schoolId || null,
      p_limit: limit,
      p_offset: offset
    });

    if (error) {
      return { data: [], error };
    }

    return { data: data || [], error: null };
  },

  /**
   * Solicita à Edge Function a emissão do JWT de impersonation
   */
  async startImpersonation({ target_user_id, reason }) {
    if (!target_user_id) {
      return { data: null, error: new Error('ID do usuário alvo é obrigatório.') };
    }

    if (!reason || reason.trim().length < 5) {
      return { data: null, error: new Error('Motivo do suporte deve ter no mínimo 5 caracteres.') };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (sessionError || !token) {
      return { data: null, error: new Error('Sessão de administrador não autenticada.') };
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/impersonate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({ target_user_id, reason: reason.trim() })
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { data: null, error: new Error(json.error || `Erro HTTP ${response.status} ao iniciar suporte.`) };
      }

      return { data: json, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  /**
   * Registra encerramento da sessão de impersonation na Edge Function
   */
  async endImpersonation({ impersonation_log_id } = {}) {
    let logId = impersonation_log_id;
    if (!logId) {
      const state = getImpersonationState();
      logId = state?.impersonation_log_id;
    }

    if (!logId) {
      return { data: null, error: new Error('Identificador do log de impersonation não informado.') };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/end-impersonation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({ impersonation_log_id: logId })
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { data: null, error: new Error(json.error || `Erro HTTP ${response.status} ao encerrar suporte.`) };
      }

      return { data: json, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  /**
   * Executa a transição para a sessão impersonada:
   * 1. Faz backup da sessão do Super Admin
   * 2. Armazena o estado da sessão de suporte
   * 3. Limpa caches de escola anteriores
   * 4. Desativa auto-refresh
   * 5. Seta a sessão no GoTrue com o refresh_token sentinela
   */
  async enterImpersonationSession({ token, target_user, impersonation_log_id, expires_at }) {
    const storage = getSessionStorage();
    if (storage) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        storage.setItem(SESSION_BACKUP_KEY, JSON.stringify(sessionData.session));
      }

      const state = {
        impersonation_log_id,
        target_user,
        expires_at: expires_at || new Date(Date.now() + 45 * 60 * 1000).toISOString()
      };
      storage.setItem(IMPERSONATION_STATE_KEY, JSON.stringify(state));
    }

    clearSchoolLocalCache();

    if (supabase.auth?.stopAutoRefresh) {
      supabase.auth.stopAutoRefresh();
    }

    return await supabase.auth.setSession({
      access_token: token,
      refresh_token: 'impersonation_no_refresh'
    });
  },

  /**
   * Encerra a sessão de suporte e restaura a sessão original do Super Admin:
   * 1. Notifica a Edge Function para marcar ended_at
   * 2. Limpa caches de tenant/escola
   * 3. Restaura o token original do Super Admin
   * 4. Reativa o auto-refresh do GoTrue
   * 5. Remove backups de suporte
   */
  async exitImpersonationSession() {
    const state = getImpersonationState();
    if (state?.impersonation_log_id) {
      try {
        await this.endImpersonation({ impersonation_log_id: state.impersonation_log_id });
      } catch (err) {
        console.warn('Falha não-bloqueante ao registrar término na Edge Function:', err);
      }
    }

    clearSchoolLocalCache();

    let restored = false;
    const storage = getSessionStorage();
    if (storage) {
      const backupStr = storage.getItem(SESSION_BACKUP_KEY);
      if (backupStr) {
        try {
          const backup = JSON.parse(backupStr);
          if (backup?.access_token && backup?.refresh_token) {
            await supabase.auth.setSession({
              access_token: backup.access_token,
              refresh_token: backup.refresh_token
            });

            if (supabase.auth?.startAutoRefresh) {
              supabase.auth.startAutoRefresh();
            }

            restored = true;
          }
        } catch (e) {
          console.error('Falha ao restaurar sessão original de administrador:', e);
        }

        storage.removeItem(SESSION_BACKUP_KEY);
      }

      storage.removeItem(IMPERSONATION_STATE_KEY);
    }

    return { restored };
  },

  getImpersonationState,
  isImpersonating,
  getAdminSessionBackup,
  clearSchoolLocalCache
};
