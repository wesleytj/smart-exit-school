import { supabase } from '../lib/supabase';

export const schoolMemberRepository = {
  async listActiveForSession() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return { data: [], error: sessionError };
    }

    const userId = sessionData.session?.user?.id;

    if (!userId) {
      return { data: [], error: null };
    }

    return await supabase
      .from('school_members')
      .select('school_id, status')
      .eq('profile_id', userId)
      .eq('status', 'active');
  },

  async listBySchool(schoolId) {
    if (!schoolId) {
      return { data: [], error: null };
    }

    return await supabase
      .from('school_members')
      .select(`
        id,
        school_id,
        profile_id,
        role_id,
        status,
        created_at,
        profiles ( id, full_name, avatar_url, phone ),
        roles ( id, name )
      `)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: true });
  }
};

