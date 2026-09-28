import { academicGroupRepository } from '../repositories/academicGroupRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { studentEnrollmentRepository } from '../repositories/studentEnrollmentRepository.js';
import { studentGroupAssignmentRepository } from '../repositories/studentGroupAssignmentRepository.js';
import { currentAcademicYear } from './academicYear.js';
import { studentEnrollmentService } from './studentEnrollmentService.js';
import { studentGroupAssignmentService } from './studentGroupAssignmentService.js';

function requireSchoolId(schoolId) {
  if (!schoolId) {
    return new Error('Escola autorizada ausente.');
  }

  return null;
}

function requireFullName(fullName) {
  const trimmed = String(fullName ?? '').trim();

  if (!trimmed) {
    return { fullName: '', error: new Error('Informe o nome do aluno.') };
  }

  return { fullName: trimmed, error: null };
}

function optionalIdentifier(studentIdentifier) {
  const trimmed = String(studentIdentifier ?? '').trim();
  return trimmed || null;
}

export function mapStudentError(error) {
  if (!error) {
    return null;
  }

  const code = String(error.code || '');
  const message = String(error.message || '');
  const details = String(error.details || '');
  const combined = `${message} ${details}`;

  if (code === '23505' && combined.includes('students_school_identifier_unique')) {
    return new Error('Já existe um aluno com essa matrícula nesta escola.');
  }

  return error;
}

function toView(student, enrollment, assignment, group) {
  return {
    id: student.id,
    schoolId: student.school_id,
    fullName: student.full_name,
    name: student.full_name,
    studentIdentifier: student.student_identifier,
    status: student.status,
    enrollmentId: enrollment?.id ?? null,
    academicYear: enrollment?.academic_year ?? null,
    assignmentId: assignment?.id ?? null,
    academicGroupId: assignment?.academic_group_id ?? null,
    grade: group?.name ?? ''
  };
}

export const studentService = {
  async listForSchool(schoolId, now = new Date()) {
    const schoolError = requireSchoolId(schoolId);

    if (schoolError) {
      return { data: [], error: schoolError };
    }

    const studentsResult = await studentRepository.listBySchool(schoolId);

    if (studentsResult.error) {
      return { data: [], error: studentsResult.error };
    }

    const students = studentsResult.data || [];

    if (students.length === 0) {
      return { data: [], error: null };
    }

    const year = currentAcademicYear(now);
    const enrollmentsResult = await studentEnrollmentRepository.listByStudentIds(students.map((student) => student.id));

    if (enrollmentsResult.error) {
      return { data: [], error: enrollmentsResult.error };
    }

    const enrollments = (enrollmentsResult.data || []).filter((enrollment) => enrollment.academic_year === year);
    const enrollmentIds = enrollments.map((enrollment) => enrollment.id);
    const assignmentsResult = enrollmentIds.length === 0
      ? { data: [], error: null }
      : await studentGroupAssignmentRepository.listByEnrollmentIds(enrollmentIds);

    if (assignmentsResult.error) {
      return { data: [], error: assignmentsResult.error };
    }

    const groupsResult = await academicGroupRepository.listBySchool(schoolId);

    if (groupsResult.error) {
      return { data: [], error: groupsResult.error };
    }

    const enrollmentByStudent = new Map(enrollments.map((enrollment) => [enrollment.student_id, enrollment]));
    const activeAssignmentByEnrollment = new Map(
      (assignmentsResult.data || [])
        .filter((assignment) => assignment.status === 'active')
        .map((assignment) => [assignment.student_enrollment_id, assignment])
    );
    const groupById = new Map((groupsResult.data || []).map((group) => [group.id, group]));

    return {
      data: students.map((student) => {
        const enrollment = enrollmentByStudent.get(student.id) || null;
        const assignment = enrollment ? activeAssignmentByEnrollment.get(enrollment.id) || null : null;
        const group = assignment ? groupById.get(assignment.academic_group_id) || null : null;
        return toView(student, enrollment, assignment, group);
      }),
      error: null
    };
  },

  async registerStudent(schoolId, { fullName, studentIdentifier, academicGroupId }, now = new Date()) {
    const schoolError = requireSchoolId(schoolId);

    if (schoolError) {
      return { data: null, error: schoolError };
    }

    const named = requireFullName(fullName);

    if (named.error) {
      return { data: null, error: named.error };
    }

    const createdStudent = await studentRepository.create({
      school_id: schoolId,
      full_name: named.fullName,
      student_identifier: optionalIdentifier(studentIdentifier),
      status: 'active'
    });

    if (createdStudent.error || !createdStudent.data) {
      return { data: null, error: mapStudentError(createdStudent.error) };
    }

    const createdEnrollment = await studentEnrollmentService.createForCurrentYear(createdStudent.data.id, now);

    if (createdEnrollment.error || !createdEnrollment.data) {
      await studentRepository.remove(createdStudent.data.id, schoolId);
      return { data: null, error: createdEnrollment.error };
    }

    const createdAssignment = await studentGroupAssignmentService.createActive(schoolId, {
      enrollmentId: createdEnrollment.data.id,
      academicGroupId
    });

    if (createdAssignment.error || !createdAssignment.data) {
      await studentRepository.remove(createdStudent.data.id, schoolId);
      return { data: null, error: createdAssignment.error };
    }

    return {
      data: toView(createdStudent.data, createdEnrollment.data, createdAssignment.data, null),
      error: null
    };
  },

  async updateStudent(schoolId, id, { fullName, studentIdentifier, academicGroupId, currentAcademicGroupId, enrollmentId, assignmentId }) {
    const schoolError = requireSchoolId(schoolId);

    if (schoolError || !id) {
      return { data: null, error: schoolError || new Error('Aluno inválido.') };
    }

    const named = requireFullName(fullName);

    if (named.error) {
      return { data: null, error: named.error };
    }

    const updated = await studentRepository.update(id, schoolId, {
      full_name: named.fullName,
      student_identifier: optionalIdentifier(studentIdentifier)
    });

    if (updated.error || !updated.data) {
      return { data: null, error: mapStudentError(updated.error) };
    }

    if (!academicGroupId || !enrollmentId || academicGroupId === currentAcademicGroupId) {
      return { data: toView(updated.data, enrollmentId ? { id: enrollmentId, academic_year: null } : null, assignmentId ? { id: assignmentId, academic_group_id: currentAcademicGroupId } : null, null), error: null };
    }

    const replaced = await studentGroupAssignmentService.replaceActiveGroup(schoolId, {
      assignmentId,
      enrollmentId,
      academicGroupId
    });

    if (replaced.error) {
      return { data: null, error: replaced.error };
    }

    return {
      data: toView(
        updated.data,
        { id: enrollmentId, academic_year: null },
        replaced.data,
        null
      ),
      error: null
    };
  },

  async setStudentStatus(schoolId, id, status) {
    const schoolError = requireSchoolId(schoolId);

    if (schoolError || !id) {
      return { data: null, error: schoolError || new Error('Aluno inválido.') };
    }

    if (status !== 'active' && status !== 'inactive') {
      return { data: null, error: new Error('Status de aluno inválido.') };
    }

    const { data, error } = await studentRepository.update(id, schoolId, { status });

    return { data: data ?? null, error: mapStudentError(error) };
  }
};
