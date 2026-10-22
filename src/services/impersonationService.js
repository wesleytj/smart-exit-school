import { supabase } from '../lib/supabase.js';
import { impersonationAuditRepository } from '../repositories/impersonationAuditRepository.js';

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
   * 5. Seta a sessão no GoTrue com o refresh_token assinado de curta duração
   */
  async enterImpersonationSession({ token, refresh_token, target_user, impersonation_log_id, expires_at }) {
    const storage = getSessionStorage();
    if (storage) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        storage.setItem(SESSION_BACKUP_KEY, JSON.stringify(sessionData.session));
      }

      const rawExpires = expires_at;
      const normalizedExpires = typeof rawExpires === 'number'
        ? (rawExpires < 1e11 ? new Date(rawExpires * 1000).toISOString() : new Date(rawExpires).toISOString())
        : (rawExpires || new Date(Date.now() + 45 * 60 * 1000).toISOString());

      const state = {
        impersonation_log_id,
        target_user,
        expires_at: normalizedExpires
      };
      storage.setItem(IMPERSONATION_STATE_KEY, JSON.stringify(state));
    }

    clearSchoolLocalCache();

    if (supabase.auth?.stopAutoRefresh) {
      supabase.auth.stopAutoRefresh();
    }

    const resolvedRefreshToken = refresh_token || token;

    return await supabase.auth.setSession({
      access_token: token,
      refresh_token: resolvedRefreshToken
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

  /**
   * Constrói mapa user_id -> { full_name, email } para enriquecer logs de auditoria
   * sem precisar de embed proibido em public.profiles.
   */
  async getPlatformUsersMap() {
    const map = new Map();

    try {
      const { data } = await this.listPlatformUsers({ limit: 200 });
      if (Array.isArray(data)) {
        for (const user of data) {
          if (user.user_id) {
            map.set(user.user_id, {
              full_name: user.full_name || null,
              email: user.email || null
            });
          }
        }
      }
    } catch (err) {
      console.warn('Falha ao obter catálogo para mapeamento de audit:', err);
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;
      if (currentUser?.id && !map.has(currentUser.id)) {
        map.set(currentUser.id, {
          full_name: currentUser.user_metadata?.full_name || currentUser.email || 'Super Admin',
          email: currentUser.email || null
        });
      }
    } catch {
      // Ignora erro de sessão
    }

    return map;
  },

  /**
   * Consulta histórico de auditoria de impersonation normalizado e paginado.
   */
  async getImpersonationAuditHistory({
    superAdminId = null,
    targetUserId = null,
    schoolId = null,
    period = 'today',
    from = null,
    to = null,
    page = 1,
    pageSize = 25,
    limit,
    offset,
    userMap = null
  } = {}) {
    const size = Math.max(1, Math.min(2000, Number(limit ?? pageSize) || 25));
    const off = offset !== undefined ? Math.max(0, Number(offset) || 0) : ((Math.max(1, Number(page) || 1) - 1) * size);
    const p = offset !== undefined ? Math.floor(off / size) + 1 : Math.max(1, Number(page) || 1);

    const { from: resolvedFrom, to: resolvedTo } = resolvePeriodDates(period, from, to);

    const res = await impersonationAuditRepository.listImpersonationAudit({
      superAdminId,
      targetUserId,
      schoolId,
      from: resolvedFrom,
      to: resolvedTo,
      limit: size,
      offset: off
    });

    if (res.error) {
      return {
        data: [],
        total: 0,
        totalCount: 0,
        page: p,
        pageSize: size,
        totalPages: 0,
        error: res.error
      };
    }

    let resolvedUserMap = userMap;
    if (!resolvedUserMap) {
      resolvedUserMap = await this.getPlatformUsersMap();
    }

    const mapped = (res.data || []).map((row) => mapImpersonationAuditLog(row, resolvedUserMap));
    const totalCount = res.count !== undefined ? res.count : mapped.length;
    const totalPages = Math.ceil(totalCount / size) || 1;

    return {
      data: mapped,
      total: totalCount,
      totalCount,
      page: p,
      pageSize: size,
      totalPages,
      error: null
    };
  },

  /**
   * Calcula métricas analíticas e consolidadas de impersonation para o período filtrado.
   */
  async getImpersonationAuditMetrics({
    superAdminId = null,
    targetUserId = null,
    schoolId = null,
    period = 'today',
    from = null,
    to = null
  } = {}) {
    const { from: resolvedFrom, to: resolvedTo } = resolvePeriodDates(period, from, to);

    const res = await impersonationAuditRepository.listImpersonationAudit({
      superAdminId,
      targetUserId,
      schoolId,
      from: resolvedFrom,
      to: resolvedTo,
      limit: 2000,
      offset: 0
    });

    if (res.error) {
      return {
        data: {
          total: 0,
          completed: 0,
          inProgress: 0,
          expired: 0,
          activeOrExpired: 0,
          averageDurationSeconds: 0,
          averageDurationFormatted: '-'
        },
        error: res.error
      };
    }

    const rows = res.data || [];
    let completed = 0;
    let inProgress = 0;
    let expired = 0;
    let totalDurationSeconds = 0;

    const now = new Date();

    for (const row of rows) {
      const status = classifyImpersonationStatus(row, now);
      if (status === 'completed') {
        completed += 1;
        if (row.started_at && row.ended_at) {
          const diffSec = Math.max(0, Math.round((new Date(row.ended_at).getTime() - new Date(row.started_at).getTime()) / 1000));
          totalDurationSeconds += diffSec;
        }
      } else if (status === 'in-progress') {
        inProgress += 1;
      } else if (status === 'expired') {
        expired += 1;
      }
    }

    const total = rows.length;
    const avgSeconds = completed > 0 ? Math.round(totalDurationSeconds / completed) : 0;
    const avgFormatted = completed > 0 ? formatImpersonationDuration(new Date(0).toISOString(), new Date(avgSeconds * 1000).toISOString()) : '-';

    return {
      data: {
        total,
        completed,
        inProgress,
        expired,
        activeOrExpired: inProgress + expired,
        averageDurationSeconds: avgSeconds,
        averageDurationFormatted: avgFormatted
      },
      error: null
    };
  },

  getImpersonationState,
  isImpersonating,
  getAdminSessionBackup,
  clearSchoolLocalCache
};

export function formatImpersonationDuration(startedAt, endedAt) {
  if (!startedAt || !endedAt) {
    return null;
  }
  const startMs = new Date(startedAt).getTime();
  const endMs = new Date(endedAt).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    return null;
  }

  const diffSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));
  if (diffSeconds < 60) {
    return `${diffSeconds}s`;
  }
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }

  const hours = Math.floor(diffSeconds / 3600);
  const remMins = Math.floor((diffSeconds % 3600) / 60);
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
}

export function classifyImpersonationStatus(row, now = new Date()) {
  const endedAt = row?.ended_at || row?.endedAt;
  if (endedAt) {
    return 'completed';
  }

  const startedAt = row?.started_at || row?.startedAt;
  if (!startedAt) {
    return 'expired';
  }

  const startMs = new Date(startedAt).getTime();
  const nowMs = new Date(now).getTime();
  const elapsedMs = Math.max(0, nowMs - startMs);
  const TTL_MS = 45 * 60 * 1000; // 45 minutos (TTL do JWT cunhado)

  if (elapsedMs < TTL_MS) {
    return 'in-progress';
  }

  return 'expired';
}

export function resolvePeriodDates(period, customFrom = null, customTo = null, now = new Date()) {
  if (period === 'custom') {
    return {
      from: customFrom || null,
      to: customTo || null
    };
  }

  if (period === 'all') {
    return { from: null, to: null };
  }

  const nowTime = now.getTime();
  const todayStr = now.toISOString().slice(0, 10);

  if (period === 'today') {
    return {
      from: `${todayStr}T00:00:00.000Z`,
      to: `${todayStr}T23:59:59.999Z`
    };
  }

  if (period === 'yesterday') {
    const yesterdayDate = new Date(nowTime - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);
    return {
      from: `${yesterdayStr}T00:00:00.000Z`,
      to: `${yesterdayStr}T23:59:59.999Z`
    };
  }

  if (period === '7d') {
    const d7 = new Date(nowTime - 7 * 24 * 60 * 60 * 1000);
    return {
      from: `${d7.toISOString().slice(0, 10)}T00:00:00.000Z`,
      to: `${todayStr}T23:59:59.999Z`
    };
  }

  if (period === '30d') {
    const d30 = new Date(nowTime - 30 * 24 * 60 * 60 * 1000);
    return {
      from: `${d30.toISOString().slice(0, 10)}T00:00:00.000Z`,
      to: `${todayStr}T23:59:59.999Z`
    };
  }

  if (period === 'month') {
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return {
      from: `${year}-${month}-01T00:00:00.000Z`,
      to: `${todayStr}T23:59:59.999Z`
    };
  }

  return { from: null, to: null };
}

export function mapImpersonationAuditLog(row, userMap = null) {
  const superAdminId = row?.super_admin_id || row?.superAdminId || null;
  const userInfo = userMap?.get ? userMap.get(superAdminId) : (userMap ? userMap[superAdminId] : null);

  const superAdminName = userInfo?.full_name || userInfo?.name || null;
  const superAdminEmail = userInfo?.email || null;

  const startedAt = row?.started_at || row?.startedAt || null;
  const endedAt = row?.ended_at || row?.endedAt || null;

  let durationSeconds = null;
  if (startedAt && endedAt) {
    const diff = Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000));
    durationSeconds = diff;
  }

  return {
    id: row?.id,
    superAdminId,
    superAdminName,
    superAdminEmail,
    targetUserId: row?.target_user_id || row?.targetUserId || null,
    targetUserName: row?.target_user_name || row?.targetUserName || '',
    targetUserEmail: row?.target_user_email || row?.targetUserEmail || '',
    schoolId: row?.target_school_id || row?.targetSchoolId || row?.schoolId || null,
    schoolName: row?.schools?.name || row?.schoolName || '',
    reason: row?.reason || '',
    startedAt,
    endedAt,
    ipAddress: row?.ip_address || row?.ipAddress || null,
    userAgent: row?.user_agent || row?.userAgent || null,
    duration: formatImpersonationDuration(startedAt, endedAt),
    durationSeconds,
    status: classifyImpersonationStatus(row)
  };
}
