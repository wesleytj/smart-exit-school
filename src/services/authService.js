import { supabase } from '../lib/supabase';
import { STORAGE_KEYS } from './core/keys';
import { storageClient } from './core/storageClient';

export const authService = {
  async logout() {
    await storageClient.remove(STORAGE_KEYS.LOGGED_SCHOOL);
    await supabase.auth.signOut();
  }
};
