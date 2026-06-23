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
      calls.push(studentCallObject);
      await storageClient.set(`${STORAGE_KEYS.CALLED_PREFIX}${schoolId}`, calls);
    }
  },

  async dismissCall(schoolId, studentId) {
    const calls = await this.getCallsBySchool(schoolId);
    const updatedCalls = calls.filter(c => c.id !== studentId);
    await storageClient.set(`${STORAGE_KEYS.CALLED_PREFIX}${schoolId}`, updatedCalls);
  },

  // Simula o Realtime Subscription do Supabase utilizando eventos de janela para a TV
  subscribeToCalls(schoolId, callback) {
    const handleStorageChange = async (e) => {
      if (e.key === `${STORAGE_KEYS.CALLED_PREFIX}${schoolId}`) {
        const updatedCalls = await this.getCallsBySchool(schoolId);
        callback(updatedCalls);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Retorna a função de unsubscribe
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
};