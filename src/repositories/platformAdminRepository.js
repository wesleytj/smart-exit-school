import { supabase } from '../lib/supabase';

export const platformAdminRepository = {
  /**
   * Resolves Platform Admin status for the current Auth session
   * via public.is_platform_admin() (SECURITY DEFINER).
   * Does not query public.platform_admins directly.
   */
  async isPlatformAdmin() {
    return await supabase.rpc('is_platform_admin');
  }
};
