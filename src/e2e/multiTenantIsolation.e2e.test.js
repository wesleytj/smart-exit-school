import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import crypto from 'node:crypto';
import {
  getAlphaClient,
  getBetaClient,
  TENANT_A_SCHOOL_ID,
  TENANT_B_SCHOOL_ID,
  TENANT_A_STUDENT_ID,
  TENANT_B_STUDENT_ID,
  TENANT_B_GATE_ID,
  TENANT_B_ENROLLMENT_ID
} from './setup.mjs';

describe('E2E-06 — Isolamento Multi-Tenant em Runtime (Prevenção de Cross-Tenant Leak)', () => {
  const clientA = getAlphaClient();
  const clientB = getBetaClient();

  describe('1. Prevenção de Leitura Cruzada (Cross-Tenant Read Leak)', () => {
    it('Usuário Alpha não consegue ler a escola do Tenant Beta via RLS', async () => {
      const { data, error } = await clientA
        .from('schools')
        .select('id, name')
        .eq('id', TENANT_B_SCHOOL_ID);

      assert.equal(error, null);
      assert.equal(data.length, 0, 'RLS deve retornar 0 linhas ao consultar escola alheia');
    });

    it('Usuário Alpha não consegue ler alunos do Tenant Beta', async () => {
      const { data, error } = await clientA
        .from('students')
        .select('id, full_name, student_identifier')
        .eq('school_id', TENANT_B_SCHOOL_ID);

      assert.equal(error, null);
      assert.equal(data.length, 0, 'RLS deve ocultar 100% dos alunos do Tenant Beta');
    });

    it('Usuário Alpha não consegue ler portões do Tenant Beta', async () => {
      const { data, error } = await clientA
        .from('gates')
        .select('id, name')
        .eq('school_id', TENANT_B_SCHOOL_ID);

      assert.equal(error, null);
      assert.equal(data.length, 0, 'RLS deve ocultar os portões do Tenant Beta');
    });

    it('Usuário Alpha não consegue ler turmas acadêmicas do Tenant Beta', async () => {
      const { data, error } = await clientA
        .from('academic_groups')
        .select('id, name')
        .eq('school_id', TENANT_B_SCHOOL_ID);

      assert.equal(error, null);
      assert.equal(data.length, 0, 'RLS deve ocultar as turmas do Tenant Beta');
    });

    it('Usuário Alpha não consegue ler chamadas operacionais de saída do Tenant Beta', async () => {
      const { data, error } = await clientA
        .from('pickup_events')
        .select('id, status')
        .eq('school_id', TENANT_B_SCHOOL_ID);

      assert.equal(error, null);
      assert.equal(data.length, 0, 'RLS deve ocultar as chamadas do Tenant Beta');
    });

    it('Usuário Beta não consegue ler alunos do Tenant Alpha', async () => {
      const { data, error } = await clientB
        .from('students')
        .select('id, full_name')
        .eq('school_id', TENANT_A_SCHOOL_ID);

      assert.equal(error, null);
      assert.equal(data.length, 0, 'RLS de Beta deve ocultar dados de Alpha');
    });
  });

  describe('2. Prevenção de Injeção Cruzada de Dados (Cross-Tenant Write Injection)', () => {
    it('Usuário Alpha é bloqueado pelo RLS ao tentar inserir aluno no Tenant Beta', async () => {
      const fakeStudentId = crypto.randomUUID();

      const { data, error } = await clientA
        .from('students')
        .insert({
          id: fakeStudentId,
          school_id: TENANT_B_SCHOOL_ID,
          student_identifier: `HACK-${Date.now().toString().slice(-4)}`,
          full_name: 'Tentativa Invasão Aluno',
          birth_date: '2016-01-01',
          status: 'active'
        })
        .select();

      assert.notEqual(error, null, 'Inserção cruzada deve falhar');
      assert.ok(
        error.code === '42501' || error.message.includes('row-level security'),
        `Esperado erro RLS 42501, recebido: ${error.message}`
      );
      assert.equal(data, null);
    });

    it('Usuário Alpha é bloqueado ao tentar inserir portão no Tenant Beta', async () => {
      const fakeGateId = crypto.randomUUID();

      const { data, error } = await clientA
        .from('gates')
        .insert({
          id: fakeGateId,
          school_id: TENANT_B_SCHOOL_ID,
          name: 'Portão Hack',
          display_order: 99,
          status: 'active'
        })
        .select();

      assert.notEqual(error, null);
      assert.ok(error.code === '42501' || error.message.includes('row-level security'));
      assert.equal(data, null);
    });

    it('Usuário Alpha é bloqueado ao tentar inserir chamada operacional no Tenant Beta', async () => {
      const fakeCallId = crypto.randomUUID();

      const { data, error } = await clientA
        .from('pickup_events')
        .insert({
          id: fakeCallId,
          school_id: TENANT_B_SCHOOL_ID,
          student_enrollment_id: TENANT_B_ENROLLMENT_ID,
          gate_id: TENANT_B_GATE_ID,
          status: 'called',
          called_at: new Date().toISOString()
        })
        .select();

      assert.notEqual(error, null);
      assert.ok(
        error.code === '42501' || error.message.includes('row-level security'),
        `Esperado erro 42501, recebido: ${error.message}`
      );
      assert.equal(data, null);
    });
  });

  describe('3. Prevenção de Mutação ou Deleção Cruzada (Cross-Tenant Mutation)', () => {
    it('Usuário Alpha não afeta nenhuma linha ao tentar atualizar aluno do Tenant Beta', async () => {
      const { data, error } = await clientA
        .from('students')
        .update({ full_name: 'Nome Alterado por Alpha' })
        .eq('id', TENANT_B_STUDENT_ID)
        .select();

      assert.equal(error, null);
      assert.equal(data.length, 0, 'Update em registro alheio deve retornar 0 linhas afetadas');
    });

    it('Usuário Alpha não afeta nenhuma linha ao tentar deletar aluno do Tenant Beta', async () => {
      const { data, error } = await clientA
        .from('students')
        .delete()
        .eq('id', TENANT_B_STUDENT_ID)
        .select();

      assert.equal(error, null);
      assert.equal(data.length, 0, 'Delete em registro alheio deve retornar 0 linhas afetadas');
    });

    it('Usuário Beta não afeta nenhuma linha ao tentar atualizar aluno do Tenant Alpha', async () => {
      const { data, error } = await clientB
        .from('students')
        .update({ full_name: 'Nome Alterado por Beta' })
        .eq('id', TENANT_A_STUDENT_ID)
        .select();

      assert.equal(error, null);
      assert.equal(data.length, 0);
    });
  });

  describe('4. Prevenção de Escalonamento de Privilégios de Plataforma', () => {
    it('Usuário Alpha é rejeitado com erro 42501 ao tentar invocar RPC restrita list_platform_users', async () => {
      const { data, error } = await clientA.rpc('list_platform_users', {
        p_search: null,
        p_school_id: null,
        p_limit: 10,
        p_offset: 0
      });

      assert.notEqual(error, null, 'RPC restrita deve ser negada para usuário comum');
      assert.ok(
        error.code === '42501' || error.message.includes('Access denied'),
        `Esperado erro de privilégio 42501, recebido: ${error.message}`
      );
      assert.equal(data, null);
    });
  });
});
