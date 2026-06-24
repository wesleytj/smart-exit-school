import { storageClient } from './core/storageClient';
import { STORAGE_KEYS } from './core/keys';
import { supabase } from '../lib/supabase';

export const schoolService = {
  async getAllSchools() {
    const { data, error } =
      await supabase
        .from('schools')
        .select('*');

    if (error) {
      console.error(error);
      return [];
    }

    return data;
  },

  async getSchoolById(id) {
    const schools = await this.getAllSchools();
    return schools.find(s => s.id === id) || null;
  },

  async saveSchool(schoolData) {
    const schools = await this.getAllSchools();
    const index = schools.findIndex(s => s.id === schoolData.id);

    if (index >= 0) {
      schools[index] = schoolData;
    } else {
      schools.push(schoolData);
    }

    await storageClient.set(STORAGE_KEYS.SCHOOLS, schools);
    return schoolData;
  },

  async deleteSchool(id) {
    const schools = await this.getAllSchools();
    const updatedSchools = schools.filter(s => s.id !== id);
    await storageClient.set(STORAGE_KEYS.SCHOOLS, updatedSchools);
  },

  async seedInitialMock(mockData) {
    const existing = await this.getAllSchools();
    if (existing.length === 0) {
      await storageClient.set(STORAGE_KEYS.SCHOOLS, mockData);
      return mockData;
    }
    return existing;
  }
};