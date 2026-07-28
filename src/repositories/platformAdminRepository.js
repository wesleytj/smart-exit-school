import { supabase } from '../lib/supabase';

export const platformAdminRepository = {
  async getByProfileId(profileId) {
    return await supabase
      .from('platform_admins')
      .select('profile_id, created_at, created_by')
      .eq('profile_id', profileId)
      .maybeSingle();
  }
};
