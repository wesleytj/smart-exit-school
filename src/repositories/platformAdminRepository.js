import { supabase } from '../lib/supabase';

/**
 * Acesso puro à RPC de Platform Admin.
 * Sem regras de negócio — interpretação fica no platformAdminService.
 */
export const platformAdminRepository = {
  /**
   * Chama public.is_platform_admin() (SECURITY DEFINER).
   * Não consulta public.platform_admins diretamente.
   */
  async isPlatformAdmin() {
    return await supabase.rpc('is_platform_admin');
  }
};
