import { storageClient } from './core/storageClient';
import { STORAGE_KEYS } from './core/keys';

export const themeService = {
  async getThemePreference() {
    const pref = await storageClient.get(STORAGE_KEYS.DARK_MODE);
    return pref === 'true' || pref === true;
  },

  async setThemePreference(isDark) {
    await storageClient.set(STORAGE_KEYS.DARK_MODE, isDark ? 'true' : 'false');
  }
};