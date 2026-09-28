const ASSIGNMENT_COLUMNS = 'id, student_enrollment_id, academic_group_id, status, assigned_at, created_at, updated_at';

async function db() {
  const { supabase } = await import('../lib/supabase.js');
  return supabase;
}

export const studentGroupAssignmentRepository = {
  async listByEnrollmentIds(enrollmentIds) {
    const supabase = await db();
    return await supabase
      .from('student_group_assignments')
      .select(ASSIGNMENT_COLUMNS)
      .in('student_enrollment_id', enrollmentIds);
  },

  async create(row) {
    const supabase = await db();
    return await supabase
      .from('student_group_assignments')
      .insert(row)
      .select(ASSIGNMENT_COLUMNS)
      .single();
  },

  async update(id, changes) {
    const supabase = await db();
    return await supabase
      .from('student_group_assignments')
      .update(changes)
      .eq('id', id)
      .select(ASSIGNMENT_COLUMNS)
      .single();
  }
};
