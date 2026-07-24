import { supabase } from '../lib/supabase';

export const schoolRepository = {
  async getAll() {
    return await supabase
      .from('schools')
      .select('*');
  },

  async getById(id) {
    return await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .maybeSingle();
  },

  async create(data) {
    return await supabase
      .from('schools')
      .insert(data)
      .select('*')
      .single();
  },

  async update(id, data) {
    return await supabase
      .from('schools')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
  },

  async delete(id) {
    return await supabase
      .from('schools')
      .delete()
      .eq('id', id);
  }
};
