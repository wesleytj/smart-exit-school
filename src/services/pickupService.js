import { currentAcademicYear } from './schoolYearService.js';
import { pickupEventRepository } from '../repositories/pickupEventRepository.js';

export const ACTIVE_CALL_POLL_MS = 5000;

function requireSchoolId(schoolId) {
  if (!schoolId) {
    return new Error('Escola autorizada ausente.');
  }

  return null;
}

export function formatCallTime(calledAt) {
  const date = new Date(calledAt);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatWaitTime(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(Number(seconds))) {
    return '-';
  }
  const sec = Math.max(0, Math.round(Number(seconds)));
  if (sec < 60) {
    return `${sec} s`;
  }
  const mins = Math.floor(sec / 60);
  const remSec = sec % 60;
  return remSec > 0 ? `${mins} min ${remSec} s` : `${mins} min`;
}

export function formatEventDate(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
}

export const MAX_CSV_EXPORT_ROWS = 2000;

export function buildExitHistoryCsv(rows = []) {
  const capRows = (rows || []).slice(0, MAX_CSV_EXPORT_ROWS);
  const headers = [
    'Data',
    'Horário Chamada',
    'Horário Saída/Cancelamento',
    'Tempo de Espera',
    'Aluno',
    'Matrícula',
    'Turma',
    'Portão',
    'Status'
  ];

  const escapeCsv = (val) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const lines = [
    headers.map(escapeCsv).join(';')
  ];

  for (const row of capRows) {
    const statusLabel = row.status === 'completed'
      ? 'Concluída'
      : (row.status === 'cancelled' ? 'Cancelada' : (row.status || '-'));

    const line = [
      escapeCsv(row.dateFormatted || formatEventDate(row.closedAt)),
      escapeCsv(row.calledTime || formatCallTime(row.calledAt)),
      escapeCsv(row.closedTime || formatCallTime(row.closedAt)),
      escapeCsv(row.waitTimeFormatted || formatWaitTime(row.waitTimeSeconds)),
      escapeCsv(row.studentName),
      escapeCsv(row.studentIdentifier || '-'),
      escapeCsv(row.groupName || '-'),
      escapeCsv(row.gateName || '-'),
      escapeCsv(statusLabel)
    ];
    lines.push(line.join(';'));
  }

  return '\uFEFF' + lines.join('\r\n');
}

export function mapExitEvent(row) {
  const enrollment = row.student_enrollments || null;
  const student = enrollment?.students || null;
  const assignments = Array.isArray(enrollment?.student_group_assignments)
    ? enrollment.student_group_assignments
    : [];
  const activeAssignment = assignments.find((a) => a.status === 'active') || assignments[0] || null;

  const calledAt = row.called_at || null;
  const completedAt = row.completed_at || null;
  const cancelledAt = row.cancelled_at || null;
  const closedAt = completedAt || cancelledAt || calledAt;

  let waitTimeSeconds = null;
  if (completedAt && calledAt) {
    const diffMs = new Date(completedAt).getTime() - new Date(calledAt).getTime();
    waitTimeSeconds = Math.max(0, Math.round(diffMs / 1000));
  }

  return {
    id: row.id,
    schoolId: row.school_id,
    enrollmentId: row.student_enrollment_id,
    studentId: student?.id || enrollment?.student_id || null,
    studentName: student?.full_name || '',
    studentIdentifier: student?.identifier || student?.student_identifier || enrollment?.student_identifier || enrollment?.identifier || '',
    groupName: activeAssignment?.academic_groups?.name || '',
    groupId: activeAssignment?.academic_group_id || activeAssignment?.academic_groups?.id || null,
    gateId: row.gate_id,
    gateName: row.gates?.name || '',
    status: row.status,
    calledAt,
    completedAt,
    cancelledAt,
    closedAt,
    waitTimeSeconds,
    waitTimeFormatted: formatWaitTime(waitTimeSeconds),
    calledTime: formatCallTime(calledAt),
    closedTime: formatCallTime(closedAt),
    dateFormatted: formatEventDate(closedAt)
  };
}

export function compareCalledAtDesc(left, right) {
  const leftTime = new Date(left?.calledAt || left?.called_at || 0).getTime();
  const rightTime = new Date(right?.calledAt || right?.called_at || 0).getTime();
  return rightTime - leftTime;
}

export function mapActiveCall(row) {
  const enrollment = row.student_enrollments || null;
  const student = enrollment?.students || null;
  const assignments = Array.isArray(enrollment?.student_group_assignments)
    ? enrollment.student_group_assignments
    : [];
  const activeAssignment = assignments.find((assignment) => assignment.status === 'active');
  const calledAt = row.called_at;

  return {
    id: row.id,
    studentId: student?.id || enrollment?.student_id || null,
    enrollmentId: row.student_enrollment_id,
    name: student?.full_name || '',
    grade: activeAssignment?.academic_groups?.name || '',
    gateId: row.gate_id,
    gateName: row.gates?.name || '',
    status: row.status,
    calledAt,
    time: formatCallTime(calledAt)
  };
}

export function availableStudents(students, activeCalls) {
  const calledEnrollmentIds = new Set(
    (activeCalls || []).map((call) => call.enrollmentId).filter(Boolean)
  );

  return (students || []).filter((student) => student.enrollmentId && !calledEnrollmentIds.has(student.enrollmentId));
}

export function splitActiveQueue(calls) {
  const ordered = [...(calls || [])].sort(compareCalledAtDesc);

  return {
    current: ordered[0] || null,
    following: ordered.slice(1)
  };
}

function mapPickupError(error) {
  if (!error) {
    return null;
  }

  const code = String(error.code || '');
  const message = `${error.message || ''} ${error.details || ''}`;

  if (code === '23505' && message.includes('pickup_events_active_enrollment_unique')) {
    return new Error('Este aluno já está na fila.');
  }

  if (code === '23514' && (message.includes('same school') || message.includes('must match the enrollment school'))) {
    return new Error('A matrícula e o portão precisam ser da mesma escola.');
  }

  if (code === '23514' && message.includes('must start as called')) {
    return new Error('A chamada precisa começar como chamada ativa.');
  }

  if (code === '23514' && message.includes('identity fields are immutable')) {
    return new Error('A escola, a matrícula, o portão e o horário da chamada não podem ser alterados.');
  }

  if (message.includes('A chamada não pertence a esta escola')) {
    return new Error('A chamada não pertence a esta escola.');
  }

  if (code === '23514' && (
    message.includes('can only change from called to completed') ||
    message.includes('can only transition from called to completed or cancelled') ||
    message.includes('only be completed')
  )) {
    return new Error('Esta chamada já foi confirmada ou não está mais ativa.');
  }

  return error;
}

export const pickupService = {
  async getActiveCallsBySchool(schoolId) {
    const schoolError = requireSchoolId(schoolId);

    if (schoolError) {
      return { data: [], error: schoolError };
    }

    const result = await pickupEventRepository.listActiveBySchool(schoolId);

    if (result.error) {
      return { data: [], error: result.error };
    }

    const calls = (result.data || [])
      .filter((row) => row.status === 'called')
      .map(mapActiveCall)
      .sort(compareCalledAtDesc);

    return { data: calls, error: null };
  },

  async callStudent({ schoolId, studentEnrollmentId, gateId }, now = new Date()) {
    const schoolError = requireSchoolId(schoolId);

    if (schoolError || !studentEnrollmentId || !gateId) {
      return { data: null, error: schoolError || new Error('Informe a escola, a matrícula e o portão.') };
    }

    const enrollmentResult = await pickupEventRepository.findEnrollmentForSchool(studentEnrollmentId, schoolId);

    if (enrollmentResult.error) {
      return { data: null, error: enrollmentResult.error };
    }

    const enrollment = enrollmentResult.data;

    if (!enrollment || enrollment.students?.school_id !== schoolId) {
      return { data: null, error: new Error('A matrícula não pertence a esta escola.') };
    }

    const isYearActive = enrollment.school_years
      ? enrollment.school_years.is_active === true
      : enrollment.academic_year === currentAcademicYear(now);

    if (enrollment.status !== 'active' || !isYearActive || enrollment.students?.status !== 'active') {
      return { data: null, error: new Error('A matrícula não está ativa para chamada.') };
    }

    const gateResult = await pickupEventRepository.findGateForSchool(gateId, schoolId);

    if (gateResult.error) {
      return { data: null, error: gateResult.error };
    }

    const gate = gateResult.data;

    if (!gate || gate.school_id !== schoolId) {
      return { data: null, error: new Error('O portão não pertence a esta escola.') };
    }

    if (gate.status !== 'active') {
      return { data: null, error: new Error('Este portão está inativo.') };
    }

    const activeResult = await pickupEventRepository.findActiveByEnrollment(studentEnrollmentId);

    if (activeResult.error) {
      return { data: null, error: activeResult.error };
    }

    if (activeResult.data?.status === 'called') {
      return { data: null, error: new Error('Este aluno já está na fila.') };
    }

    const created = await pickupEventRepository.create({
      schoolId,
      studentEnrollmentId,
      gateId
    });

    if (created.error || !created.data) {
      return { data: null, error: mapPickupError(created.error) || new Error('Não foi possível chamar o aluno.') };
    }

    return { data: created.data, error: null };
  },

  async completeCall(eventId, schoolId = null) {
    if (!eventId) {
      return { data: null, error: new Error('Chamada inválida.') };
    }

    const result = await pickupEventRepository.complete(eventId, schoolId);

    if (result.error) {
      return { data: null, error: mapPickupError(result.error) };
    }

    if (!result.data || result.data.status !== 'completed' || !result.data.completed_at) {
      return { data: null, error: new Error('Esta chamada já foi confirmada ou não está mais ativa.') };
    }

    return { data: result.data, error: null };
  },

  async cancelCall(eventId, schoolId = null) {
    if (!eventId) {
      return { data: null, error: new Error('Chamada inválida.') };
    }

    const result = await pickupEventRepository.cancel(eventId, schoolId);

    if (result.error) {
      return { data: null, error: mapPickupError(result.error) };
    }

    if (!result.data || result.data.status !== 'cancelled' || !result.data.cancelled_at) {
      return { data: null, error: new Error('Esta chamada já foi cancelada ou não está mais ativa.') };
    }

    return { data: result.data, error: null };
  },

  /**
   * Sincronização em tempo real das chamadas ativas com Supabase Realtime
   * e estratégia dual-mode com polling de fallback automático.
   */
  subscribeActiveCalls(schoolId, onResult, options = {}) {
    if (!schoolId) return () => {};

    const {
      debounceMs = 50,
      fallbackPollMs = 5000,
      heartbeatMs = 30000,
      onStatusChange = () => {},
    } = options;

    let channel = null;
    let fallbackTimer = null;
    let heartbeatTimer = null;
    let debounceTimer = null;
    let isSubscribed = false;

    // Fetch inicial imediato
    const fetchInitial = async () => {
      try {
        const result = await this.getActiveCallsBySchool(schoolId);
        if (!result.error) {
          onResult(result.data);
        }
      } catch (err) {
        console.error('[pickupService] Erro no fetch inicial:', err);
      }
    };

    // Refetch com debounce (coalescer múltiplos eventos simultâneos)
    const debouncedRefetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          const result = await this.getActiveCallsBySchool(schoolId);
          if (!result.error) {
            onResult(result.data);
          }
        } catch (err) {
          console.error('[pickupService] Erro no refetch:', err);
        }
      }, debounceMs);
    };

    // Ativar polling de fallback
    const startFallbackPolling = () => {
      if (fallbackTimer) return; // Já está ativo
      console.warn('[pickupService] Ativando polling de fallback (WebSocket desconectado)');
      onStatusChange('fallback');
      fallbackTimer = setInterval(() => {
        void this.getActiveCallsBySchool(schoolId).then((result) => {
          if (!result.error) onResult(result.data);
        });
      }, fallbackPollMs);
    };

    // Desativar polling de fallback
    const stopFallbackPolling = () => {
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
        fallbackTimer = null;
        console.info('[pickupService] Polling de fallback desativado');
      }
    };

    // Heartbeat suave para reconciliação periódica
    const startHeartbeat = () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = setInterval(() => {
        void this.getActiveCallsBySchool(schoolId).then((result) => {
          if (!result.error) onResult(result.data);
        });
      }, heartbeatMs);
    };

    // Criar canal Realtime
    const createChannel = async () => {
      try {
        const { db, supabase: directSupabase } = await import('../lib/supabase.js');
        const supabase = typeof db === 'function' ? await db() : directSupabase;

        channel = supabase
          .channel(`pickup_events:${schoolId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pickup_events',
              filter: `school_id=eq.${schoolId}`,
            },
            (payload) => {
              console.debug('[pickupService] Evento Realtime recebido:', payload.eventType, payload.new?.id);
              debouncedRefetch();
            }
          )
          .subscribe((status, err) => {
            console.info('[pickupService] Status da subscription:', status, { isSubscribed });
            if (err) {
              console.error('[pickupService] Erro no status da subscription:', err);
            }
            onStatusChange(status);

            if (status === 'SUBSCRIBED') {
              isSubscribed = true;
              stopFallbackPolling();
              startHeartbeat();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              isSubscribed = false;
              startFallbackPolling();
            }
          });
      } catch (err) {
        console.error('[pickupService] Erro ao criar canal Realtime:', err);
        startFallbackPolling();
      }
    };

    // Inicializar
    void fetchInitial();
    void createChannel();

    // Função de cleanup
    return () => {
      console.info('[pickupService] Limpando subscription');
      if (debounceTimer) clearTimeout(debounceTimer);
      if (fallbackTimer) clearInterval(fallbackTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (channel) {
        void (async () => {
          try {
            const { db, supabase: directSupabase } = await import('../lib/supabase.js');
            const supabase = typeof db === 'function' ? await db() : directSupabase;
            await supabase.removeChannel(channel);
          } catch (err) {
            console.error('[pickupService] Erro ao remover canal:', err);
          }
        })();
      }
    };
  },

  /**
   * Consulta histórico de saídas normalizado e paginado.
   */
  async getExitHistory({
    schoolId,
    status = 'all',
    gateId = '',
    groupId = '',
    search = '',
    from = null,
    to = null,
    page = 1,
    pageSize = 25,
    limit,
    offset,
    includeArchive = true
  } = {}) {
    const schoolError = requireSchoolId(schoolId);
    if (schoolError) {
      return { data: [], total: 0, totalCount: 0, page: 1, pageSize: 25, totalPages: 0, error: schoolError };
    }

    const size = Math.max(1, Math.min(2000, Number(limit ?? pageSize) || 25));
    const off = offset !== undefined ? Math.max(0, Number(offset) || 0) : ((Math.max(1, Number(page) || 1) - 1) * size);
    const p = offset !== undefined ? Math.floor(off / size) + 1 : Math.max(1, Number(page) || 1);

    const result = await pickupEventRepository.listHistoryBySchool({
      schoolId,
      status,
      gateId: gateId || null,
      from,
      to,
      limit: size,
      offset: off,
      includeArchive
    });

    if (result.error) {
      return { data: [], total: 0, totalCount: 0, page: p, pageSize: size, totalPages: 0, error: result.error };
    }

    let mapped = (result.data || []).map(mapExitEvent);

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      mapped = mapped.filter((row) =>
        row.studentName.toLowerCase().includes(term) ||
        row.studentIdentifier.toLowerCase().includes(term)
      );
    }

    if (groupId && groupId.trim()) {
      const gTerm = groupId.trim().toLowerCase();
      mapped = mapped.filter((row) =>
        row.groupId === groupId ||
        row.groupName.toLowerCase() === gTerm
      );
    }

    // Caso o repositório retorne mais dados que o limite (ex.: mocks/stubs em testes)
    if (mapped.length > size) {
      mapped = mapped.slice(0, size);
    }

    const totalCount = result.count !== undefined ? result.count : mapped.length;
    const totalPages = Math.ceil(totalCount / size);

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
   * Calcula métricas analíticas e consolidadas de saída para o período.
   */
  async getExitMetrics({
    schoolId,
    from = null,
    to = null,
    gateId = null,
    groupId = null,
    includeArchive = true
  } = {}) {
    const schoolError = requireSchoolId(schoolId);
    if (schoolError) {
      return { data: null, error: schoolError };
    }

    const result = await pickupEventRepository.listHistoryBySchool({
      schoolId,
      status: 'all',
      gateId: gateId || null,
      from,
      to,
      limit: 2000,
      offset: 0,
      includeArchive
    });

    if (result.error) {
      return { data: null, error: result.error };
    }

    let rows = (result.data || []).map(mapExitEvent);

    if (groupId && groupId.trim()) {
      const gTerm = groupId.trim().toLowerCase();
      rows = rows.filter((r) => r.groupId === groupId || r.groupName.toLowerCase() === gTerm);
    }

    const totalExits = rows.length;
    const completedEvents = rows.filter((r) => r.status === 'completed');
    const cancelledEvents = rows.filter((r) => r.status === 'cancelled');
    const completedCount = completedEvents.length;
    const cancelledCount = cancelledEvents.length;

    const cancellationRate = totalExits > 0
      ? `${((cancelledCount / totalExits) * 100).toFixed(1)}%`
      : '0.0%';

    let totalWaitSeconds = 0;
    let waitEventsCount = 0;
    for (const ev of completedEvents) {
      if (typeof ev.waitTimeSeconds === 'number') {
        totalWaitSeconds += ev.waitTimeSeconds;
        waitEventsCount++;
      }
    }

    const averageWaitTimeSeconds = waitEventsCount > 0
      ? Math.round(totalWaitSeconds / waitEventsCount)
      : 0;

    const gateMap = new Map();
    const groupMap = new Map();

    for (const ev of rows) {
      const gName = ev.gateName || 'Não informado';
      const grpName = ev.groupName || 'Sem turma';

      if (!gateMap.has(gName)) {
        gateMap.set(gName, { gateName: gName, count: 0, completedCount: 0, cancelledCount: 0 });
      }
      const gEntry = gateMap.get(gName);
      gEntry.count++;
      if (ev.status === 'completed') gEntry.completedCount++;
      if (ev.status === 'cancelled') gEntry.cancelledCount++;

      if (!groupMap.has(grpName)) {
        groupMap.set(grpName, { groupName: grpName, count: 0, completedCount: 0, cancelledCount: 0 });
      }
      const grpEntry = groupMap.get(grpName);
      grpEntry.count++;
      if (ev.status === 'completed') grpEntry.completedCount++;
      if (ev.status === 'cancelled') grpEntry.cancelledCount++;
    }

    const byGate = Array.from(gateMap.values()).sort((a, b) => b.count - a.count);
    for (const item of byGate) {
      byGate[item.gateName] = item.count;
    }

    const byGroup = Array.from(groupMap.values()).sort((a, b) => b.count - a.count);
    for (const item of byGroup) {
      byGroup[item.groupName] = item.count;
    }

    return {
      data: {
        total: totalExits,
        totalExits,
        completed: completedCount,
        completedCount,
        cancelled: cancelledCount,
        cancelledCount,
        cancellationRate,
        averageWaitTimeSeconds,
        averageWaitTimeFormatted: formatWaitTime(averageWaitTimeSeconds),
        byGate,
        byGroup
      },
      error: null
    };
  }
};
