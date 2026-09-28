const STUDENT_COLUMNS = 'id, school_id, student_identifier, full_name, birth_date, status, external_id, created_at, updated_at';

async function db() {
  const { supabase } = await import('../lib/supabase.js');
  return supabase;
}

export const studentRepository = {
  async listBySchool(schoolId) {
    const supabase = await db();
    return await supabase
      .from('students')
      .select(STUDENT_COLUMNS)
      .eq('school_id', schoolId)
      .order('full_name', { ascending: true });
  },

  async create(row) {
    const supabase = await db();
    return await supabase
      .from('students')
      .insert(row)
      .select(STUDENT_COLUMNS)
      .single();
  },

  async update(id, schoolId, changes) {
    const supabase = await db();
    return await supabase
      .from('students')
      .update(changes)
      .eq('id', id)
      .eq('school_id', schoolId)
      .select(STUDENT_COLUMNS)
      .single();
  },

  async remove(id, schoolId) {
    const supabase = await db();
    return await supabase
      .from('students')
      .delete()
      .eq('id', id)
      .eq('school_id', schoolId);
  }
};
