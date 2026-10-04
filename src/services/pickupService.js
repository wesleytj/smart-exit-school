import { currentAcademicYear } from './academicYear.js';
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

  async completeCall(eventId) {
    if (!eventId) {
      return { data: null, error: new Error('Chamada inválida.') };
    }

    const result = await pickupEventRepository.complete(eventId);

    if (result.error) {
      return { data: null, error: mapPickupError(result.error) };
    }

    if (!result.data || result.data.status !== 'completed' || !result.data.completed_at) {
      return { data: null, error: new Error('Esta chamada já foi confirmada ou não está mais ativa.') };
    }

    return { data: result.data, error: null };
  },

  async cancelCall(eventId) {
    if (!eventId) {
      return { data: null, error: new Error('Chamada inválida.') };
    }

    const result = await pickupEventRepository.cancel(eventId);

    if (result.error) {
      return { data: null, error: mapPickupError(result.error) };
    }

    if (!result.data || result.data.status !== 'cancelled' || !result.data.cancelled_at) {
      return { data: null, error: new Error('Esta chamada já foi cancelada ou não está mais ativa.') };
    }

    return { data: result.data, error: null };
  },

  /**
   * Relê a fila ativa enquanto Monitor ou TV estiverem abertos.
   * Supabase Realtime pode substituir este intervalo sem mudar a fonte da fila.
   */
  subscribeActiveCalls(schoolId, onResult) {
    if (!schoolId) {
      return () => {};
    }

    const timer = setInterval(() => {
      void this.getActiveCallsBySchool(schoolId).then(onResult);
    }, ACTIVE_CALL_POLL_MS);

    return () => clearInterval(timer);
  }
};
