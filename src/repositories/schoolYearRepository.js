const YEAR_COLUMNS = 'id, school_id, year, is_active, starts_at, ends_at, created_at, updated_at';

async function db() {
  const { supabase } = await import('../lib/supabase.js');
  return supabase;
}

export const schoolYearRepository = {
  async listBySchool(schoolId) {
    const supabase = await db();
    return await supabase
      .from('school_years')
      .select(YEAR_COLUMNS)
      .eq('school_id', schoolId)
      .order('year', { ascending: false });
  },

  async getActive(schoolId) {
    const supabase = await db();
    return await supabase
      .from('school_years')
      .select(YEAR_COLUMNS)
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .maybeSingle();
  },

  async getByIdForSchool(id, schoolId) {
    const supabase = await db();
    return await supabase
      .from('school_years')
      .select(YEAR_COLUMNS)
      .eq('id', id)
      .eq('school_id', schoolId)
      .maybeSingle();
  },

  async create(row) {
    const supabase = await db();
    return await supabase
      .from('school_years')
      .insert(row)
      .select(YEAR_COLUMNS)
      .single();
  },

  async update(id, schoolId, changes) {
    const supabase = await db();
    return await supabase
      .from('school_years')
      .update(changes)
      .eq('id', id)
      .eq('school_id', schoolId)
      .select(YEAR_COLUMNS)
      .single();
  },

  async activate(id, schoolId) {
    const supabase = await db();

    const deactivateResult = await supabase
      .from('school_years')
      .update({ is_active: false })
      .eq('school_id', schoolId)
      .neq('id', id)
      .eq('is_active', true);

    if (deactivateResult.error) {
      return { data: null, error: deactivateResult.error };
    }

    return await supabase
      .from('school_years')
      .update({ is_active: true })
      .eq('id', id)
      .eq('school_id', schoolId)
      .select(YEAR_COLUMNS)
      .single();
  }
};
