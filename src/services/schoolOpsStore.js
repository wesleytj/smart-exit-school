import { STORAGE_KEYS } from './keys.js';
import { storageClient } from './storageClient.js';
import { pickOperationalState } from './tenantAccess.js';

function opsKey(schoolId) {
  if (typeof schoolId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(schoolId)) {
    return null;
  }

  return `${STORAGE_KEYS.SCHOOL_OPS_PREFIX}${schoolId}`;
}

export const schoolOpsStore = {
  async get(schoolId) {
    const key = opsKey(schoolId);

    if (!key) {
      return null;
    }

    return await storageClient.get(key);
  },

  async save(schoolId, schoolState) {
    const key = opsKey(schoolId);

    if (!key) {
      return;
    }

    await storageClient.set(key, pickOperationalState(schoolState));
  }
};
