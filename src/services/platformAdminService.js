import { platformAdminRepository } from '../repositories/platformAdminRepository';

/**
 * Regras de autorização do domínio Platform (ADR-028).
 * Autenticação Auth fica no cliente Supabase / Login; este service só interpreta a RPC.
 */
export const platformAdminService = {
  /**
   * Retorna true se o profile autenticado for Platform Admin.
   * @param {string|null|undefined} profileId - auth.uid() / profiles.id
   */
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
  }
};
