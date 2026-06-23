import { storageClient } from './core/storageClient';
import { STORAGE_KEYS } from './core/keys';

export const callService = {
  async getCallsBySchool(schoolId) {
    return await storageClient.get(`${STORAGE_KEYS.CALLED_PREFIX}${schoolId}`) || [];
  },

  async addCall(schoolId, studentCallObject) {
    const calls = await this.getCallsBySchool(schoolId);
    const exists = calls.some(c => c.id === studentCallObject.id);

    if (!exists) {
      const updatedCalls = [studentCallObject, ...calls];
      await storageClient.set(`${STORAGE_KEYS.CALLED_PREFIX}${schoolId}`, updatedCalls);
    }
  },

  async dismissCall(schoolId, studentId) {
    const calls = await this.getCallsBySchool(schoolId);
    const updatedCalls = calls.filter(c => c.id !== studentId);
    await storageClient.set(`${STORAGE_KEYS.CALLED_PREFIX}${schoolId}`, updatedCalls);
  },

  subscribeToCalls(schoolId, callback) {
    const syncCalls = async () => {
      callback(await this.getCallsBySchool(schoolId));
    };

    const handleStorageChange = (e) => {
      if (e.key === `${STORAGE_KEYS.CALLED_PREFIX}${schoolId}`) {
        void syncCalls();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const fallbackTimer = setInterval(() => {
      void syncCalls();
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(fallbackTimer);
    };
  }
};