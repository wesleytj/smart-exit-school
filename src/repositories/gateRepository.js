import { supabase } from '../lib/supabase';

const GATE_COLUMNS = 'id, school_id, name, description, display_order, status, created_at, updated_at';

export const gateRepository = {
  async listBySchool(schoolId) {
    return await supabase
      .from('gates')
      .select(GATE_COLUMNS)
      .eq('school_id', schoolId)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
  },

  async create(row) {
    return await supabase
      .from('gates')
      .insert(row)
      .select(GATE_COLUMNS)
      .single();
  },

  async update(id, schoolId, changes) {
    return await supabase
      .from('gates')
      .update(changes)
      .eq('id', id)
      .eq('school_id', schoolId)
      .select(GATE_COLUMNS)
      .single();
  },

  async remove(id, schoolId) {
    return await supabase
      .from('gates')
      .delete()
      .eq('id', id)
      .eq('school_id', schoolId);
  }
};
