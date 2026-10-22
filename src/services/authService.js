import { supabase } from '../lib/supabase.js';
import { STORAGE_KEYS } from './keys.js';
import { storageClient } from './storageClient.js';

export function getPasswordInputProps(show) {
  return {
    inputType: show ? 'text' : 'password',
    buttonAriaLabel: show ? 'Ocultar senha' : 'Mostrar senha',
    buttonAriaPressed: Boolean(show),
  };
}

export function togglePasswordVisibility(current) {
  return !current;
}

export function validateEmail(email) {
  const trimmed = String(email ?? '').trim();

  if (!trimmed) {
    return { valid: false, error: 'Informe seu e-mail.', email: '' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Informe um e-mail válido.', email: trimmed };
  }

  return { valid: true, error: null, email: trimmed };
}

export function validatePasswordUpdate(password, confirmPassword) {
  if (!password) {
    return { valid: false, error: 'A nova senha é obrigatória.' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
  }

  if (!confirmPassword) {
    return { valid: false, error: 'Confirme a nova senha.' };
  }

  if (password !== confirmPassword) {
    return { valid: false, error: 'As senhas não coincidem.' };
  }

  return { valid: true, error: null };
}


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
