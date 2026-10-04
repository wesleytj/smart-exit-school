import { supabase } from '../lib/supabase.js';
import { STORAGE_KEYS } from './core/keys.js';
import { storageClient } from './core/storageClient.js';

export function createAuthService(client = supabase, storage = storageClient) {
  return {
    async logout() {
      await storage.remove(STORAGE_KEYS.LOGGED_SCHOOL);
      if (client?.auth?.signOut) {
        await client.auth.signOut();
      }
    },

    async resetPasswordForEmail(email, options = {}) {
      const defaultRedirect = typeof window !== 'undefined' && window.location?.origin
        ? `${window.location.origin}/update-password`
        : 'http://localhost:5173/update-password';

      const redirectTo = options.redirectTo || defaultRedirect;

      if (!client?.auth?.resetPasswordForEmail) {
        return { data: null, error: new Error('Cliente de autenticação não configurado.') };
      }

      return await client.auth.resetPasswordForEmail(email, { redirectTo });
    },

    async updatePassword(password) {
      if (!client?.auth?.updateUser) {
        return { data: null, error: new Error('Cliente de autenticação não configurado.') };
      }

      return await client.auth.updateUser({ password });
    },

    async getSession() {
      if (!client?.auth?.getSession) {
        return { data: { session: null }, error: new Error('Cliente de autenticação não configurado.') };
      }

      return await client.auth.getSession();
    },

    onAuthStateChange(callback) {
      if (!client?.auth?.onAuthStateChange) {
        return { data: { subscription: { unsubscribe: () => {} } } };
      }

      return client.auth.onAuthStateChange(callback);
    }
  };
}

export const authService = createAuthService();
