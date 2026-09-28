const ENROLLMENT_COLUMNS = 'id, student_id, academic_year, status, external_id, created_at, updated_at';

async function db() {
  const { supabase } = await import('../lib/supabase.js');
  return supabase;
}

export const studentEnrollmentRepository = {
  async listByStudentIds(studentIds) {
    const supabase = await db();
    return await supabase
      .from('student_enrollments')
      .select(ENROLLMENT_COLUMNS)
      .in('student_id', studentIds);
  },

  async create(row) {
    const supabase = await db();
    const { error } = await supabase
      .from('student_enrollments')
      .insert(row);

    return { data: null, error: error ?? null };
  },

  async findByStudentAndYear(studentId, academicYear) {
    const supabase = await db();
    return await supabase
      .from('student_enrollments')
      .select(ENROLLMENT_COLUMNS)
      .eq('student_id', studentId)
      .eq('academic_year', academicYear)
      .maybeSingle();
  },

  async remove(id) {
    const supabase = await db();
    return await supabase
      .from('student_enrollments')
      .delete()
      .eq('id', id);
  }
};
