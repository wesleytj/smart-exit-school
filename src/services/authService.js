import { storageClient } from './core/storageClient';
import { STORAGE_KEYS } from './core/keys';

/**
 * Sessão operacional da instituição (legado localStorage).
 *
 * NÃO autentica Platform Admin (isso é Supabase Auth + platformAdminService).
 * NÃO faz login por email/senha em public.schools (ADR-005: schools não tem
 * email/password).
 *
 * TODO(ADR-029): Replace legacy tenant session with Supabase Auth +
 * school_members authentication and remove @SmartExit:loggedSchool.
 */
export const authService = {
  async logout() {
    await storageClient.remove(STORAGE_KEYS.LOGGED_SCHOOL);
  },

  async getCurrentSession() {
    return await storageClient.get(STORAGE_KEYS.LOGGED_SCHOOL);
  },

  async updateCurrentSession(updatedSchoolData) {
    await storageClient.set(STORAGE_KEYS.LOGGED_SCHOOL, updatedSchoolData);
  }
};
