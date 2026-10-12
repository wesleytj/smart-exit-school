/**
 * pickupArchiveService.js
 *
 * Módulo de suporte ao arquivamento e retenção de eventos de saída (Ciclo C · Entrega C3).
 *
 * Regras de Governança:
 * - Eventos ativos (status = 'called') NUNCA são elegíveis para arquivamento ou remoção.
 * - Somente eventos finalizados ('completed' ou 'cancelled') além da janela de retenção são elegíveis.
 * - Chamadas à RPC de arquivamento são restritas ao backend (service_role); nunca permitidas na sessão do operador.
 */

export const DEFAULT_RETENTION_DAYS = 30;
export const DEFAULT_BATCH_LIMIT = 5000;
export const MAX_BATCH_LIMIT = 10000;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Avalia se um evento é elegível para arquivamento de acordo com a política de retenção.
 * Função pura sem I/O.
 *
 * @param {Object} event Objeto do evento de chamada
 * @param {Date} [now] Referência temporal para comparação
 * @param {number} [retentionDays=30] Janela mínima em dias
 * @returns {boolean}
 */
export function isEligibleForArchival(event, now = new Date(), retentionDays = DEFAULT_RETENTION_DAYS) {
  if (!event || typeof event !== 'object') {
    return false;
  }

  // Invariante absoluto: chamadas ativas na fila NUNCA são arquivadas
  if (event.status === 'called' || event.status !== 'completed' && event.status !== 'cancelled') {
    return false;
  }

  const effectiveTimestamp = event.completed_at || event.cancelled_at || event.updated_at || event.called_at;
  if (!effectiveTimestamp) {
    return false;
  }

  const eventTime = new Date(effectiveTimestamp).getTime();
  if (Number.isNaN(eventTime)) {
    return false;
  }

  const referenceTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const cutoffTime = referenceTime - (retentionDays * MS_PER_DAY);

  return eventTime < cutoffTime;
}

/**
 * Constrói o payload de registro para a tabela de arquivo.
 * Função pura sem mutação.
 *
 * @param {Object} event
 * @param {Date} [archivedAt]
 * @returns {Object}
 */
export function buildArchiveRecord(event, archivedAt = new Date()) {
  if (!event) {
    throw new Error('Evento inválido para construção de registro de arquivo.');
  }

  if (event.status !== 'completed' && event.status !== 'cancelled') {
    throw new Error('Apenas eventos completados ou cancelados podem ser arquivados.');
  }

  return {
    id: event.id,
    school_id: event.school_id,
    student_enrollment_id: event.student_enrollment_id,
    gate_id: event.gate_id,
    status: event.status,
    called_at: event.called_at,
    completed_at: event.completed_at || null,
    cancelled_at: event.cancelled_at || null,
    created_at: event.created_at,
    updated_at: event.updated_at,
    archived_at: archivedAt instanceof Date ? archivedAt.toISOString() : new Date(archivedAt).toISOString()
  };
}

/**
 * Camada DAL restrita para acionamento controlado da RPC de arquivamento.
 * Exige cliente Supabase com credenciais de service_role.
 */
export const pickupArchiveService = {
  /**
   * Invoca a RPC archive_old_pickup_events no banco de dados.
   *
   * @param {Object} supabaseAdmin Cliente Supabase instanciado com service_role
   * @param {Object} options
   * @param {string} [options.olderThan='30 days']
   * @param {number} [options.batchLimit=5000]
   * @param {string|null} [options.schoolId=null]
   * @returns {Promise<{ data: number|null, error: Error|null }>}
   */
  async archiveOldCalls(supabaseAdmin, { olderThan = '30 days', batchLimit = DEFAULT_BATCH_LIMIT, schoolId = null } = {}) {
    if (!supabaseAdmin || typeof supabaseAdmin.rpc !== 'function') {
      return {
        data: null,
        error: new Error('pickupArchiveService.archiveOldCalls exige um cliente Supabase com privilégios service_role.')
      };
    }

    const clampedBatch = Math.min(Math.max(1, Number(batchLimit) || DEFAULT_BATCH_LIMIT), MAX_BATCH_LIMIT);

    try {
      const { data, error } = await supabaseAdmin.rpc('archive_old_pickup_events', {
        p_older_than: olderThan,
        p_batch_limit: clampedBatch,
        p_school_id: schoolId
      });

      if (error) {
        return { data: null, error };
      }

      const count = Array.isArray(data) && data[0] ? data[0].archived_count : (data || 0);
      return { data: count, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }
};
