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

const HISTORY_COLUMNS = [
  'id',
  'school_id',
  'student_enrollment_id',
  'gate_id',
  'status',
  'called_at',
  'completed_at',
  'cancelled_at',
  'gates(id, name)',
  'student_enrollments(id, student_id, students(id, full_name, identifier), student_group_assignments(status, academic_groups(id, name)))'
].join(', ');

function normalizeDateBoundaries(from, to) {
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

function applyHistoryFilters(queryBuilder, { schoolId, status, gateId, from, to }) {
  let q = queryBuilder.eq('school_id', schoolId);

  if (status === 'completed' || status === 'cancelled') {
    q = q.eq('status', status);
  } else {
    // Chamadas 'called' NUNCA entram no histórico
    q = q.in('status', ['completed', 'cancelled']);
  }

  if (gateId) {
    q = q.eq('gate_id', gateId);
  }

  const { from: normFrom, to: normTo } = normalizeDateBoundaries(from, to);

  if (normFrom) {
    q = q.gte('called_at', normFrom);
  }

  if (normTo) {
    q = q.lte('called_at', normTo);
  }

  return q;
}

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
      .select('id, student_id, school_year_id, academic_year, status, students!inner(id, school_id, status), school_years(id, year, is_active)')
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

  async complete(eventId, schoolId = null) {
    const supabase = await db();

    const { data: event, error: fetchError } = await supabase
      .from('pickup_events')
      .select('id, school_id, status')
      .eq('id', eventId)
      .maybeSingle();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    if (!event) {
      return { data: null, error: new Error('Pickup event not found') };
    }

    if (schoolId && event.school_id !== schoolId) {
      return { data: null, error: new Error('A chamada não pertence a esta escola.') };
    }

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

  async cancel(eventId, schoolId = null) {
    const supabase = await db();

    const { data: event, error: fetchError } = await supabase
      .from('pickup_events')
      .select('id, school_id, status')
      .eq('id', eventId)
      .maybeSingle();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    if (!event) {
      return { data: null, error: new Error('Pickup event not found') };
    }

    if (schoolId && event.school_id !== schoolId) {
      return { data: null, error: new Error('A chamada não pertence a esta escola.') };
    }

    return await supabase
      .from('pickup_events')
      .update({
        status: 'cancelled'
      })
      .eq('id', eventId)
      .eq('status', 'called')
      .select(EVENT_COLUMNS)
      .maybeSingle();
  },

  async listHistoryBySchool({
    schoolId,
    status = 'all',
    gateId = null,
    from = null,
    to = null,
    limit = 25,
    offset = 0,
    includeArchive = true
  } = {}) {
    const supabase = await db();

    let hotQuery = supabase
      .from('pickup_events')
      .select(HISTORY_COLUMNS, { count: 'exact' });
    hotQuery = applyHistoryFilters(hotQuery, { schoolId, status, gateId, from, to });
    hotQuery = hotQuery.order('called_at', { ascending: false });

    if (!includeArchive) {
      const { data, count, error } = await hotQuery.range(offset, offset + limit - 1);
      return { data: data || [], count: count || 0, error };
    }

    let archiveQuery = supabase
      .from('pickup_events_archive')
      .select(HISTORY_COLUMNS, { count: 'exact' });
    archiveQuery = applyHistoryFilters(archiveQuery, { schoolId, status, gateId, from, to });
    archiveQuery = archiveQuery.order('called_at', { ascending: false });

    const [hotRes, archiveRes] = await Promise.all([
      hotQuery,
      archiveQuery
    ]);

    if (hotRes.error && !archiveRes.error) {
      return { data: [], count: 0, error: hotRes.error };
    }

    const hotData = hotRes.data || [];
    const archiveData = (archiveRes.error ? [] : archiveRes.data) || [];
    const totalCount = (hotRes.count || 0) + (archiveRes.error ? 0 : (archiveRes.count || 0));

    const combined = [...hotData, ...archiveData].sort((a, b) => {
      const timeA = new Date(a.completed_at || a.cancelled_at || a.called_at || 0).getTime();
      const timeB = new Date(b.completed_at || b.cancelled_at || b.called_at || 0).getTime();
      return timeB - timeA;
    });

    const pagedData = combined.slice(offset, offset + limit);

    return {
      data: pagedData,
      count: totalCount,
      error: hotRes.error || null
    };
  },

  async countHistoryBySchool({
    schoolId,
    status = 'all',
    gateId = null,
    from = null,
    to = null,
    includeArchive = true
  } = {}) {
    const supabase = await db();

    let hotQuery = supabase
      .from('pickup_events')
      .select('id', { count: 'exact', head: true });
    hotQuery = applyHistoryFilters(hotQuery, { schoolId, status, gateId, from, to });

    if (!includeArchive) {
      const { count, error } = await hotQuery;
      return { count: count || 0, error };
    }

    let archiveQuery = supabase
      .from('pickup_events_archive')
      .select('id', { count: 'exact', head: true });
    archiveQuery = applyHistoryFilters(archiveQuery, { schoolId, status, gateId, from, to });

    const [hotRes, archiveRes] = await Promise.all([
      hotQuery,
      archiveQuery
    ]);

    const hotCount = hotRes.count || 0;
    const archiveCount = archiveRes.error ? 0 : (archiveRes.count || 0);

    return {
      count: hotCount + archiveCount,
      error: hotRes.error || null
    };
  }
};
