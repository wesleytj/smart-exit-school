const SHIFT_COLUMNS = 'id, name, description, created_at, updated_at';

async function db() {
  const { supabase } = await import('../lib/supabase.js');
  return supabase;
}

export const academicShiftRepository = {
  async list() {
    const supabase = await db();
    return await supabase
      .from('academic_shifts')
      .select(SHIFT_COLUMNS)
      .order('name', { ascending: true });
  },

  async getById(id) {
    const supabase = await db();
    return await supabase
      .from('academic_shifts')
      .select(SHIFT_COLUMNS)
      .eq('id', id)
      .maybeSingle();
  }
};
