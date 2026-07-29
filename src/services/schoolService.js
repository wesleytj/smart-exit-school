import { schoolRepository } from '../repositories/schoolRepository';

/**
 * Camada de serviço do catálogo de instituições (public.schools).
 * Adapta planos/status UI↔DB, gera slug e normaliza payloads.
 * Sem lógica de autenticação (ADR-004 / ADR-005 / ADR-028).
 */

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

function slugifyName(name) {
  const slug = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `school-${Date.now()}`;
}

function isUuid(value) {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

  if (schoolData.slug !== undefined) {
    payload.slug = schoolData.slug;
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

function buildSchoolCreatePayload(schoolData) {
  const name = schoolData.name;
  const payload = {
    name,
    slug: schoolData.slug || slugifyName(name),
    plan: adaptPlanForDatabase(schoolData.plan ?? 'basic'),
    status: adaptStatusForDatabase(schoolData.status ?? 'active')
  };

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

    return data ?? [];
  },

  async getSchoolById(id) {
    const { data, error } = await schoolRepository.getById(id);

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  },

  async saveSchool(schoolData) {
    if (isUuid(schoolData?.id)) {
      const { data: existing, error: existingError } = await schoolRepository.getById(schoolData.id);

      if (existingError) {
        console.error(existingError);
      }

      if (existing) {
        const payload = buildSchoolUpdatePayload(schoolData);

        if (Object.keys(payload).length === 0) {
          return existing;
        }

        const { data, error } = await schoolRepository.update(schoolData.id, payload);

        if (error) {
          console.error(error);
          return schoolData;
        }

        return data;
      }
    }

    const payload = buildSchoolCreatePayload(schoolData);
    const { data, error } = await schoolRepository.create(payload);

    if (error) {
      console.error(error);
      return schoolData;
    }

    return data;
  },

  async deleteSchool(id) {
    const { error } = await schoolRepository.delete(id);

    if (error) {
      console.error(error);
    }
  }
};
