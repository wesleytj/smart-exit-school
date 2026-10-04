import { academicGroupRepository } from '../repositories/academicGroupRepository.js';
import { academicLevelRepository } from '../repositories/academicLevelRepository.js';
import { academicShiftRepository } from '../repositories/academicShiftRepository.js';
import { schoolYearService } from './schoolYearService.js';
import { nextDisplayOrder } from './gateOrder.js';

function requireSchoolId(schoolId) {
  if (!schoolId) {
    return new Error('Escola autorizada ausente.');
  }

  return null;
}

function requireGroupName(name) {
  const trimmed = String(name ?? '').trim();

  if (!trimmed) {
    return { name: '', error: new Error('Informe o nome da turma.') };
  }

  return { name: trimmed, error: null };
}

function requireGroupId(id) {
  if (!id) {
    return new Error('Turma inválida.');
  }

  return null;
}

async function requireLevelInSchool(schoolId, academicLevelId) {
  if (!academicLevelId) {
    return new Error('Selecione o nível acadêmico.');
  }

  const { data, error } = await academicLevelRepository.getByIdForSchool(academicLevelId, schoolId);

  if (error) {
    return error;
  }

  if (!data) {
    return new Error('O nível acadêmico não pertence a esta escola.');
  }

  return null;
}

async function requireShift(academicShiftId) {
  if (!academicShiftId) {
    return new Error('Selecione o turno.');
  }

  const { data, error } = await academicShiftRepository.getById(academicShiftId);

  if (error) {
    return error;
  }

  if (!data) {
    return new Error('Turno inválido.');
  }

  return null;
}

export function mapAcademicGroupError(error) {
  if (!error) {
    return null;
  }

  const code = String(error.code || '');
  const message = String(error.message || '');
  const details = String(error.details || '');
  const combined = `${message} ${details}`;

  if (
    code === '23505' &&
    (combined.includes('academic_groups_year_level_shift_name_unique') ||
      combined.includes('academic_groups_school_level_shift_name_unique'))
  ) {
    return new Error('Já existe uma turma com esse nome neste nível e turno.');
  }

  if (code === '23503') {
    return new Error('Nível acadêmico, turno ou ano letivo inválido para esta escola.');
  }

  return error;
}

export const academicGroupService = {
  async listForSchool(schoolId, schoolYearId = null) {
    const schoolError = requireSchoolId(schoolId);

    if (schoolError) {
      return { data: [], error: schoolError };
    }

    const { data, error } = await academicGroupRepository.listBySchool(schoolId, schoolYearId);

    if (error) {
      return { data: [], error: mapAcademicGroupError(error) };
    }

    return { data: data || [], error: null };
  },

  async listShifts() {
    const { data, error } = await academicShiftRepository.list();

    if (error) {
      return { data: [], error };
    }

    return { data: data || [], error: null };
  },

  async createGroup(schoolId, { name, academicLevelId, academicShiftId, schoolYearId, existingGroups }) {
    const schoolError = requireSchoolId(schoolId);

    if (schoolError) {
      return { data: null, error: schoolError };
    }

    const named = requireGroupName(name);

    if (named.error) {
      return { data: null, error: named.error };
    }

    const levelError = await requireLevelInSchool(schoolId, academicLevelId);

    if (levelError) {
      return { data: null, error: levelError };
    }

    const shiftError = await requireShift(academicShiftId);

    if (shiftError) {
      return { data: null, error: shiftError };
    }

    let resolvedYearId = schoolYearId || null;
    if (!resolvedYearId) {
      try {
        const activeYearResult = await schoolYearService.getActiveYear(schoolId);
        if (activeYearResult?.data?.id) {
          resolvedYearId = activeYearResult.data.id;
        }
      } catch {
        resolvedYearId = null;
      }
    }

    const { data, error } = await academicGroupRepository.create({
      school_id: schoolId,
      academic_level_id: academicLevelId,
      academic_shift_id: academicShiftId,
      school_year_id: resolvedYearId,
      name: named.name,
      display_order: nextDisplayOrder(existingGroups),
      status: 'active'
    });

    return { data: data ?? null, error: mapAcademicGroupError(error) };
  },

  async updateGroup(schoolId, id, { name, academicLevelId, academicShiftId, schoolYearId }) {
    const schoolError = requireSchoolId(schoolId);
    const idError = requireGroupId(id);

    if (schoolError || idError) {
      return { data: null, error: schoolError || idError };
    }

    const named = requireGroupName(name);

    if (named.error) {
      return { data: null, error: named.error };
    }

    const levelError = await requireLevelInSchool(schoolId, academicLevelId);

    if (levelError) {
      return { data: null, error: levelError };
    }

    const shiftError = await requireShift(academicShiftId);

    if (shiftError) {
      return { data: null, error: shiftError };
    }

    const changes = {
      name: named.name,
      academic_level_id: academicLevelId,
      academic_shift_id: academicShiftId
    };

    if (schoolYearId) {
      changes.school_year_id = schoolYearId;
    }

    const { data, error } = await academicGroupRepository.update(id, schoolId, changes);

    return { data: data ?? null, error: mapAcademicGroupError(error) };
  },

  async setGroupStatus(schoolId, id, status) {
    const schoolError = requireSchoolId(schoolId);
    const idError = requireGroupId(id);

    if (schoolError || idError) {
      return { data: null, error: schoolError || idError };
    }

    if (status !== 'active' && status !== 'inactive') {
      return { data: null, error: new Error('Status de turma inválido.') };
    }

    const { data, error } = await academicGroupRepository.update(id, schoolId, { status });

    return { data: data ?? null, error: mapAcademicGroupError(error) };
  }
};
