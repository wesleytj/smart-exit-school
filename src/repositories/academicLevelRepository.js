const LEVEL_COLUMNS = 'id, school_id, name, display_order, status, external_id, created_at, updated_at';

async function db() {
  const { supabase } = await import('../lib/supabase.js');
  return supabase;
}

export const academicLevelRepository = {
  async listBySchool(schoolId) {
    const supabase = await db();
    return await supabase
      .from('academic_levels')
      .select(LEVEL_COLUMNS)
      .eq('school_id', schoolId)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
  },

  async getByIdForSchool(id, schoolId) {
    const supabase = await db();
    return await supabase
      .from('academic_levels')
      .select(LEVEL_COLUMNS)
      .eq('id', id)
      .eq('school_id', schoolId)
      .maybeSingle();
  },

  async create(row) {
    const supabase = await db();
    return await supabase
      .from('academic_levels')
      .insert(row)
      .select(LEVEL_COLUMNS)
      .single();
  },

  async update(id, schoolId, changes) {
    const supabase = await db();
    return await supabase
      .from('academic_levels')
      .update(changes)
      .eq('id', id)
      .eq('school_id', schoolId)
      .select(LEVEL_COLUMNS)
      .single();
  },

  async remove(id, schoolId) {
    const supabase = await db();
    return await supabase
      .from('academic_levels')
      .delete()
      .eq('id', id)
      .eq('school_id', schoolId);
  }
};
