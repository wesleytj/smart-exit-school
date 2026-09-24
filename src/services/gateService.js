import { gateRepository } from '../repositories/gateRepository';
import { nextDisplayOrder } from './gateOrder';

export { nextDisplayOrder };

function requireSchoolId(schoolId) {
  if (!schoolId) {
    return new Error('Escola autorizada ausente.');
  }

  return null;
}

function requireGateName(name) {
  const trimmed = String(name ?? '').trim();

  if (!trimmed) {
    return { name: '', error: new Error('Informe o nome do portão.') };
  }

  return { name: trimmed, error: null };
}

function mapGateError(error) {
  if (!error) {
    return null;
  }

  const code = String(error.code || '');
  const message = String(error.message || '');
  const details = String(error.details || '');

  if (code === '23505' && (message.includes('gates_school_name_unique') || details.includes('gates_school_name_unique') || message.includes('duplicate'))) {
    return new Error('Já existe um portão com esse nome nesta escola.');
  }

  return error;
}

export const gateService = {
  async listForSchool(schoolId) {
    const schoolError = requireSchoolId(schoolId);

    if (schoolError) {
      return { data: [], error: schoolError };
    }

    const { data, error } = await gateRepository.listBySchool(schoolId);

    if (error) {
      return { data: [], error };
    }

    return { data: data || [], error: null };
  },

  async createGate(schoolId, { name, existingGates }) {
    const schoolError = requireSchoolId(schoolId);

    if (schoolError) {
      return { data: null, error: schoolError };
    }

    const named = requireGateName(name);

    if (named.error) {
      return { data: null, error: named.error };
    }

    const { data, error } = await gateRepository.create({
      school_id: schoolId,
      name: named.name,
      display_order: nextDisplayOrder(existingGates)
    });

    return { data: data ?? null, error: mapGateError(error) };
  },

  async updateGate(schoolId, id, { name }) {
    const schoolError = requireSchoolId(schoolId);

    if (schoolError || !id) {
      return { data: null, error: schoolError || new Error('Portão inválido.') };
    }

    const named = requireGateName(name);

    if (named.error) {
      return { data: null, error: named.error };
    }

    const { data, error } = await gateRepository.update(id, schoolId, { name: named.name });

    return { data: data ?? null, error: mapGateError(error) };
  },

  async deleteGate(schoolId, id) {
    const schoolError = requireSchoolId(schoolId);

    if (schoolError || !id) {
      return { data: null, error: schoolError || new Error('Portão inválido.') };
    }

    const { error } = await gateRepository.remove(id, schoolId);

    return { error: error ?? null };
  }
};
