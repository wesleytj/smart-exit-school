const ACTIVE_CALL_COLUMNS = [
  'id',
  'school_id',
  'student_enrollment_id',
  'gate_id',
  'status',
  'called_at',
  'gates(id, name)',
  'student_enrollments(id, student_id, students(id, full_name), student_group_assignments(status, academic_groups(name)))'
].join(', ');

const EVENT_COLUMNS = 'id, school_id, student_enrollment_id, gate_id, status, called_at, completed_at, cancelled_at';

async function db() {
  const { supabase } = await import('../lib/supabase.js');
  return supabase;
}

export function activeCallListQuery(schoolId) {
  return {
    table: 'pickup_events',
    schoolId,
    status: 'called',
    orderColumn: 'called_at',
    ascending: false
  };
}

export const pickupEventRepository = {
  async listActiveBySchool(schoolId) {
    const query = activeCallListQuery(schoolId);
    const supabase = await db();

    return await supabase
      .from(query.table)
      .select(ACTIVE_CALL_COLUMNS)
      .eq('school_id', query.schoolId)
      .eq('status', query.status)
      .order(query.orderColumn, { ascending: query.ascending });
  },

  async findEnrollmentForSchool(enrollmentId, schoolId) {
    const supabase = await db();

    return await supabase
      .from('student_enrollments')
      .select('id, student_id, academic_year, status, students!inner(id, school_id, status)')
      .eq('id', enrollmentId)
      .eq('students.school_id', schoolId)
      .maybeSingle();
  },

  async findGateForSchool(gateId, schoolId) {
    const supabase = await db();

    return await supabase
      .from('gates')
      .select('id, school_id, name, status')
      .eq('id', gateId)
      .eq('school_id', schoolId)
      .maybeSingle();
  },

  async findActiveByEnrollment(enrollmentId) {
    const supabase = await db();

    return await supabase
      .from('pickup_events')
      .select('id, status, student_enrollment_id')
      .eq('student_enrollment_id', enrollmentId)
      .eq('status', 'called')
      .maybeSingle();
  },

  async create({ schoolId, studentEnrollmentId, gateId }) {
    const supabase = await db();

    return await supabase
      .from('pickup_events')
      .insert({
        school_id: schoolId,
        student_enrollment_id: studentEnrollmentId,
        gate_id: gateId
      })
      .select(EVENT_COLUMNS)
      .single();
  },

  async complete(eventId) {
    const supabase = await db();

    return await supabase
      .from('pickup_events')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .eq('status', 'called')
      .select(EVENT_COLUMNS)
      .maybeSingle();
  },

  async cancel(eventId) {
    const supabase = await db();

    return await supabase
      .from('pickup_events')
      .update({
        status: 'cancelled'
      })
      .eq('id', eventId)
      .eq('status', 'called')
      .select(EVENT_COLUMNS)
      .maybeSingle();
  }
};
