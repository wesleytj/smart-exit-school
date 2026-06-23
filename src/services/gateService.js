import { storageClient } from './core/storageClient';
import { STORAGE_KEYS } from './core/keys';

export const gateService = {
  async getGatesBySchool(schoolId) {
    return await storageClient.get(`${STORAGE_KEYS.GATES_PREFIX}${schoolId}`) || [];
  },

  async saveGates(schoolId, gatesList) {
    await storageClient.set(`${STORAGE_KEYS.GATES_PREFIX}${schoolId}`, gatesList);
  }
};