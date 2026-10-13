import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import crypto from 'node:crypto';
import {
  getAlphaClient,
  TENANT_A_SCHOOL_ID,
  TENANT_A_SCHOOL_YEAR_ID,
  TENANT_A_GATE_ID
} from './setup.mjs';

describe('E2E-03 & E2E-04 — Ciclo Operacional de Chamada de Saída e Cancelamento', () => {
  const clientA = getAlphaClient();

  const studentId = crypto.randomUUID();
  const enrollmentId = crypto.randomUUID();
  let firstCallEventId = crypto.randomUUID();
  let secondCallEventId = crypto.randomUUID();

  before(async () => {
    // 1. Provisiona aluno e matrícula dedicados para os testes de chamada
    await clientA.from('students').insert({
      id: studentId,
      school_id: TENANT_A_SCHOOL_ID,
      student_identifier: `PICKUP-${Date.now().toString().slice(-4)}`,
      full_name: 'Aluno Teste Pickup E2E',
      birth_date: '2016-01-10',
      status: 'active'
    });

    await clientA.from('student_enrollments').insert({
      id: enrollmentId,
      student_id: studentId,
      school_year_id: TENANT_A_SCHOOL_YEAR_ID,
      academic_year: 2026,
      status: 'active'
    });
  });

  after(async () => {
    // Cleanup idempotente
    try {
      await clientA.from('pickup_events').delete().eq('student_enrollment_id', enrollmentId);
      await clientA.from('student_enrollments').delete().eq('id', enrollmentId);
      await clientA.from('students').delete().eq('id', studentId);
    } catch {
      // ignore
    }
  });

  // ============================================================
  // E2E-03: Ciclo Completo de Chamada (called -> TV -> completed)
  // ============================================================
  describe('E2E-03 — Ciclo de Chamada de Retirada (Criação, Telão TV e Conclusão)', () => {
    it('1. Operador cria chamada de saída com status = called e portão selecionado', async () => {
      const { error: callErr } = await clientA
        .from('pickup_events')
        .insert({
          id: firstCallEventId,
          school_id: TENANT_A_SCHOOL_ID,
          student_enrollment_id: enrollmentId,
          gate_id: TENANT_A_GATE_ID,
          status: 'called',
          called_at: new Date().toISOString()
        });

      assert.equal(callErr, null, `Erro ao criar chamada: ${callErr?.message}`);

      const { data: event, error: qErr } = await clientA
        .from('pickup_events')
        .select('id, school_id, student_enrollment_id, gate_id, status, called_at, completed_at, cancelled_at')
        .eq('id', firstCallEventId)
        .single();

      assert.equal(qErr, null);
      assert.equal(event.status, 'called');
      assert.ok(event.called_at, 'called_at deve estar preenchido');
      assert.equal(event.completed_at, null);
      assert.equal(event.cancelled_at, null);
    });

    it('2. Consulta operacional simulando Telão TV (/tv) exibe a chamada na fila ativa', async () => {
      const { data: activeCalls, error: tvErr } = await clientA
        .from('pickup_events')
        .select(`
          id,
          called_at,
          gate_id,
          student_enrollments (
            id,
            students (
              id,
              full_name
            )
          )
        `)
        .eq('school_id', TENANT_A_SCHOOL_ID)
        .eq('status', 'called')
        .order('called_at', { ascending: false });

      assert.equal(tvErr, null, `Erro na consulta da TV: ${tvErr?.message}`);
      assert.ok(Array.isArray(activeCalls), 'TV recebe lista de chamadas ativas');
      const found = activeCalls.find((c) => c.id === firstCallEventId);
      assert.ok(found, 'Chamada deve estar presente na fila da TV');
      assert.equal(found.student_enrollments.students.full_name, 'Aluno Teste Pickup E2E');
    });

    it('3. Operador confirma saída e evento transiciona para completed com completed_at preenchido', async () => {
      const now = new Date().toISOString();

      const { error: completeErr } = await clientA
        .from('pickup_events')
        .update({
          status: 'completed',
          completed_at: now
        })
        .eq('id', firstCallEventId);

      assert.equal(completeErr, null, `Erro ao concluir saída: ${completeErr?.message}`);

      const { data: updatedEvent, error: qErr } = await clientA
        .from('pickup_events')
        .select('id, status, completed_at')
        .eq('id', firstCallEventId)
        .single();

      assert.equal(qErr, null);
      assert.equal(updatedEvent.status, 'completed');
      assert.ok(updatedEvent.completed_at, 'completed_at deve estar gravado');

      // Verifica que a chamada saiu da fila ativa da TV
      const { data: tvAfter } = await clientA
        .from('pickup_events')
        .select('id')
        .eq('school_id', TENANT_A_SCHOOL_ID)
        .eq('status', 'called')
        .eq('id', firstCallEventId);

      assert.equal(tvAfter.length, 0, 'Chamada concluída não deve mais aparecer na TV');
    });
  });

  // ============================================================
  // E2E-04: Cancelamento de Chamada (called -> cancelled)
  // ============================================================
  describe('E2E-04 — Cancelamento Operacional de Chamada', () => {
    it('1. Operador cria nova chamada ativa para o mesmo aluno após conclusão anterior', async () => {
      const { error: callErr } = await clientA
        .from('pickup_events')
        .insert({
          id: secondCallEventId,
          school_id: TENANT_A_SCHOOL_ID,
          student_enrollment_id: enrollmentId,
          gate_id: TENANT_A_GATE_ID,
          status: 'called',
          called_at: new Date().toISOString()
        });

      assert.equal(callErr, null, `Erro ao criar segunda chamada: ${callErr?.message}`);
    });

    it('2. Operador cancela a chamada ativa; status vira cancelled e cancelled_at é registrado', async () => {
      const now = new Date().toISOString();

      const { error: cancelErr } = await clientA
        .from('pickup_events')
        .update({
          status: 'cancelled',
          cancelled_at: now
        })
        .eq('id', secondCallEventId);

      assert.equal(cancelErr, null, `Erro ao cancelar chamada: ${cancelErr?.message}`);

      const { data: cancelledEvent, error: qErr } = await clientA
        .from('pickup_events')
        .select('id, status, cancelled_at, completed_at')
        .eq('id', secondCallEventId)
        .single();

      assert.equal(qErr, null);
      assert.equal(cancelledEvent.status, 'cancelled');
      assert.ok(cancelledEvent.cancelled_at, 'cancelled_at deve estar preenchido');
      assert.equal(cancelledEvent.completed_at, null, 'completed_at deve permanecer nulo no cancelamento');
    });

    it('3. Aluno é liberado na fila após cancelamento (sem conflito no índice único)', async () => {
      // Cria uma terceira chamada para provar que a matrícula foi destravada
      const thirdCallId = crypto.randomUUID();

      const { error: thirdErr } = await clientA
        .from('pickup_events')
        .insert({
          id: thirdCallId,
          school_id: TENANT_A_SCHOOL_ID,
          student_enrollment_id: enrollmentId,
          gate_id: TENANT_A_GATE_ID,
          status: 'called',
          called_at: new Date().toISOString()
        });

      assert.equal(thirdErr, null, `Aluno deveria ser elegível para nova chamada: ${thirdErr?.message}`);

      // Cleanup da terceira chamada
      await clientA.from('pickup_events').delete().eq('id', thirdCallId);
    });
  });
});
