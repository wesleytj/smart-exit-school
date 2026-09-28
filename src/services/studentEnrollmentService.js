import { studentEnrollmentRepository } from '../repositories/studentEnrollmentRepository.js';
import { currentAcademicYear } from './academicYear.js';

function requireStudentId(studentId) {
  if (!studentId) {
    return new Error('Aluno inválido.');
  }

  return null;
}

export const studentEnrollmentService = {
  async createForCurrentYear(studentId, now = new Date()) {
    const studentError = requireStudentId(studentId);

    if (studentError) {
      return { data: null, error: studentError };
    }

    const academicYear = currentAcademicYear(now);
    const inserted = await studentEnrollmentRepository.create({
      student_id: studentId,
      academic_year: academicYear,
      status: 'active'
    });

    if (inserted.error) {
      return { data: null, academicYear, error: inserted.error };
    }

    const loaded = await studentEnrollmentRepository.findByStudentAndYear(studentId, academicYear);

    if (loaded.error || !loaded.data) {
      return {
        data: null,
        academicYear,
        error: loaded.error || new Error('Não foi possível confirmar a matrícula.')
      };
    }

    return { data: loaded.data, academicYear, error: null };
  }
};
