import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
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

describe('Impersonation Service Unit & Flow Tests (Branch 3)', () => {
  // Mock mockStorage
  const mockSessionStorage = new Map();
  const mockLocalStorage = new Map();

  beforeEach(() => {
    mockSessionStorage.clear();
    mockLocalStorage.clear();

    // Injeta mock nos globais do browser caso em ambiente Node
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

  describe('startImpersonation validation', () => {
    it('Rejects missing target_user_id', async () => {
      const result = await impersonationService.startImpersonation({
        target_user_id: '',
        reason: 'Ticket de suporte #123'
      });

      assert.strictEqual(result.data, null);
      assert.ok(result.error);
      assert.match(result.error.message, /ID do usuário alvo é obrigatório/);
    });

    it('Rejects reason with less than 5 characters', async () => {
      const result = await impersonationService.startImpersonation({
        target_user_id: 'uuid-1234',
        reason: 'abc'
      });

      assert.strictEqual(result.data, null);
      assert.ok(result.error);
      assert.match(result.error.message, /mínimo 5 caracteres/);
    });
  });

  describe('endImpersonation validation', () => {
    it('Returns error when impersonation_log_id is not provided and no state exists', async () => {
      const result = await impersonationService.endImpersonation({});
      assert.strictEqual(result.data, null);
      assert.ok(result.error);
      assert.match(result.error.message, /Identificador do log de impersonation não informado/);
    });
  });

  describe('Storage helpers & cache clearing', () => {
    it('clearSchoolLocalCache removes only @SmartExit keys', () => {
      mockLocalStorage.set('@SmartExit:loggedSchool', '{"id":"school-1"}');
      mockLocalStorage.set('@SmartExit:schoolOps:school-1', '{"state":"ok"}');
      mockLocalStorage.set('otherAppKey', 'preserved');

      clearSchoolLocalCache();

      assert.strictEqual(mockLocalStorage.get('@SmartExit:loggedSchool'), undefined);
      assert.strictEqual(mockLocalStorage.get('@SmartExit:schoolOps:school-1'), undefined);
      assert.strictEqual(mockLocalStorage.get('otherAppKey'), 'preserved');
    });

    it('getImpersonationState and isImpersonating reflect sessionStorage state', () => {
      assert.strictEqual(isImpersonating(), false);
      assert.strictEqual(getImpersonationState(), null);

      const sampleState = {
        impersonation_log_id: 'log-1',
        target_user: { id: 'u-1', email: 'test@school.com' },
        expires_at: '2026-10-10T18:00:00Z'
      };
      mockSessionStorage.set(IMPERSONATION_STATE_KEY, JSON.stringify(sampleState));

      assert.strictEqual(isImpersonating(), true);
      const retrieved = getImpersonationState();
      assert.strictEqual(retrieved.impersonation_log_id, 'log-1');
      assert.strictEqual(retrieved.target_user.email, 'test@school.com');
    });

    it('getAdminSessionBackup returns stored backup session', () => {
      assert.strictEqual(getAdminSessionBackup(), null);

      const fakeSession = { access_token: 'admin-jwt', refresh_token: 'admin-refresh' };
      mockSessionStorage.set(SESSION_BACKUP_KEY, JSON.stringify(fakeSession));

      const backup = getAdminSessionBackup();
      assert.strictEqual(backup.access_token, 'admin-jwt');
      assert.strictEqual(backup.refresh_token, 'admin-refresh');
    });
  });

  describe('enterImpersonationSession & exitImpersonationSession lifecycle', () => {
    it('enterImpersonationSession saves admin backup, sets state, stops auto-refresh, and configures sentinel token', async () => {
      // Setup fake initial admin session
      const originalAdminSession = { access_token: 'admin-jwt-token', refresh_token: 'admin-refresh-token' };
      let stopAutoRefreshCalled = false;
      let setSessionPayload = null;

      supabase.auth.getSession = async () => ({
        data: { session: originalAdminSession },
        error: null
      });

      supabase.auth.stopAutoRefresh = () => {
        stopAutoRefreshCalled = true;
      };

      supabase.auth.setSession = async (payload) => {
        setSessionPayload = payload;
        return { data: { session: payload }, error: null };
      };

      const result = await impersonationService.enterImpersonationSession({
        token: 'minted-impersonation-token',
        target_user: { id: 'target-1', email: 'prof@escola.com' },
        impersonation_log_id: 'log-uuid-456'
      });

      assert.strictEqual(stopAutoRefreshCalled, true);
      assert.ok(setSessionPayload);
      assert.strictEqual(setSessionPayload.access_token, 'minted-impersonation-token');
      assert.strictEqual(setSessionPayload.refresh_token, 'impersonation_no_refresh');

      // Verifica backup gravado
      const backup = getAdminSessionBackup();
      assert.strictEqual(backup.access_token, 'admin-jwt-token');

      // Verifica estado gravado
      const state = getImpersonationState();
      assert.strictEqual(state.impersonation_log_id, 'log-uuid-456');
      assert.strictEqual(state.target_user.email, 'prof@escola.com');
      assert.strictEqual(isImpersonating(), true);
    });

    it('exitImpersonationSession restores admin session, restarts auto-refresh and clears support state', async () => {
      // Prepara estado com impersonation ativa e backup de admin
      mockSessionStorage.set(IMPERSONATION_STATE_KEY, JSON.stringify({ impersonation_log_id: 'log-uuid-456' }));
      mockSessionStorage.set(SESSION_BACKUP_KEY, JSON.stringify({
        access_token: 'original-admin-jwt',
        refresh_token: 'original-admin-refresh'
      }));

      let startAutoRefreshCalled = false;
      let restoredSession = null;

      supabase.auth.startAutoRefresh = () => {
        startAutoRefreshCalled = true;
      };

      supabase.auth.setSession = async (payload) => {
        restoredSession = payload;
        return { data: { session: payload }, error: null };
      };

      // Mock endImpersonation na Edge Function para evitar fetch real no teste unitário
      const origEnd = impersonationService.endImpersonation;
      let endCalledWith = null;
      impersonationService.endImpersonation = async (params) => {
        endCalledWith = params;
        return { data: { success: true }, error: null };
      };

      try {
        const { restored } = await impersonationService.exitImpersonationSession();

        assert.strictEqual(restored, true);
        assert.ok(endCalledWith);
        assert.strictEqual(endCalledWith.impersonation_log_id, 'log-uuid-456');
        assert.strictEqual(startAutoRefreshCalled, true);
        assert.strictEqual(restoredSession.access_token, 'original-admin-jwt');
        assert.strictEqual(restoredSession.refresh_token, 'original-admin-refresh');

        // Confirma que os backups foram removidos
        assert.strictEqual(isImpersonating(), false);
        assert.strictEqual(getAdminSessionBackup(), null);
      } finally {
        impersonationService.endImpersonation = origEnd;
      }
    });
  });
});
