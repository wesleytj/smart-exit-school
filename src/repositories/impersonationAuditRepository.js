import { supabase } from '../lib/supabase.js';

export function normalizeDateBoundaries(from, to) {
  let normFrom = from;
  let normTo = to;

  if (typeof from === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(from.trim())) {
    normFrom = `${from.trim()}T00:00:00.000Z`;
  }
  if (typeof to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(to.trim())) {
    normTo = `${to.trim()}T23:59:59.999Z`;
  }

  return { from: normFrom, to: normTo };
}

export const impersonationAuditRepository = {
  /**
   * Consulta logs de auditoria de impersonation com paginação e filtros opcionais.
   * Não realiza embed de public.profiles para evitar restrição de RLS (profiles_select_own).
   * Realiza embed de schools:target_school_id(name) que possui grant SELECT ativo.
   */
  async listImpersonationAudit({
    superAdminId = null,
    targetUserId = null,
    schoolId = null,
    from = null,
    to = null,
    limit = 25,
    offset = 0
  } = {}) {
    let query = supabase
      .from('impersonation_audit_logs')
      .select('*, schools:target_school_id(name)', { count: 'exact' });

    if (superAdminId) {
      query = query.eq('super_admin_id', superAdminId);
    }
    if (targetUserId) {
      query = query.eq('target_user_id', targetUserId);
    }
    if (schoolId) {
      query = query.eq('target_school_id', schoolId);
    }

    const { from: normFrom, to: normTo } = normalizeDateBoundaries(from, to);
    if (normFrom) {
      query = query.gte('started_at', normFrom);
    }
    if (normTo) {
      query = query.lte('started_at', normTo);
    }

    query = query.order('started_at', { ascending: false });

    const safeLimit = Math.max(1, Math.min(2000, Number(limit) || 25));
    const safeOffset = Math.max(0, Number(offset) || 0);

    const { data, count, error } = await query.range(safeOffset, safeOffset + safeLimit - 1);

    return {
      data: data || [],
      count: count || 0,
      error: error || null
    };
  },

  /**
   * Retorna a contagem exata para os filtros fornecidos.
   */
  async countImpersonationAudit(filters = {}) {
    const { count, error } = await this.listImpersonationAudit({
      ...filters,
      limit: 1,
      offset: 0
    });
    return {
      count: count || 0,
      error: error || null
    };
  }
};
