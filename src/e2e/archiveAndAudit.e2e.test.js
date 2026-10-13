import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import crypto from 'node:crypto';
import {
  getAlphaClient,
  getBetaClient,
  getPlatformAdminClient,
  getServiceRoleClient,
  createAccessToken,
  createAuthedClient,
  TENANT_A_SCHOOL_ID,
  TENANT_A_SCHOOL_YEAR_ID,
  TENANT_A_GATE_ID,
  USER_A_ID,
  PLATFORM_ADMIN_ID
} from './setup.mjs';

describe('E2E-07 & E2E-08 — Arquivamento Histórico e Auditoria de Plataforma', () => {
  const clientA = getAlphaClient();
  const clientB = getBetaClient();
  const adminClient = getPlatformAdminClient();
  const serviceClient = getServiceRoleClient();

  const studentAId = crypto.randomUUID();
  const enrollmentAId = crypto.randomUUID();
  const studentBId = crypto.randomUUID();
  const enrollmentBId = crypto.randomUUID();

  const oldCompletedEventId = crypto.randomUUID();
  const oldActiveEventId = crypto.randomUUID();
  const auditLogId = crypto.randomUUID();

  before(async () => {
    // 1. Provisiona dois alunos/matrículas para permitir chamadas concorrentes sem violar índice único
    const { error: sAErr } = await clientA.from('students').insert({
      id: studentAId,
      school_id: TENANT_A_SCHOOL_ID,
      student_identifier: `ARCH-A-${Date.now().toString().slice(-4)}`,
      full_name: 'Aluno Arquivo Concluído',
      birth_date: '2015-08-20',
      status: 'active'
    });
    assert.equal(sAErr, null, `Erro ao criar student A: ${sAErr?.message}`);

    const { error: eAErr } = await clientA.from('student_enrollments').insert({
      id: enrollmentAId,
      student_id: studentAId,
      school_year_id: TENANT_A_SCHOOL_YEAR_ID,
      academic_year: 2026,
      status: 'active'
    });
    assert.equal(eAErr, null, `Erro ao criar enrollment A: ${eAErr?.message}`);

    const { error: sBErr } = await clientA.from('students').insert({
      id: studentBId,
      school_id: TENANT_A_SCHOOL_ID,
      student_identifier: `ARCH-B-${Date.now().toString().slice(-4)}`,
      full_name: 'Aluno Chamada Ativa Antiga',
      birth_date: '2015-08-20',
      status: 'active'
    });
    assert.equal(sBErr, null, `Erro ao criar student B: ${sBErr?.message}`);

    const { error: eBErr } = await clientA.from('student_enrollments').insert({
      id: enrollmentBId,
      student_id: studentBId,
      school_year_id: TENANT_A_SCHOOL_YEAR_ID,
      academic_year: 2026,
      status: 'active'
    });
    assert.equal(eBErr, null, `Erro ao criar enrollment B: ${eBErr?.message}`);

    // 2. Insere eventos operacionais respeitando a regra de coerência (nascem com status called)
    // Evento A: Criado como called e transicionado para completed (trigger grava completed_at = now())
    const { error: insAErr } = await clientA.from('pickup_events').insert({
      id: oldCompletedEventId,
      school_id: TENANT_A_SCHOOL_ID,
      student_enrollment_id: enrollmentAId,
      gate_id: TENANT_A_GATE_ID,
      status: 'called',
      called_at: new Date(Date.now() - 5000).toISOString()
    });
    assert.equal(insAErr, null, `Erro ao criar chamada A: ${insAErr?.message}`);

    // Aguarda 100ms para garantir diferença temporal antes da conclusão
    await new Promise((r) => setTimeout(r, 100));

    const { error: updAErr } = await clientA.from('pickup_events').update({
      status: 'completed'
    }).eq('id', oldCompletedEventId);
    assert.equal(updAErr, null, `Erro ao concluir chamada A: ${updAErr?.message}`);

    // Evento B: Em andamento ativo (status called NÃO deve ser arquivado)
    const { error: insBErr } = await clientA.from('pickup_events').insert({
      id: oldActiveEventId,
      school_id: TENANT_A_SCHOOL_ID,
      student_enrollment_id: enrollmentBId,
      gate_id: TENANT_A_GATE_ID,
      status: 'called',
      called_at: new Date(Date.now() - 5000).toISOString()
    });
    assert.equal(insBErr, null, `Erro ao criar chamada B: ${insBErr?.message}`);

    // Aguarda 1 segundo para garantir que completed_at < now() - interval '500 milliseconds'
    await new Promise((r) => setTimeout(r, 1000));
  });

  after(async () => {
    // Cleanup idempotente
    try {
      await serviceClient.from('pickup_events_archive').delete().eq('id', oldCompletedEventId);
      await clientA.from('pickup_events').delete().eq('id', oldActiveEventId);
      await clientA.from('pickup_events').delete().eq('id', oldCompletedEventId);
      await clientA.from('student_enrollments').delete().eq('id', enrollmentAId);
      await clientA.from('student_enrollments').delete().eq('id', enrollmentBId);
      await clientA.from('students').delete().eq('id', studentAId);
      await clientA.from('students').delete().eq('id', studentBId);
      await serviceClient.from('impersonation_audit_logs').delete().eq('id', auditLogId).catch(() => {});
    } catch {
      // ignore
    }
  });

  // ============================================================
  // E2E-07: Arquivamento de Chamadas Históricas
  // ============================================================
  describe('E2E-07 — Arquivamento Histórico de Chamadas Antigas (Migration 0025)', () => {
    it('1. Usuário comum é rejeitado ao tentar invocar RPC restrita archive_old_pickup_events', async () => {
      const { data, error } = await clientA.rpc('archive_old_pickup_events', {
        p_older_than: '30 days',
        p_batch_limit: 500,
        p_school_id: TENANT_A_SCHOOL_ID
      });

      assert.notEqual(error, null, 'RPC restrita a service_role deve falhar para usuário autenticado comum');
      assert.ok(
        error.code === '42501' || error.message.includes('permission denied'),
        `Esperado erro de permissão 42501, recebido: ${error.message}`
      );
      assert.equal(data, null);
    });

    it('2. Service Role invoca archive_old_pickup_events e transfere chamadas concluídas para o arquivo', async () => {
      // Executa arquivamento com janela delimitada de retenção
      const { data: archiveResult, error: rpcErr } = await serviceClient.rpc('archive_old_pickup_events', {
        p_older_than: '500 milliseconds',
        p_batch_limit: 1000,
        p_school_id: TENANT_A_SCHOOL_ID
      });

      assert.equal(rpcErr, null, `Erro ao invocar archive_old_pickup_events: ${rpcErr?.message}`);
      assert.ok(Array.isArray(archiveResult), 'Retorno deve ser array com linhas afetadas');
      assert.ok(archiveResult.length > 0 && archiveResult[0].archived_count >= 1, 'Deve arquivar pelo menos 1 registro');

      // Verifica que o evento antigo concluído saiu da tabela quente pickup_events
      const { data: hotEvent, error: hotErr } = await clientA
        .from('pickup_events')
        .select('id')
        .eq('id', oldCompletedEventId);

      assert.equal(hotErr, null);
      assert.equal(hotEvent.length, 0, 'Evento arquivado não deve mais existir em pickup_events');

      // Verifica que o evento em andamento (status = called) NÃO FOI ARQUIVADO
      const { data: activeEvent, error: actErr } = await clientA
        .from('pickup_events')
        .select('id, status')
        .eq('id', oldActiveEventId)
        .single();

      assert.equal(actErr, null);
      assert.equal(activeEvent.status, 'called', 'Chamada em andamento jamais deve ser arquivada');
    });

    it('3. Usuário da escola consulta evento arquivado em pickup_events_archive via RLS', async () => {
      const { data: archivedRows, error: archErr } = await clientA
        .from('pickup_events_archive')
        .select('id, school_id, status, called_at, completed_at, archived_at')
        .eq('id', oldCompletedEventId);

      assert.equal(archErr, null, `Erro ao consultar arquivo: ${archErr?.message}`);
      assert.equal(archivedRows.length, 1);
      assert.equal(archivedRows[0].id, oldCompletedEventId);
      assert.equal(archivedRows[0].status, 'completed');
      assert.ok(archivedRows[0].archived_at, 'archived_at deve estar preenchido');
    });

    it('4. Usuário do Tenant Beta não consegue consultar eventos arquivados do Tenant Alpha', async () => {
      const { data: betaRows, error: betaErr } = await clientB
        .from('pickup_events_archive')
        .select('id')
        .eq('id', oldCompletedEventId);

      assert.equal(betaErr, null);
      assert.equal(betaRows.length, 0, 'RLS deve impedir que Beta veja arquivo histórico de Alpha');
    });
  });

  // ============================================================
  // E2E-08: Impersonation de Plataforma e Auditoria Imutável
  // ============================================================
  describe('E2E-08 — Auditoria e Impersonation de Plataforma (Migration 0022 & ADR-029)', () => {
    it('1. Platform Admin consulta catálogo global de usuários via list_platform_users', async () => {
      const { data: users, error: listErr } = await adminClient.rpc('list_platform_users', {
        p_search: null,
        p_school_id: null,
        p_limit: 10,
        p_offset: 0
      });

      assert.equal(listErr, null, `Erro ao listar usuários da plataforma: ${listErr?.message}`);
      assert.ok(Array.isArray(users), 'Deve retornar listagem de usuários');
      assert.ok(users.length >= 2, 'Deve encontrar usuários pré-existentes dos tenants');
      assert.ok(users.some((u) => u.user_id === USER_A_ID), 'Deve listar usuário do Tenant Alpha');
    });

    it('2. Registra início de sessão de impersonation em impersonation_audit_logs', async () => {
      const now = new Date().toISOString();

      const { data: log, error: logErr } = await serviceClient
        .from('impersonation_audit_logs')
        .insert({
          id: auditLogId,
          super_admin_id: PLATFORM_ADMIN_ID,
          target_user_id: USER_A_ID,
          target_user_email: `${USER_A_ID}@smart-exit.local`,
          target_user_name: 'Operador Tenant Alpha',
          target_school_id: TENANT_A_SCHOOL_ID,
          reason: 'Atendimento e validação de suporte técnico E2E',
          started_at: now
        })
        .select()
        .single();

      assert.equal(logErr, null, `Erro ao gravar log de impersonation: ${logErr?.message}`);
      assert.equal(log.id, auditLogId);
      assert.equal(log.super_admin_id, PLATFORM_ADMIN_ID);
      assert.equal(log.target_user_id, USER_A_ID);
    });

    it('3. Usuário comum é impedido de ler ou alterar a trilha de auditoria de impersonation', async () => {
      // Leitura é bloqueada (retorna 0 linhas para não-admin)
      const { data: rows, error: sErr } = await clientA
        .from('impersonation_audit_logs')
        .select('id')
        .eq('id', auditLogId);

      assert.equal(sErr, null);
      assert.equal(rows.length, 0, 'Usuário comum não pode ler logs de impersonation');

      // Escrita direta por authenticated é bloqueada
      const { error: insErr } = await clientA
        .from('impersonation_audit_logs')
        .insert({
          super_admin_id: PLATFORM_ADMIN_ID,
          target_user_id: USER_A_ID,
          target_user_email: 'fake@smart-exit.local',
          reason: 'Tentativa Invasão Auditoria',
          started_at: new Date().toISOString()
        });

      assert.notEqual(insErr, null, 'Inserção direta em auditoria deve ser bloqueada para authenticated');
    });

    it('4. Token impersonado opera com isolamento de tenant e não escala privilégio de Super Admin', async () => {
      // Simula token emitido pela Edge Function (claims do target_user + impersonated: true)
      const impersonatedToken = createAccessToken(USER_A_ID, 'authenticated', {
        impersonated: true,
        impersonated_by: PLATFORM_ADMIN_ID,
        impersonation_log_id: auditLogId
      });
      const impersonatedClient = createAuthedClient(impersonatedToken);

      // 1. is_platform_admin() retorna falso
      const { data: isAdmin, error: adminErr } = await impersonatedClient.rpc('is_platform_admin');
      assert.equal(adminErr, null);
      assert.equal(isAdmin, false, 'Usuário impersonado não deve ser reconhecido como Platform Admin');

      // 2. list_platform_users é negada com erro 42501
      const { data: hData, error: hErr } = await impersonatedClient.rpc('list_platform_users', {
        p_search: null,
        p_school_id: null,
        p_limit: 5,
        p_offset: 0
      });
      assert.notEqual(hErr, null);
      assert.equal(hData, null);

      // 3. Mas consegue operar normalmente os dados do próprio tenant suportado (Tenant Alpha)
      const { data: schoolData, error: schoolErr } = await impersonatedClient
        .from('schools')
        .select('id, name')
        .eq('id', TENANT_A_SCHOOL_ID)
        .single();

      assert.equal(schoolErr, null);
      assert.equal(schoolData.id, TENANT_A_SCHOOL_ID);
    });

    it('5. Encerramento de impersonation registra ended_at válido e preserva integridade', async () => {
      const endedAt = new Date().toISOString();

      const { data: updatedLog, error: endErr } = await serviceClient
        .from('impersonation_audit_logs')
        .update({ ended_at: endedAt })
        .eq('id', auditLogId)
        .select()
        .single();

      assert.equal(endErr, null);
      assert.ok(updatedLog.ended_at, 'ended_at deve ser gravado');
      assert.ok(new Date(updatedLog.ended_at) >= new Date(updatedLog.started_at), 'ended_at >= started_at');
    });
  });
});
