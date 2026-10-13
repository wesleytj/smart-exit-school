import assert from 'node:assert/strict';
import { describe, it, after } from 'node:test';
import crypto from 'node:crypto';
import {
  getAlphaClient,
  TENANT_A_SCHOOL_ID,
  TENANT_A_SCHOOL_YEAR_ID,
  TENANT_A_ACADEMIC_GROUP_ID
} from './setup.mjs';

describe('E2E-02 — Ciclo de Vida do Aluno (Cadastro, Matrícula e Turma)', () => {
  const clientA = getAlphaClient();

  const studentId = crypto.randomUUID();
  const enrollmentId = crypto.randomUUID();
  const assignmentId = crypto.randomUUID();
  const studentIdentifier = `E2E-ALU-${Date.now().toString().slice(-4)}`;

  after(async () => {
    // Cleanup idempotente
    try {
      await clientA.from('student_group_assignments').delete().eq('id', assignmentId);
      await clientA.from('student_enrollments').delete().eq('id', enrollmentId);
      await clientA.from('students').delete().eq('id', studentId);
    } catch {
      // ignore
    }
  });

  it('1. Operador da escola cadastra novo estudante em public.students', async () => {
    const { error: studentErr } = await clientA
      .from('students')
      .insert({
        id: studentId,
        school_id: TENANT_A_SCHOOL_ID,
        student_identifier: studentIdentifier,
        full_name: 'Estudante E2E Teste',
        birth_date: '2016-04-20',
        status: 'active'
      });

    assert.equal(studentErr, null, `Erro ao cadastrar aluno: ${studentErr?.message}`);

    const { data: student, error: qErr } = await clientA
      .from('students')
      .select('id, school_id, student_identifier, full_name')
      .eq('id', studentId)
      .single();

    assert.equal(qErr, null);
    assert.equal(student.id, studentId);
    assert.equal(student.school_id, TENANT_A_SCHOOL_ID);
    assert.equal(student.student_identifier, studentIdentifier);
  });

  it('2. Provisiona matrícula do estudante no ano letivo ativo (2026)', async () => {
    const { error: enrollErr } = await clientA
      .from('student_enrollments')
      .insert({
        id: enrollmentId,
        student_id: studentId,
        school_year_id: TENANT_A_SCHOOL_YEAR_ID,
        academic_year: 2026,
        status: 'active'
      });

    assert.equal(enrollErr, null, `Erro ao matricular aluno: ${enrollErr?.message}`);

    const { data: enrollment, error: qErr } = await clientA
      .from('student_enrollments')
      .select('id, student_id, school_year_id, status')
      .eq('id', enrollmentId)
      .single();

    assert.equal(qErr, null);
    assert.equal(enrollment.id, enrollmentId);
    assert.equal(enrollment.student_id, studentId);
    assert.equal(enrollment.school_year_id, TENANT_A_SCHOOL_YEAR_ID);
    assert.equal(enrollment.status, 'active');
  });

  it('3. Vincula a matrícula à turma acadêmica em student_group_assignments', async () => {
    const { error: assignErr } = await clientA
      .from('student_group_assignments')
      .insert({
        id: assignmentId,
        student_enrollment_id: enrollmentId,
        academic_group_id: TENANT_A_ACADEMIC_GROUP_ID,
        status: 'active'
      });

    assert.equal(assignErr, null, `Erro ao vincular à turma: ${assignErr?.message}`);

    const { data: assignment, error: qErr } = await clientA
      .from('student_group_assignments')
      .select('id, student_enrollment_id, academic_group_id, status')
      .eq('id', assignmentId)
      .single();

    assert.equal(qErr, null);
    assert.equal(assignment.id, assignmentId);
    assert.equal(assignment.student_enrollment_id, enrollmentId);
    assert.equal(assignment.academic_group_id, TENANT_A_ACADEMIC_GROUP_ID);
  });

  it('4. Consulta aluno com resolução completa de turma e matrícula via joins', async () => {
    const { data: result, error: queryErr } = await clientA
      .from('students')
      .select(`
        id,
        full_name,
        student_identifier,
        student_enrollments (
          id,
          academic_year,
          status,
          student_group_assignments (
            id,
            academic_group_id
          )
        )
      `)
      .eq('id', studentId)
      .single();

    assert.equal(queryErr, null, `Erro na consulta com joins: ${queryErr?.message}`);
    assert.equal(result.id, studentId);
    assert.equal(result.student_identifier, studentIdentifier);
    assert.ok(result.student_enrollments.length >= 1, 'Deve possuir matrícula vinculada');
    assert.equal(result.student_enrollments[0].id, enrollmentId);
    assert.equal(
      result.student_enrollments[0].student_group_assignments[0].academic_group_id,
      TENANT_A_ACADEMIC_GROUP_ID
    );
  });

  it('5. Operador atualiza informações cadastrais do aluno com sucesso', async () => {
    const updatedName = 'Estudante E2E Teste Atualizado';

    const { error: updateErr } = await clientA
      .from('students')
      .update({ full_name: updatedName })
      .eq('id', studentId);

    assert.equal(updateErr, null, `Erro ao atualizar aluno: ${updateErr?.message}`);

    const { data: updated, error: qErr } = await clientA
      .from('students')
      .select('full_name')
      .eq('id', studentId)
      .single();

    assert.equal(qErr, null);
    assert.equal(updated.full_name, updatedName);
  });
});
