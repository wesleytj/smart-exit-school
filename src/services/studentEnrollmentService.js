import { studentEnrollmentRepository } from '../repositories/studentEnrollmentRepository.js';
import { currentAcademicYear } from './academicYear.js';

function requireStudentId(studentId) {
  if (!studentId) {
    return new Error('Aluno inválido.');
  }

  return null;
}

export const studentEnrollmentService = {
  async createForSchoolYear(studentId, schoolYear) {
    const studentError = requireStudentId(studentId);

    if (studentError) {
      return { data: null, error: studentError };
    }

    if (!schoolYear?.id || !schoolYear?.year) {
      return { data: null, error: new Error('Ano letivo inválido para matrícula.') };
    }

    const inserted = await studentEnrollmentRepository.create({
      student_id: studentId,
      school_year_id: schoolYear.id,
      academic_year: schoolYear.year,
      status: 'active'
    });

    if (inserted.error) {
      return { data: null, academicYear: schoolYear.year, schoolYearId: schoolYear.id, error: inserted.error };
    }

    let loaded = await studentEnrollmentRepository.findByStudentAndSchoolYear(studentId, schoolYear.id);

    if (!loaded.data) {
      loaded = await studentEnrollmentRepository.findByStudentAndYear(studentId, schoolYear.year);
    }

    if (loaded.error || !loaded.data) {
      return {
        data: null,
        academicYear: schoolYear.year,
        schoolYearId: schoolYear.id,
        error: loaded.error || new Error('Não foi possível confirmar a matrícula.')
      };
    }

    return { data: loaded.data, academicYear: schoolYear.year, schoolYearId: schoolYear.id, error: null };
  },

  async createForCurrentYear(studentId, now = new Date(), schoolYear = null) {
    const studentError = requireStudentId(studentId);

    if (studentError) {
      return { data: null, error: studentError };
    }

    const academicYear = schoolYear?.year ?? currentAcademicYear(now);
    const schoolYearId = schoolYear?.id ?? null;

    const row = {
      student_id: studentId,
      academic_year: academicYear,
      status: 'active'
    };

    if (schoolYearId) {
      row.school_year_id = schoolYearId;
    }

    const inserted = await studentEnrollmentRepository.create(row);

    if (inserted.error) {
      return { data: null, academicYear, schoolYearId, error: inserted.error };
    }

    let loaded = schoolYearId
      ? await studentEnrollmentRepository.findByStudentAndSchoolYear(studentId, schoolYearId)
      : null;

    if (!loaded || !loaded.data) {
      loaded = await studentEnrollmentRepository.findByStudentAndYear(studentId, academicYear);
    }

    if (loaded.error || !loaded.data) {
      return {
        data: null,
        academicYear,
        schoolYearId,
        error: loaded.error || new Error('Não foi possível confirmar a matrícula.')
      };
    }

    return { data: loaded.data, academicYear, schoolYearId, error: null };
  }
};
