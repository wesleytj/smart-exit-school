import { storageClient } from './core/storageClient';
import { STORAGE_KEYS } from './core/keys';
import { schoolRepository } from '../repositories/schoolRepository';

function adaptPlanForDatabase(plan) {
  const normalized = String(plan).toLowerCase();

  if (normalized === 'basic') return 'basic';
  if (normalized === 'premium' || normalized === 'pro') return 'pro';
  if (normalized === 'diamond' || normalized === 'enterprise') return 'enterprise';
  if (normalized === 'trial') return 'basic';

  return 'basic';
}

function adaptStatusForDatabase(status) {
  const normalized = String(status).toLowerCase();

  if (normalized === 'ativo' || normalized === 'active') return 'active';
  if (normalized === 'inativo' || normalized === 'inactive') return 'inactive';
  if (normalized === 'trial') return 'trial';
  if (normalized === 'suspended' || normalized === 'suspenso') return 'suspended';

  return 'active';
}

function buildSchoolUpdatePayload(schoolData) {
  const payload = {};

  if (schoolData.name !== undefined) {
    payload.name = schoolData.name;
  }

  if (schoolData.plan !== undefined) {
    payload.plan = adaptPlanForDatabase(schoolData.plan);
  }

  if (schoolData.status !== undefined) {
    payload.status = adaptStatusForDatabase(schoolData.status);
  }

  const primaryColor = schoolData.primary_color ?? schoolData.primaryColor;
  if (primaryColor !== undefined) {
    payload.primary_color = primaryColor;
  }

  const secondaryColor = schoolData.secondary_color ?? schoolData.secondaryColor;
  if (secondaryColor !== undefined) {
    payload.secondary_color = secondaryColor;
  }

  const logoUrl = schoolData.logo_url ?? schoolData.customLogo;
  if (logoUrl !== undefined) {
    payload.logo_url = logoUrl;
  }

  const locale = schoolData.locale ?? schoolData.language;
  if (locale !== undefined) {
    payload.locale = locale;
  }

  return payload;
}

export const schoolService = {
  async getAllSchools() {
    const { data, error } = await schoolRepository.getAll();

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

      const payload = buildSchoolUpdatePayload(schoolData);
      if (Object.keys(payload).length > 0) {
        const { error } = await schoolRepository.update(schoolData.id, payload);
        if (error) {
          console.error(error);
        }
      }
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
