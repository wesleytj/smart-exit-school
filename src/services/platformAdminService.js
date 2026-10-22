import { supabase } from '../lib/supabase.js';
import { platformAdminRepository } from '../repositories/platformAdminRepository.js';

export function isSameUserRevalidation(resolvedUserId, sessionUserId) {
  return Boolean(resolvedUserId) && resolvedUserId === sessionUserId;
}


export const platformAdminService = {
  async isPlatformAdmin(profileId) {
    if (!profileId) {
      return false;
    }

    const { data, error } = await platformAdminRepository.isPlatformAdmin();

    if (error) {
      console.error(error);
      return false;
    }

    return data === true;
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
