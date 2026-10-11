import { supabase } from '../lib/supabase.js';

export const schoolInvitationRepository = {
  /**
   * Lista os convites da escola para administradores / plataforma
   */
  async listBySchool(schoolId) {
    if (!schoolId) {
      return { data: [], error: null };
    }

    return await supabase
      .from('school_invitations')
      .select(`
        id,
        school_id,
        email,
        role_id,
        status,
        expires_at,
        created_at,
        roles ( id, name ),
        profiles:invited_by ( id, full_name )
      `)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });
  }
};
