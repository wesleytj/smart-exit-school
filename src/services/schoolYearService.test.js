import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { schoolYearRepository } from '../repositories/schoolYearRepository.js';
import { schoolYearService, mapSchoolYearError } from './schoolYearService.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { studentEnrollmentRepository } from '../repositories/studentEnrollmentRepository.js';
import { studentGroupAssignmentRepository } from '../repositories/studentGroupAssignmentRepository.js';
import { academicGroupRepository } from '../repositories/academicGroupRepository.js';
import { studentService } from './studentService.js';
import { pickupEventRepository } from '../repositories/pickupEventRepository.js';
import { pickupService } from './pickupService.js';

const SCHOOL_ID = '76f29d9f-c6fd-4561-89f8-403fef0ccb40';
const GATE_ID = 'gate-0001';
const ENROLLMENT_ID = 'enrollment-0001';

function stub(target, methods) {
  const originals = {};

  for (const [name, implementation] of Object.entries(methods)) {
    originals[name] = target[name];
    target[name] = implementation;
  }

  return () => {
    for (const [name, implementation] of Object.entries(originals)) {
      target[name] = implementation;
    }
  };
}

describe('schoolYearService', { concurrency: 1 }, () => {
  it('lists school years for the authorized school', async () => {
    const seen = [];
    const restore = stub(schoolYearRepository, {
      listBySchool: async (schoolId) => {
        seen.push(schoolId);
        return {
          data: [
            { id: 'year-2027', school_id: schoolId, year: 2027, is_active: false },
            { id: 'year-2026', school_id: schoolId, year: 2026, is_active: true }
          ],
          error: null
        };
      }
    });

    const result = await schoolYearService.listYears(SCHOOL_ID);
    restore();

    assert.deepEqual(seen, [SCHOOL_ID]);
    assert.equal(result.error, null);
    assert.equal(result.data.length, 2);
    assert.equal(result.data[0].year, 2027);
    assert.equal(result.data[1].is_active, true);
  });

  it('rejects listing years when schoolId is missing', async () => {
    const result = await schoolYearService.listYears('');
    assert.equal(result.error.message, 'Escola autorizada ausente.');
    assert.deepEqual(result.data, []);
  });

  it('retrieves the currently active year for the school', async () => {
    const restore = stub(schoolYearRepository, {
      getActive: async (schoolId) => ({
        data: { id: 'year-2026', school_id: schoolId, year: 2026, is_active: true },
        error: null
      })
    });

    const result = await schoolYearService.getActiveYear(SCHOOL_ID);
    restore();

    assert.equal(result.error, null);
    assert.equal(result.data.year, 2026);
    assert.equal(result.data.is_active, true);
  });

  it('validates year bounds and date ranges when creating a year', async () => {
    const invalidYear = await schoolYearService.createYear(SCHOOL_ID, { year: 1998 });
    assert.match(invalidYear.error.message, /Ano letivo inválido/);

    const invalidDates = await schoolYearService.createYear(SCHOOL_ID, {
      year: 2027,
      startsAt: '2027-12-31',
      endsAt: '2027-01-01'
    });
    assert.match(invalidDates.error.message, /data de início deve ser anterior/);
  });

  it('creates an inactive year without activating', async () => {
    let createdRow = null;
    const restore = stub(schoolYearRepository, {
      create: async (row) => {
        createdRow = row;
        return { data: { id: 'year-new', ...row }, error: null };
      }
    });

    const result = await schoolYearService.createYear(SCHOOL_ID, {
      year: 2027,
      startsAt: '2027-02-01',
      endsAt: '2027-11-30',
      isActive: false
    });
    restore();

    assert.equal(result.error, null);
    assert.equal(createdRow.year, 2027);
    assert.equal(createdRow.is_active, false);
    assert.equal(result.data.is_active, false);
  });

  it('activates the newly created year when isActive is true', async () => {
    let activatedId = null;
    const restore = stub(schoolYearRepository, {
      create: async (row) => ({
        data: { id: 'year-2028', ...row },
        error: null
      }),
      activate: async (id, schoolId) => {
        activatedId = id;
        return {
          data: { id, school_id: schoolId, year: 2028, is_active: true },
          error: null
        };
      }
    });

    const result = await schoolYearService.createYear(SCHOOL_ID, {
      year: 2028,
      isActive: true
    });
    restore();

    assert.equal(result.error, null);
    assert.equal(activatedId, 'year-2028');
    assert.equal(result.data.is_active, true);
  });

  it('activates an existing school year atomically', async () => {
    let targetActivated = null;
    const restore = stub(schoolYearRepository, {
      activate: async (id, schoolId) => {
        targetActivated = { id, schoolId };
        return {
          data: { id, school_id: schoolId, year: 2027, is_active: true },
          error: null
        };
      }
    });

    const result = await schoolYearService.activateYear(SCHOOL_ID, 'year-2027');
    restore();

    assert.equal(result.error, null);
    assert.deepEqual(targetActivated, { id: 'year-2027', schoolId: SCHOOL_ID });
    assert.equal(result.data.is_active, true);
  });

  it('maps database unique and check errors accurately', () => {
    const dupYear = mapSchoolYearError({
      code: '23505',
      message: 'duplicate key value violates unique constraint "school_years_school_year_unique"'
    });
    assert.equal(dupYear.message, 'Já existe um ano letivo cadastrado com este ano.');

    const dupActive = mapSchoolYearError({
      code: '23505',
      message: 'duplicate key value violates unique constraint "school_years_one_active_per_school"'
    });
    assert.equal(dupActive.message, 'Já existe um ano letivo ativo para esta escola.');

    const dateRange = mapSchoolYearError({
      code: '23514',
      message: 'new row for relation "school_years" violates check constraint "school_years_year_range_check"'
    });
    assert.equal(dateRange.message, 'A data de início deve ser anterior ou igual à data de término.');
  });
});

describe('operational filters with active school year', { concurrency: 1 }, () => {
  it('filters students by the active school year instead of civil year', async () => {
    const restoreYear = stub(schoolYearService, {
      getActiveYear: async () => ({
        data: { id: 'year-2027', school_id: SCHOOL_ID, year: 2027, is_active: true },
        error: null
      })
    });

    const restoreStudents = stub(studentRepository, {
      listBySchool: async () => ({
        data: [
          { id: 's-1', school_id: SCHOOL_ID, full_name: 'Aluno Ano Ativo', student_identifier: '001', status: 'active' },
          { id: 's-2', school_id: SCHOOL_ID, full_name: 'Aluno Ano Passado', student_identifier: '002', status: 'active' }
        ],
        error: null
      })
    });

    const restoreEnrollments = stub(studentEnrollmentRepository, {
      listByStudentIds: async () => ({
        data: [
          { id: 'e-1', student_id: 's-1', school_year_id: 'year-2027', academic_year: 2027, status: 'active' },
          { id: 'e-2', student_id: 's-2', school_year_id: 'year-2026', academic_year: 2026, status: 'active' }
        ],
        error: null
      })
    });

    const restoreAssignments = stub(studentGroupAssignmentRepository, {
      listByEnrollmentIds: async () => ({
        data: [{ id: 'a-1', student_enrollment_id: 'e-1', academic_group_id: 'g-1', status: 'active' }],
        error: null
      })
    });

    const restoreGroups = stub(academicGroupRepository, {
      listBySchool: async () => ({
        data: [{ id: 'g-1', name: 'Turma 2027' }],
        error: null
      })
    });

    const result = await studentService.listForSchool(SCHOOL_ID);

    restoreGroups();
    restoreAssignments();
    restoreEnrollments();
    restoreStudents();
    restoreYear();

    assert.equal(result.error, null);
    // Student 1 is in active year 2027
    const s1 = result.data.find((s) => s.id === 's-1');
    const s2 = result.data.find((s) => s.id === 's-2');

    assert.equal(s1.enrollmentId, 'e-1');
    assert.equal(s1.academicYear, 2027);
    assert.equal(s1.schoolYearId, 'year-2027');
    assert.equal(s1.grade, 'Turma 2027');

    // Student 2 is from 2026, so no active enrollment in 2027
    assert.equal(s2.enrollmentId, null);
  });

  it('rejects pickup call when student enrollment belongs to an inactive year', async () => {
    const restoreEnrollment = stub(pickupEventRepository, {
      findEnrollmentForSchool: async () => ({
        data: {
          id: ENROLLMENT_ID,
          student_id: 'student-1',
          school_year_id: 'year-2025',
          academic_year: 2025,
          status: 'active',
          students: { id: 'student-1', school_id: SCHOOL_ID, status: 'active' },
          school_years: { id: 'year-2025', year: 2025, is_active: false }
        },
        error: null
      })
    });

    const result = await pickupService.callStudent({
      schoolId: SCHOOL_ID,
      studentEnrollmentId: ENROLLMENT_ID,
      gateId: GATE_ID
    });

    restoreEnrollment();

    assert.equal(result.data, null);
    assert.equal(result.error.message, 'A matrícula não está ativa para chamada.');
  });

  it('allows pickup call when student enrollment belongs to the active year', async () => {
    const restoreEnrollment = stub(pickupEventRepository, {
      findEnrollmentForSchool: async () => ({
        data: {
          id: ENROLLMENT_ID,
          student_id: 'student-1',
          school_year_id: 'year-2026',
          academic_year: 2026,
          status: 'active',
          students: { id: 'student-1', school_id: SCHOOL_ID, status: 'active' },
          school_years: { id: 'year-2026', year: 2026, is_active: true }
        },
        error: null
      }),
      findGateForSchool: async () => ({
        data: { id: GATE_ID, school_id: SCHOOL_ID, name: 'Portão 1', status: 'active' },
        error: null
      }),
      findActiveByEnrollment: async () => ({ data: null, error: null }),
      create: async (row) => ({
        data: {
          id: 'pickup-1',
          status: 'called',
          called_at: '2026-10-03T20:00:00.000Z',
          ...row
        },
        error: null
      })
    });

    const result = await pickupService.callStudent({
      schoolId: SCHOOL_ID,
      studentEnrollmentId: ENROLLMENT_ID,
      gateId: GATE_ID
    });

    restoreEnrollment();

    assert.equal(result.error, null);
    assert.equal(result.data.status, 'called');
  });
});
