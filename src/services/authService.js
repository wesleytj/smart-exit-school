import { storageClient } from './core/storageClient';
import { STORAGE_KEYS } from './core/keys';
import { schoolService } from './schoolService';

export const authService = {
  async login(email, password) {
    const schools = await schoolService.getAllSchools();
    const schoolFound = schools.find(s => s.email === email && s.password === password);
    
    if (schoolFound) {
      await storageClient.set(STORAGE_KEYS.LOGGED_SCHOOL, schoolFound);
      return schoolFound;
    }
    return null;
  },

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