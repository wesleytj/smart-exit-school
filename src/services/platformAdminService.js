import { supabase } from '../lib/supabase';
import { platformAdminRepository } from '../repositories/platformAdminRepository';

export const platformAdminService = {
  async isPlatformAdmin(profileId) {
    if (!profileId) {
      return false;
    }

    const { data, error } = await platformAdminRepository.getByProfileId(profileId);

    if (error) {
      console.error(error);
      return false;
    }

    return data !== null;
  },

  async getIsPlatformAdminForCurrentSession() {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error(error);
      return false;
    }

    const profileId = session?.user?.id ?? null;
    return await this.isPlatformAdmin(profileId);
  }
};
