const GROUP_COLUMNS = 'id, school_id, academic_level_id, academic_shift_id, school_year_id, name, display_order, status, external_id, created_at, updated_at';

async function db() {
  const { supabase } = await import('../lib/supabase.js');
  return supabase;
}

export const academicGroupRepository = {
  async getByIdForSchool(id, schoolId) {
    const supabase = await db();
    return await supabase
      .from('academic_groups')
      .select(GROUP_COLUMNS)
      .eq('id', id)
      .eq('school_id', schoolId)
      .maybeSingle();
  },

  async listBySchool(schoolId, schoolYearId = null) {
    const supabase = await db();
    let query = supabase
      .from('academic_groups')
      .select(GROUP_COLUMNS)
      .eq('school_id', schoolId);

    if (schoolYearId) {
      query = query.eq('school_year_id', schoolYearId);
    }

    return await query
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
  },

  async create(row) {
    const supabase = await db();
    return await supabase
      .from('academic_groups')
      .insert(row)
      .select(GROUP_COLUMNS)
      .single();
  },

  async update(id, schoolId, changes) {
    const supabase = await db();
    return await supabase
      .from('academic_groups')
      .update(changes)
      .eq('id', id)
      .eq('school_id', schoolId)
      .select(GROUP_COLUMNS)
      .single();
  },

  async remove(id, schoolId) {
    const supabase = await db();
    return await supabase
      .from('academic_groups')
      .delete()
      .eq('id', id)
      .eq('school_id', schoolId);
  }
};
