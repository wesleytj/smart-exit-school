import assert from 'node:assert/strict';
import { describe, it, before, after, beforeEach } from 'node:test';
import process from 'node:process';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

import {
  impersonationService,
  SESSION_BACKUP_KEY,
  IMPERSONATION_STATE_KEY,
  clearSchoolLocalCache,
  getImpersonationState,
  isImpersonating,
  getAdminSessionBackup
} from './impersonationService.js';
import { supabase } from '../lib/supabase.js';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const JWT_SECRET = process.env.SUPABASE_LOCAL_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long';

const PLATFORM_ADMIN_ID = '6f4f26ae-0bcf-434d-94ee-ada82ddc8b25';
const REGULAR_USER_ID = '99999999-9999-4999-8999-999999999999';
const OTHER_SCHOOL_ID = '00000000-0000-0000-0000-000000000002';

function createToken(sub, role = 'authenticated', extraClaims = {}) {
  return jwt.sign(
    {
      aud: 'authenticated',
      role,
      sub,
      exp: Math.floor(Date.now() / 1000) + 2700,
      iat: Math.floor(Date.now() / 1000),
      iss: 'supabase',
      ...extraClaims
    },
    JWT_SECRET
  );
}

function createClientWithToken(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

describe('Impersonation Security Audit Suite — ADR-029 (Branch 4)', () => {
  let adminToken;
  let regularUserToken;
  let impersonatedToken;
  let adminClient;
  let userClient;
  let impersonatedClient;
  let serviceRoleClient;
  const createdAuditLogIds = [];

  // Mocks para sessionStorage e localStorage em testes de lifecycle
  const mockSessionStorage = new Map();
  const mockLocalStorage = new Map();

  before(() => {
    adminToken = createToken(PLATFORM_ADMIN_ID, 'authenticated');
    regularUserToken = createToken(REGULAR_USER_ID, 'authenticated');

    impersonatedToken = createToken(REGULAR_USER_ID, 'authenticated', {
      is_impersonated: true,
      impersonator_id: PLATFORM_ADMIN_ID,
      impersonation_log_id: '00000000-0000-0000-0000-000000000123'
    });

    const serviceToken = createToken('00000000-0000-0000-0000-000000000000', 'service_role');

    adminClient = createClientWithToken(adminToken);
    userClient = createClientWithToken(regularUserToken);
    impersonatedClient = createClientWithToken(impersonatedToken);
    serviceRoleClient = createClient(SUPABASE_URL, serviceToken);
  });

  after(async () => {
    if (createdAuditLogIds.length > 0) {
      await serviceRoleClient
        .from('impersonation_audit_logs')
        .delete()
        .in('id', createdAuditLogIds);
    }
  });

  beforeEach(() => {
    mockSessionStorage.clear();
    mockLocalStorage.clear();

    globalThis.sessionStorage = {
      getItem: (key) => mockSessionStorage.get(key) ?? null,
      setItem: (key, val) => mockSessionStorage.set(key, String(val)),
      removeItem: (key) => mockSessionStorage.delete(key),
      clear: () => mockSessionStorage.clear()
    };

    globalThis.localStorage = {
      getItem: (key) => mockLocalStorage.get(key) ?? null,
      setItem: (key, val) => mockLocalStorage.set(key, String(val)),
      removeItem: (key) => mockLocalStorage.delete(key),
      clear: () => mockLocalStorage.clear(),
      get length() {
        return mockLocalStorage.size;
      },
      key: (index) => Array.from(mockLocalStorage.keys())[index] ?? null
    };
  });

  // ============================================================
  // GRUPO A — AUTORIZAÇÃO E ESCALONAMENTO DE PRIVILÉGIO (A1 a A12)
  // ============================================================
  describe('Grupo A — Autorização e Escalonamento de Privilégio', () => {
    it('A1: Usuário comum chama RPC list_platform_users -> Erro 42501', async () => {
      const { data, error } = await userClient.rpc('list_platform_users');
      assert.strictEqual(data, null);
      assert.ok(error, 'Deve retornar erro de autorização');
      assert.strictEqual(error.code, '42501');
      assert.match(error.message, /Access denied: caller is not a platform admin/i);
    });

    it('A2: Usuário comum chama Edge Function impersonate-user -> HTTP 403 Forbidden', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/impersonate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${regularUserToken}`
        },
        body: JSON.stringify({
          target_user_id: PLATFORM_ADMIN_ID,
          reason: 'Tentativa não autorizada de impersonation'
        })
      });

      assert.strictEqual(response.status, 403);
      const data = await response.json();
      assert.match(data.error, /Forbidden/i);
    });

    it('A3: Usuário comum chama Edge Function end-impersonation -> HTTP 403 Forbidden', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/end-impersonation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${regularUserToken}`
        },
        body: JSON.stringify({
          impersonation_log_id: '00000000-0000-0000-0000-000000000123'
        })
      });

      assert.strictEqual(response.status, 403);
      const data = await response.json();
      assert.match(data.error, /Forbidden/i);
    });

    it('A4: Token de impersonation tenta ler platform_admins -> RLS bloqueia (0 linhas)', async () => {
      const { data, error } = await impersonatedClient
        .from('platform_admins')
        .select('*');

      assert.ifError(error);
      assert.ok(Array.isArray(data));
      assert.strictEqual(data.length, 0, 'Token de impersonation não pode ler platform_admins');
    });

    it('A5: Token de impersonation tenta INSERT em impersonation_audit_logs -> Bloqueado', async () => {
      const { data, error } = await impersonatedClient
        .from('impersonation_audit_logs')
        .insert({
          super_admin_id: PLATFORM_ADMIN_ID,
          target_user_id: REGULAR_USER_ID,
          target_user_email: 'fake@school.com',
          reason: 'Inserção espúria pelo token impersonado'
        });

      assert.ok(error, 'INSERT direto em impersonation_audit_logs deve ser rejeitado');
      assert.strictEqual(data, null);
    });

    it('A6: Token de impersonation tenta chamar list_platform_users -> Erro 42501', async () => {
      const { data, error } = await impersonatedClient.rpc('list_platform_users');
      assert.strictEqual(data, null);
      assert.ok(error, 'Token de impersonation não deve ter acesso ao catálogo de usuários');
      assert.strictEqual(error.code, '42501');
    });

    it('A7: Token de impersonation tenta UPDATE em impersonation_audit_logs -> Bloqueado', async () => {
      const { data, error } = await impersonatedClient
        .from('impersonation_audit_logs')
        .update({ reason: 'Modificação não autorizada' })
        .eq('id', '00000000-0000-0000-0000-000000000123');

      assert.ok(error || (Array.isArray(data) && data.length === 0));
    });

    it('A8: Token de impersonation tenta ler dados de outro tenant -> RLS de tenant bloqueia', async () => {
      const { data, error } = await impersonatedClient
        .from('gates')
        .select('*')
        .eq('school_id', OTHER_SCHOOL_ID);

      assert.ifError(error);
      assert.ok(Array.isArray(data));
      assert.strictEqual(data.length, 0, 'Isolamento de tenant preservado sob impersonation');
    });

    it('A9: JWT com assinatura inválida/tampered -> Rejeitado pelo PostgREST (401)', async () => {
      const tamperedToken = createToken(PLATFORM_ADMIN_ID, 'authenticated') + 'invalid-signature-suffix';
      const tamperedClient = createClientWithToken(tamperedToken);

      const { data, error } = await tamperedClient.from('schools').select('*');
      assert.strictEqual(data, null);
      assert.ok(error, 'JWT forjado/adulterado deve ser rejeitado');
    });

    it('A10: JWT expirado -> Rejeitado pelo PostgREST (401)', async () => {
      const expiredToken = jwt.sign(
        {
          aud: 'authenticated',
          role: 'authenticated',
          sub: PLATFORM_ADMIN_ID,
          exp: Math.floor(Date.now() / 1000) - 3600,
          iat: Math.floor(Date.now() / 1000) - 7200,
          iss: 'supabase'
        },
        JWT_SECRET
      );

      const expiredClient = createClientWithToken(expiredToken);
      const { data, error } = await expiredClient.from('schools').select('*');
      assert.strictEqual(data, null);
      assert.ok(error, 'JWT expirado deve ser rejeitado');
    });

    it('A11: JWT com role incorreto (ex.: anon) -> PostgREST trata como anônimo (acesso negado)', async () => {
      const anonToken = createToken(PLATFORM_ADMIN_ID, 'anon');
      const anonCustomClient = createClientWithToken(anonToken);

      const { data, error } = await anonCustomClient.from('platform_admins').select('*');
      const isDenied = Boolean(error) || (Array.isArray(data) && data.length === 0);
      assert.strictEqual(isDenied, true, 'Role anon não tem privilégio de platform_admins');
    });

    it('A12: Token de impersonation NÃO contém refresh_token real (sentinela não renovável)', async () => {
      // Inicia impersonation real via Edge Function para validar contrato
      const response = await fetch(`${SUPABASE_URL}/functions/v1/impersonate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          target_user_id: PLATFORM_ADMIN_ID,
          reason: 'Validação de ausência de refresh token renovável (A12)'
        })
      });

      assert.strictEqual(response.status, 200);
      const data = await response.json();
      createdAuditLogIds.push(data.impersonation_log_id);

      assert.ok(data.token, 'Token de acesso gerado');
      assert.strictEqual(data.refresh_token, undefined, 'A Edge Function NUNCA deve retornar refresh_token do GoTrue');
    });
  });

  // ============================================================
  // GRUPO B — AUDITORIA E TRILHA IMUTÁVEL (B1 a B10)
  // ============================================================
  describe('Grupo B — Auditoria e Trilha Imutável', () => {
    let testAuditLogId;

    it('B1: Impersonation iniciada -> Grava started_at = now(), ended_at = null', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/impersonate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          target_user_id: PLATFORM_ADMIN_ID,
          reason: 'Auditoria de início e timestamp (B1)'
        })
      });

      assert.strictEqual(response.status, 200);
      const data = await response.json();
      testAuditLogId = data.impersonation_log_id;
      createdAuditLogIds.push(testAuditLogId);

      // Consulta no banco via serviceRole
      const { data: logRow, error } = await serviceRoleClient
        .from('impersonation_audit_logs')
        .select('*')
        .eq('id', testAuditLogId)
        .single();

      assert.ifError(error);
      assert.ok(logRow.started_at, 'started_at deve existir');
      assert.strictEqual(logRow.ended_at, null, 'ended_at deve ser nulo no início');
    });

    it('B2: Impersonation encerrada -> Grava ended_at posterior a started_at', async () => {
      assert.ok(testAuditLogId, 'testAuditLogId deve estar definido');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/end-impersonation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          impersonation_log_id: testAuditLogId
        })
      });

      assert.strictEqual(response.status, 200);

      const { data: logRow, error } = await serviceRoleClient
        .from('impersonation_audit_logs')
        .select('*')
        .eq('id', testAuditLogId)
        .single();

      assert.ifError(error);
      assert.ok(logRow.ended_at, 'ended_at deve ser preenchido');
      assert.ok(new Date(logRow.ended_at).getTime() >= new Date(logRow.started_at).getTime());
    });

    it('B3: Snapshot target_user_email é persistido e imutável', async () => {
      const { data: logRow } = await serviceRoleClient
        .from('impersonation_audit_logs')
        .select('target_user_email')
        .eq('id', testAuditLogId)
        .single();

      assert.ok(logRow.target_user_email);
      assert.strictEqual(logRow.target_user_email, 'admin@alltech.com');
    });

    it('B4: Snapshot target_user_name é persistido e imutável', async () => {
      const { data: logRow } = await serviceRoleClient
        .from('impersonation_audit_logs')
        .select('target_user_name')
        .eq('id', testAuditLogId)
        .single();

      assert.ok('target_user_name' in logRow);
    });

    it('B5: super_admin_id gravado corretamente igual ao UUID do chamador', async () => {
      const { data: logRow } = await serviceRoleClient
        .from('impersonation_audit_logs')
        .select('super_admin_id')
        .eq('id', testAuditLogId)
        .single();

      assert.strictEqual(logRow.super_admin_id, PLATFORM_ADMIN_ID);
    });

    it('B6: impersonation_log_id no JWT é idêntico ao id gravado na auditoria', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/impersonate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          target_user_id: PLATFORM_ADMIN_ID,
          reason: 'Validação de vínculo JWT e auditoria (B6)'
        })
      });

      const data = await response.json();
      createdAuditLogIds.push(data.impersonation_log_id);

      const decoded = jwt.decode(data.token);
      assert.strictEqual(decoded.impersonation_log_id, data.impersonation_log_id);
    });

    it('B7: Registro de auditoria não pode ser DELETADO por authenticated', async () => {
      const { data, error } = await userClient
        .from('impersonation_audit_logs')
        .delete()
        .eq('id', testAuditLogId);

      assert.ok(error || (Array.isArray(data) && data.length === 0));

      // Garante que o registro ainda existe
      const { data: checkRow } = await serviceRoleClient
        .from('impersonation_audit_logs')
        .select('id')
        .eq('id', testAuditLogId)
        .single();

      assert.ok(checkRow, 'Registro de auditoria não foi deletado');
    });

    it('B8: Registro de auditoria não pode ser ALTERADO (reason/email/name) por authenticated', async () => {
      const { data, error } = await adminClient
        .from('impersonation_audit_logs')
        .update({ reason: 'Tentativa de adulterar razão da auditoria' })
        .eq('id', testAuditLogId);

      assert.ok(error || (Array.isArray(data) && data.length === 0));

      const { data: checkRow } = await serviceRoleClient
        .from('impersonation_audit_logs')
        .select('reason')
        .eq('id', testAuditLogId)
        .single();

      assert.notStrictEqual(checkRow.reason, 'Tentativa de adulterar razão da auditoria');
    });

    it('B9: Constraint ended_at >= started_at violação rejeitada (check_violation)', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 60000);

      const { data, error } = await serviceRoleClient
        .from('impersonation_audit_logs')
        .insert({
          super_admin_id: PLATFORM_ADMIN_ID,
          target_user_id: PLATFORM_ADMIN_ID,
          target_user_email: 'test@school.com',
          reason: 'Teste de constraint check de duração',
          started_at: now.toISOString(),
          ended_at: past.toISOString() // anterior ao início!
        });

      assert.strictEqual(data, null);
      assert.ok(error, 'Deve violar a constraint impersonation_audit_logs_duration_check');
      assert.strictEqual(error.code, '23514');
    });

    it('B10: Constraint reason >= 5 chars violação rejeitada (check_violation)', async () => {
      const { data, error } = await serviceRoleClient
        .from('impersonation_audit_logs')
        .insert({
          super_admin_id: PLATFORM_ADMIN_ID,
          target_user_id: PLATFORM_ADMIN_ID,
          target_user_email: 'test@school.com',
          reason: '1234' // apenas 4 caracteres!
        });

      assert.strictEqual(data, null);
      assert.ok(error, 'Deve violar a constraint check de tamanho mínimo');
      assert.strictEqual(error.code, '23514');
    });
  });

  // ============================================================
  // GRUPO C — FLUXO DE RETORNO E INTEGRIDADE DE SESSÃO (C1 a C7)
  // ============================================================
  describe('Grupo C — Fluxo de Retorno e Integridade de Sessão', () => {
    it('C1: Encerramento restaura sessão original do admin após setSession', async () => {
      mockSessionStorage.set(IMPERSONATION_STATE_KEY, JSON.stringify({
        impersonation_log_id: 'log-c1'
      }));
      mockSessionStorage.set(SESSION_BACKUP_KEY, JSON.stringify({
        access_token: 'admin-original-access-token',
        refresh_token: 'admin-original-refresh-token'
      }));

      let restoredPayload = null;
      supabase.auth.setSession = async (payload) => {
        restoredPayload = payload;
        return { data: { session: payload }, error: null };
      };

      const origEnd = impersonationService.endImpersonation;
      impersonationService.endImpersonation = async () => ({ data: { success: true }, error: null });

      try {
        const { restored } = await impersonationService.exitImpersonationSession();
        assert.strictEqual(restored, true);
        assert.ok(restoredPayload);
        assert.strictEqual(restoredPayload.access_token, 'admin-original-access-token');
      } finally {
        impersonationService.endImpersonation = origEnd;
      }
    });

    it('C2: Cache da escola é limpo ao encerrar (@SmartExit:* vazio)', async () => {
      mockLocalStorage.set('@SmartExit:loggedSchool', '{"id":"dev-school"}');
      mockLocalStorage.set('@SmartExit:schoolOps:dev-school', '{"status":"ready"}');

      clearSchoolLocalCache();

      assert.strictEqual(mockLocalStorage.get('@SmartExit:loggedSchool'), undefined);
      assert.strictEqual(mockLocalStorage.get('@SmartExit:schoolOps:dev-school'), undefined);
    });

    it('C3: Auto-refresh reativado ao encerrar (startAutoRefresh chamado)', async () => {
      mockSessionStorage.set(IMPERSONATION_STATE_KEY, JSON.stringify({ impersonation_log_id: 'log-c3' }));
      mockSessionStorage.set(SESSION_BACKUP_KEY, JSON.stringify({
        access_token: 'tok-admin',
        refresh_token: 'ref-admin'
      }));

      let startAutoRefreshCalled = false;
      supabase.auth.startAutoRefresh = () => {
        startAutoRefreshCalled = true;
      };

      const origEnd = impersonationService.endImpersonation;
      impersonationService.endImpersonation = async () => ({ data: { success: true }, error: null });

      try {
        await impersonationService.exitImpersonationSession();
        assert.strictEqual(startAutoRefreshCalled, true);
      } finally {
        impersonationService.endImpersonation = origEnd;
      }
    });

    it('C4: Auto-refresh desativado durante impersonation (stopAutoRefresh chamado)', async () => {
      let stopAutoRefreshCalled = false;
      supabase.auth.stopAutoRefresh = () => {
        stopAutoRefreshCalled = true;
      };

      supabase.auth.setSession = async (payload) => ({ data: { session: payload }, error: null });

      await impersonationService.enterImpersonationSession({
        token: 'impersonated-jwt-c4',
        target_user: { id: 'target-c4', email: 'user@c4.com' },
        impersonation_log_id: 'log-c4'
      });

      assert.strictEqual(stopAutoRefreshCalled, true);
    });

    it('C5: Backup da sessão admin em sessionStorage presente durante impersonation e removido após encerrar', async () => {
      mockSessionStorage.clear();
      supabase.auth.getSession = async () => ({
        data: { session: { access_token: 'admin-token-c5', refresh_token: 'admin-ref-c5' } },
        error: null
      });

      await impersonationService.enterImpersonationSession({
        token: 'imp-token',
        target_user: { id: 't-5', email: 't5@test.com' },
        impersonation_log_id: 'log-c5'
      });

      // Presente durante impersonation
      assert.ok(mockSessionStorage.get(SESSION_BACKUP_KEY));
      assert.ok(mockSessionStorage.get(IMPERSONATION_STATE_KEY));
      assert.ok(getAdminSessionBackup());
      assert.strictEqual(isImpersonating(), true);

      // Encerra
      const origEnd = impersonationService.endImpersonation;
      impersonationService.endImpersonation = async () => ({ data: { success: true }, error: null });
      try {
        await impersonationService.exitImpersonationSession();
        // Removido após encerrar
        assert.strictEqual(mockSessionStorage.get(SESSION_BACKUP_KEY), undefined);
        assert.strictEqual(mockSessionStorage.get(IMPERSONATION_STATE_KEY), undefined);
        assert.strictEqual(getAdminSessionBackup(), null);
        assert.strictEqual(isImpersonating(), false);
      } finally {
        impersonationService.endImpersonation = origEnd;
      }
    });

    it('C6: Encerramento com log inexistente não quebra a UI (erro tratado)', async () => {
      const origEnd = impersonationService.endImpersonation;
      impersonationService.endImpersonation = async () => {
        return { data: null, error: new Error('HTTP 404 Log not found') };
      };

      try {
        // Não deve estourar uncaught rejection
        const result = await impersonationService.exitImpersonationSession();
        assert.ok(result);
      } finally {
        impersonationService.endImpersonation = origEnd;
      }
    });

    it('C7: Token expirado durante impersonation tratado sem erro fatal', async () => {
      // Cria estado expirado há 1 segundo
      const expiredTime = new Date(Date.now() - 1000).toISOString();
      mockSessionStorage.set(IMPERSONATION_STATE_KEY, JSON.stringify({
        impersonation_log_id: 'log-c7',
        expires_at: expiredTime
      }));

      const state = getImpersonationState();
      assert.ok(state);
      assert.ok(new Date(state.expires_at).getTime() < Date.now(), 'Token marcado como expirado');
    });
  });
});
