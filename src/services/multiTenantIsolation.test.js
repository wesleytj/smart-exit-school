import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { studentRepository } from '../repositories/studentRepository.js';
import { studentEnrollmentRepository } from '../repositories/studentEnrollmentRepository.js';
import { studentGroupAssignmentRepository } from '../repositories/studentGroupAssignmentRepository.js';
import { academicGroupRepository } from '../repositories/academicGroupRepository.js';
import { academicLevelRepository } from '../repositories/academicLevelRepository.js';
import { academicShiftRepository } from '../repositories/academicShiftRepository.js';
import { gateRepository } from '../repositories/gateRepository.js';
import { pickupEventRepository } from '../repositories/pickupEventRepository.js';
import { schoolYearRepository } from '../repositories/schoolYearRepository.js';
import { studentService } from './studentService.js';
import { academicGroupService } from './academicGroupService.js';
import { gateService } from './gateService.js';
import { pickupService } from './pickupService.js';
import { schoolYearService } from './schoolYearService.js';
import { resolveTenantAccess } from './tenantAccess.js';

const TENANT_A_SCHOOL_ID = '11111111-1111-4111-8111-111111111111';
const TENANT_B_SCHOOL_ID = '22222222-2222-4222-8222-222222222222';
const UNAUTHORIZED_TENANT_ID = '99999999-9999-4999-8999-999999999999';

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

describe('Multi-Tenant Isolation End-to-End', { concurrency: 1 }, () => {
  // ------------------------------------------------------------
  // Scenario 1: Tenant A cria student -> Tenant B não consegue ler/modificar
  // ------------------------------------------------------------
  describe('Student Isolation', () => {
    it('Tenant B cannot see students belonging to Tenant A', async () => {
      const studentDatabase = [
        { id: 'stu-a-1', school_id: TENANT_A_SCHOOL_ID, full_name: 'Alice Tenant A', status: 'active' },
        { id: 'stu-b-1', school_id: TENANT_B_SCHOOL_ID, full_name: 'Bob Tenant B', status: 'active' }
      ];

      const restoreStudent = stub(studentRepository, {
        listBySchool: async (schoolId) => ({
          data: studentDatabase.filter((s) => s.school_id === schoolId),
          error: null
        })
      });

      const restoreEnrollment = stub(studentEnrollmentRepository, {
        listByStudentIds: async (studentIds) => ({
          data: studentIds.map((id) => ({
            id: `enr-${id}`,
            student_id: id,
            academic_year: 2026,
            status: 'active'
          })),
          error: null
        })
      });

      const restoreAssignment = stub(studentGroupAssignmentRepository, {
        listByEnrollmentIds: async () => ({
          data: [],
          error: null
        })
      });

      const restoreGroup = stub(academicGroupRepository, {
        listBySchool: async () => ({ data: [], error: null })
      });

      const restoreYear = stub(schoolYearService, {
        getActiveYear: async (schoolId) => ({
          data: { id: `year-${schoolId}`, year: 2026, is_active: true },
          error: null
        })
      });

      const listA = await studentService.listForSchool(TENANT_A_SCHOOL_ID);
      const listB = await studentService.listForSchool(TENANT_B_SCHOOL_ID);

      restoreYear();
      restoreGroup();
      restoreAssignment();
      restoreEnrollment();
      restoreStudent();

      assert.equal(listA.error, null);
      assert.equal(listA.data.length, 1);
      assert.equal(listA.data[0].fullName, 'Alice Tenant A');

      assert.equal(listB.error, null);
      assert.equal(listB.data.length, 1);
      assert.equal(listB.data[0].fullName, 'Bob Tenant B');
      assert.ok(!listB.data.some((s) => s.id === 'stu-a-1'));
    });

    it('Tenant B cannot update or inactivate a student belonging to Tenant A', async () => {
      const studentDatabase = [
        { id: 'stu-a-1', school_id: TENANT_A_SCHOOL_ID, full_name: 'Alice Tenant A', status: 'active' }
      ];

      const restore = stub(studentRepository, {
        update: async (id, schoolId, changes) => {
          const row = studentDatabase.find((s) => s.id === id && s.school_id === schoolId);
          if (!row) {
            return { data: null, error: { message: 'Row not found or school mismatch' } };
          }
          Object.assign(row, changes);
          return { data: row, error: null };
        }
      });

      const result = await studentService.setStudentStatus(TENANT_B_SCHOOL_ID, 'stu-a-1', 'inactive');
      restore();

      assert.equal(result.data, null);
      assert.ok(result.error);
      assert.equal(studentDatabase[0].status, 'active');
    });
  });

  // ------------------------------------------------------------
  // Scenario 2: Tenant A cria academic_group -> Tenant B não consegue atualizar
  // ------------------------------------------------------------
  describe('Academic Group Isolation', () => {
    it('Tenant B cannot update an academic group belonging to Tenant A', async () => {
      const groups = [
        { id: 'group-a-1', school_id: TENANT_A_SCHOOL_ID, name: 'Turma A1', academic_level_id: 'lvl-a', academic_shift_id: 'shift-1' }
      ];

      const restoreRepo = stub(academicGroupRepository, {
        getByIdForSchool: async (id, schoolId) => ({
          data: groups.find((g) => g.id === id && g.school_id === schoolId) || null,
          error: null
        }),
        update: async (id, schoolId, changes) => {
          const g = groups.find((item) => item.id === id && item.school_id === schoolId);
          if (!g) {
            return { data: null, error: { message: 'Group not found for school' } };
          }
          Object.assign(g, changes);
          return { data: g, error: null };
        }
      });

      const restoreLevel = stub(academicLevelRepository, {
        getByIdForSchool: async (id, schoolId) => ({
          data: schoolId === TENANT_A_SCHOOL_ID ? { id, school_id: TENANT_A_SCHOOL_ID } : null,
          error: null
        })
      });

      const restoreShift = stub(academicShiftRepository, {
        getById: async (id) => ({ data: { id, name: 'morning' }, error: null })
      });

      const updateResult = await academicGroupService.updateGroup(
        TENANT_B_SCHOOL_ID,
        'group-a-1',
        { name: 'Tentativa Invasora', academicLevelId: 'lvl-a', academicShiftId: 'shift-1' }
      );

      restoreRepo();
      restoreLevel();
      restoreShift();

      assert.equal(updateResult.data, null);
      assert.ok(updateResult.error);
      assert.equal(groups[0].name, 'Turma A1');
    });

    it('Tenant B cannot alter group status of Tenant A', async () => {
      const groups = [
        { id: 'group-a-1', school_id: TENANT_A_SCHOOL_ID, name: 'Turma A1', status: 'active' }
      ];

      const restoreRepo = stub(academicGroupRepository, {
        update: async (id, schoolId, changes) => {
          const g = groups.find((item) => item.id === id && item.school_id === schoolId);
          if (!g) {
            return { data: null, error: { message: 'Not found in target school' } };
          }
          Object.assign(g, changes);
          return { data: g, error: null };
        }
      });

      const result = await academicGroupService.setGroupStatus(TENANT_B_SCHOOL_ID, 'group-a-1', 'inactive');
      restoreRepo();

      assert.equal(result.data, null);
      assert.ok(result.error);
      assert.equal(groups[0].status, 'active');
    });
  });

  // ------------------------------------------------------------
  // Scenario 3: Tenant A cria gate -> Tenant B não consegue deletar ou alterar
  // ------------------------------------------------------------
  describe('Gate Isolation', () => {
    it('Tenant B cannot delete a gate belonging to Tenant A', async () => {
      const gates = [
        { id: 'gate-a-1', school_id: TENANT_A_SCHOOL_ID, name: 'Portão Tenant A', display_order: 1 }
      ];

      const restore = stub(gateRepository, {
        remove: async (id, schoolId) => {
          const idx = gates.findIndex((g) => g.id === id && g.school_id === schoolId);
          if (idx === -1) {
            return { error: { message: 'Portão não encontrado para a escola informada.' } };
          }
          gates.splice(idx, 1);
          return { error: null };
        }
      });

      const deleteResult = await gateService.deleteGate(TENANT_B_SCHOOL_ID, 'gate-a-1');
      restore();

      assert.ok(deleteResult.error);
      assert.equal(gates.length, 1);
      assert.equal(gates[0].id, 'gate-a-1');
    });

    it('Tenant B cannot update a gate belonging to Tenant A', async () => {
      const gates = [
        { id: 'gate-a-1', school_id: TENANT_A_SCHOOL_ID, name: 'Portão Original', display_order: 1 }
      ];

      const restore = stub(gateRepository, {
        update: async (id, schoolId, changes) => {
          const gate = gates.find((g) => g.id === id && g.school_id === schoolId);
          if (!gate) {
            return { data: null, error: { message: 'Portão não pertence à escola' } };
          }
          Object.assign(gate, changes);
          return { data: gate, error: null };
        }
      });

      const updateResult = await gateService.updateGate(TENANT_B_SCHOOL_ID, 'gate-a-1', { name: 'Portão Invadido' });
      restore();

      assert.equal(updateResult.data, null);
      assert.ok(updateResult.error);
      assert.equal(gates[0].name, 'Portão Original');
    });
  });

  // ------------------------------------------------------------
  // Scenario 4: Tenant A cria pickup_event -> Tenant B não consegue completar/cancelar
  // ------------------------------------------------------------
  describe('Pickup Event Isolation', () => {
    it('Tenant B cannot view active pickup queue of Tenant A', async () => {
      const events = [
        {
          id: 'event-a-1',
          school_id: TENANT_A_SCHOOL_ID,
          student_enrollment_id: 'enr-a-1',
          gate_id: 'gate-a-1',
          status: 'called',
          called_at: new Date().toISOString(),
          gates: { id: 'gate-a-1', name: 'Portão A' },
          student_enrollments: {
            id: 'enr-a-1',
            student_id: 'stu-a-1',
            students: { id: 'stu-a-1', full_name: 'Aluno A' },
            student_group_assignments: [{ status: 'active', academic_groups: { name: '1A' } }]
          }
        }
      ];

      const restore = stub(pickupEventRepository, {
        listActiveBySchool: async (schoolId) => ({
          data: events.filter((e) => e.school_id === schoolId && e.status === 'called'),
          error: null
        })
      });

      const callsB = await pickupService.getActiveCallsBySchool(TENANT_B_SCHOOL_ID);
      restore();

      assert.equal(callsB.error, null);
      assert.equal(callsB.data.length, 0);
    });

    it('Tenant B cannot complete a pickup call belonging to Tenant A', async () => {
      const events = [
        { id: 'event-a-1', school_id: TENANT_A_SCHOOL_ID, status: 'called' }
      ];

      const restore = stub(pickupEventRepository, {
        complete: async (eventId, schoolId) => {
          const event = events.find((e) => e.id === eventId);
          if (!event) {
            return { data: null, error: new Error('Pickup event not found') };
          }
          if (schoolId && event.school_id !== schoolId) {
            return { data: null, error: new Error('A chamada não pertence a esta escola.') };
          }
          event.status = 'completed';
          event.completed_at = new Date().toISOString();
          return { data: event, error: null };
        }
      });

      const result = await pickupService.completeCall('event-a-1', TENANT_B_SCHOOL_ID);
      restore();

      assert.equal(result.data, null);
      assert.ok(result.error);
      assert.equal(result.error.message, 'A chamada não pertence a esta escola.');
      assert.equal(events[0].status, 'called');
    });

    it('Tenant B cannot cancel a pickup call belonging to Tenant A', async () => {
      const events = [
        { id: 'event-a-1', school_id: TENANT_A_SCHOOL_ID, status: 'called' }
      ];

      const restore = stub(pickupEventRepository, {
        cancel: async (eventId, schoolId) => {
          const event = events.find((e) => e.id === eventId);
          if (!event) {
            return { data: null, error: new Error('Pickup event not found') };
          }
          if (schoolId && event.school_id !== schoolId) {
            return { data: null, error: new Error('A chamada não pertence a esta escola.') };
          }
          event.status = 'cancelled';
          event.cancelled_at = new Date().toISOString();
          return { data: event, error: null };
        }
      });

      const result = await pickupService.cancelCall('event-a-1', TENANT_B_SCHOOL_ID);
      restore();

      assert.equal(result.data, null);
      assert.ok(result.error);
      assert.equal(result.error.message, 'A chamada não pertence a esta escola.');
      assert.equal(events[0].status, 'called');
    });

    it('Tenant B cannot trigger a pickup call crossing enrollment or gate from Tenant A', async () => {
      const restore = stub(pickupEventRepository, {
        findEnrollmentForSchool: async (enrollmentId, schoolId) => {
          if (schoolId !== TENANT_A_SCHOOL_ID) {
            return { data: null, error: null };
          }
          return {
            data: {
              id: enrollmentId,
              status: 'active',
              academic_year: 2026,
              students: { id: 'stu-a-1', school_id: TENANT_A_SCHOOL_ID, status: 'active' }
            },
            error: null
          };
        },
        findGateForSchool: async (gateId, schoolId) => ({
          data: schoolId === TENANT_A_SCHOOL_ID ? { id: gateId, school_id: TENANT_A_SCHOOL_ID, status: 'active' } : null,
          error: null
        })
      });

      const result = await pickupService.callStudent({
        schoolId: TENANT_B_SCHOOL_ID,
        studentEnrollmentId: 'enr-a-1',
        gateId: 'gate-a-1'
      });
      restore();

      assert.equal(result.data, null);
      assert.ok(result.error);
      assert.equal(result.error.message, 'A matrícula não pertence a esta escola.');
    });
  });

  // ------------------------------------------------------------
  // Scenario 5: Tenant A cria school_year -> Tenant B não consegue ativar/desativar
  // ------------------------------------------------------------
  describe('School Year Isolation', () => {
    it('Tenant B cannot see school years of Tenant A', async () => {
      const years = [
        { id: 'sy-a-2026', school_id: TENANT_A_SCHOOL_ID, year: 2026, is_active: true },
        { id: 'sy-b-2026', school_id: TENANT_B_SCHOOL_ID, year: 2026, is_active: true }
      ];

      const restore = stub(schoolYearRepository, {
        listBySchool: async (schoolId) => ({
          data: years.filter((y) => y.school_id === schoolId),
          error: null
        })
      });

      const listB = await schoolYearService.listYears(TENANT_B_SCHOOL_ID);
      restore();

      assert.equal(listB.error, null);
      assert.equal(listB.data.length, 1);
      assert.equal(listB.data[0].id, 'sy-b-2026');
    });

    it('Tenant B cannot activate a school year belonging to Tenant A', async () => {
      const years = [
        { id: 'sy-a-2027', school_id: TENANT_A_SCHOOL_ID, year: 2027, is_active: false }
      ];

      const restore = stub(schoolYearRepository, {
        activate: async (id, schoolId) => {
          const target = years.find((y) => y.id === id && y.school_id === schoolId);
          if (!target) {
            return { data: null, error: { message: 'School year not found for tenant' } };
          }
          target.is_active = true;
          return { data: target, error: null };
        }
      });

      const result = await schoolYearService.activateYear(TENANT_B_SCHOOL_ID, 'sy-a-2027');
      restore();

      assert.equal(result.data, null);
      assert.ok(result.error);
      assert.equal(years[0].is_active, false);
    });
  });

  // ------------------------------------------------------------
  // Scenario 6: Membership & Tenant Access Resolution
  // ------------------------------------------------------------
  describe('Session Context Resolution', () => {
    it('User with membership only in Tenant A never receives access to Tenant B', () => {
      const memberships = [
        { school_id: TENANT_A_SCHOOL_ID, status: 'active' }
      ];
      const schools = [
        { id: TENANT_A_SCHOOL_ID, name: 'Escola A', slug: 'escola-a' },
        { id: TENANT_B_SCHOOL_ID, name: 'Escola B', slug: 'escola-b' }
      ];

      const decision = resolveTenantAccess({
        memberships,
        schools,
        selectedSchoolId: TENANT_B_SCHOOL_ID
      });

      assert.notEqual(decision.school?.id, TENANT_B_SCHOOL_ID);
      assert.equal(decision.school?.id, TENANT_A_SCHOOL_ID);
    });

    it('User with multiple memberships requesting unauthorized tenant is forced to selection and denied access', () => {
      const memberships = [
        { school_id: TENANT_A_SCHOOL_ID, status: 'active' },
        { school_id: TENANT_B_SCHOOL_ID, status: 'active' }
      ];
      const schools = [
        { id: TENANT_A_SCHOOL_ID, name: 'Escola A', slug: 'escola-a' },
        { id: TENANT_B_SCHOOL_ID, name: 'Escola B', slug: 'escola-b' }
      ];

      const decision = resolveTenantAccess({
        memberships,
        schools,
        selectedSchoolId: UNAUTHORIZED_TENANT_ID
      });

      assert.equal(decision.status, 'selection');
      assert.equal(decision.school, null);
      assert.ok(!decision.schools.some((s) => s.id === UNAUTHORIZED_TENANT_ID));
    });

    it('User with no active membership is denied any tenant panel access', () => {
      const memberships = [
        { school_id: TENANT_A_SCHOOL_ID, status: 'inactive' }
      ];
      const schools = [
        { id: TENANT_A_SCHOOL_ID, name: 'Escola A', slug: 'escola-a' }
      ];

      const decision = resolveTenantAccess({
        memberships,
        schools,
        selectedSchoolId: TENANT_A_SCHOOL_ID
      });

      assert.equal(decision.status, 'none');
      assert.equal(decision.school, null);
    });
  });
});
