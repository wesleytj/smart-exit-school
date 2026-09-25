import { academicLevelRepository } from '../repositories/academicLevelRepository.js';
import { nextDisplayOrder } from './gateOrder.js';

function requireSchoolId(schoolId) {
  if (!schoolId) {
    return new Error('Escola autorizada ausente.');
  }

  return null;
}

function requireLevelName(name) {
  const trimmed = String(name ?? '').trim();

  if (!trimmed) {
    return { name: '', error: new Error('Informe o nome do nível acadêmico.') };
  }

  return { name: trimmed, error: null };
}

function requireLevelId(id) {
  if (!id) {
    return new Error('Nível acadêmico inválido.');
  }

  return null;
}

export function mapAcademicLevelError(error) {
  if (!error) {
    return null;
  }

  const code = String(error.code || '');
  const message = String(error.message || '');
  const details = String(error.details || '');
  const combined = `${message} ${details}`;

  if (code === '23505' && combined.includes('academic_levels_school_name_unique')) {
    return new Error('Já existe um nível acadêmico com esse nome nesta escola.');
  }

  return error;
}

export const academicLevelService = {
  async listForSchool(schoolId) {
    const schoolError = requireSchoolId(schoolId);

    if (schoolError) {
      return { data: [], error: schoolError };
    }

    const { data, error } = await academicLevelRepository.listBySchool(schoolId);

    if (error) {
      return { data: [], error };
    }

    return { data: data || [], error: null };
  },

  async createLevel(schoolId, { name, existingLevels }) {
    const schoolError = requireSchoolId(schoolId);

    if (schoolError) {
      return { data: null, error: schoolError };
    }

    const named = requireLevelName(name);

    if (named.error) {
      return { data: null, error: named.error };
    }

    const { data, error } = await academicLevelRepository.create({
      school_id: schoolId,
      name: named.name,
      display_order: nextDisplayOrder(existingLevels),
      status: 'active'
    });

    return { data: data ?? null, error: mapAcademicLevelError(error) };
  },

  async updateLevel(schoolId, id, { name }) {
    const schoolError = requireSchoolId(schoolId);
    const idError = requireLevelId(id);

    if (schoolError || idError) {
      return { data: null, error: schoolError || idError };
    }

    const named = requireLevelName(name);

    if (named.error) {
      return { data: null, error: named.error };
    }

    const { data, error } = await academicLevelRepository.update(id, schoolId, {
      name: named.name
    });

    return { data: data ?? null, error: mapAcademicLevelError(error) };
  },

  async setLevelStatus(schoolId, id, status) {
    const schoolError = requireSchoolId(schoolId);
    const idError = requireLevelId(id);

    if (schoolError || idError) {
      return { data: null, error: schoolError || idError };
    }

    if (status !== 'active' && status !== 'inactive') {
      return { data: null, error: new Error('Status de nível acadêmico inválido.') };
    }

    const { data, error } = await academicLevelRepository.update(id, schoolId, { status });

    return { data: data ?? null, error: mapAcademicLevelError(error) };
  }
};
