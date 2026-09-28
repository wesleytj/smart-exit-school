import { academicGroupRepository } from '../repositories/academicGroupRepository.js';
import { studentGroupAssignmentRepository } from '../repositories/studentGroupAssignmentRepository.js';

async function requireGroupInSchool(schoolId, academicGroupId) {
  if (!academicGroupId) {
    return { group: null, error: new Error('Selecione a turma.') };
  }

  const { data, error } = await academicGroupRepository.getByIdForSchool(academicGroupId, schoolId);

  if (error) {
    return { group: null, error };
  }

  if (!data || data.school_id !== schoolId) {
    return { group: null, error: new Error('A turma não pertence a esta escola.') };
  }

  if (data.status !== 'active') {
    return { group: null, error: new Error('A turma selecionada está inativa.') };
  }

  return { group: data, error: null };
}

export const studentGroupAssignmentService = {
  async createActive(schoolId, { enrollmentId, academicGroupId }) {
    if (!enrollmentId) {
      return { data: null, error: new Error('Matrícula inválida.') };
    }

    const checked = await requireGroupInSchool(schoolId, academicGroupId);

    if (checked.error) {
      return { data: null, error: checked.error };
    }

    const { data, error } = await studentGroupAssignmentRepository.create({
      student_enrollment_id: enrollmentId,
      academic_group_id: academicGroupId,
      status: 'active'
    });

    return { data: data ?? null, error: error ?? null };
  },

  async replaceActiveGroup(schoolId, { assignmentId, enrollmentId, academicGroupId }) {
    const checked = await requireGroupInSchool(schoolId, academicGroupId);

    if (checked.error) {
      return { data: null, error: checked.error };
    }

    if (!assignmentId) {
      return await this.createActive(schoolId, { enrollmentId, academicGroupId });
    }

    const inactivated = await studentGroupAssignmentRepository.update(assignmentId, { status: 'inactive' });

    if (inactivated.error) {
      return { data: null, error: inactivated.error };
    }

    const created = await studentGroupAssignmentRepository.create({
      student_enrollment_id: enrollmentId,
      academic_group_id: academicGroupId,
      status: 'active'
    });

    if (created.error) {
      await studentGroupAssignmentRepository.update(assignmentId, { status: 'active' });
      return { data: null, error: created.error };
    }

    return { data: created.data ?? null, error: null };
  }
};
