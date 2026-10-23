import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { impersonationAuditRepository, normalizeDateBoundaries } from '../repositories/impersonationAuditRepository.js';
import {
  impersonationService,
  formatImpersonationDuration,
  classifyImpersonationStatus,
  resolvePeriodDates,
  mapImpersonationAuditLog
} from './impersonationService.js';

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

describe('P2 Impersonation Audit — Pure Functions & Formatting', () => {
  describe('formatImpersonationDuration', () => {
    it('returns null for missing, null, or invalid dates', () => {
      assert.equal(formatImpersonationDuration(null, null), null);
      assert.equal(formatImpersonationDuration('2026-10-22T10:00:00Z', null), null);
      assert.equal(formatImpersonationDuration(null, '2026-10-22T10:00:00Z'), null);
      assert.equal(formatImpersonationDuration('invalid', 'invalid'), null);
      // endedAt earlier than startedAt
      assert.equal(formatImpersonationDuration('2026-10-22T11:00:00Z', '2026-10-22T10:00:00Z'), null);
    });

    it('formats seconds (< 60s)', () => {
      const start = '2026-10-22T10:00:00.000Z';
      const end = '2026-10-22T10:00:45.000Z';
      assert.equal(formatImpersonationDuration(start, end), '45s');
    });

    it('formats minutes and seconds (< 1h)', () => {
      const start = '2026-10-22T10:00:00.000Z';
      const end1 = '2026-10-22T10:12:30.000Z';
      const end2 = '2026-10-22T10:05:00.000Z';
      assert.equal(formatImpersonationDuration(start, end1), '12m 30s');
      assert.equal(formatImpersonationDuration(start, end2), '5m');
    });

    it('formats hours and minutes (>= 1h)', () => {
      const start = '2026-10-22T10:00:00.000Z';
      const end1 = '2026-10-22T11:15:00.000Z';
      const end2 = '2026-10-22T12:00:00.000Z';
      assert.equal(formatImpersonationDuration(start, end1), '1h 15m');
      assert.equal(formatImpersonationDuration(start, end2), '2h');
    });
  });

  describe('classifyImpersonationStatus', () => {
    const fixedNow = new Date('2026-10-22T12:00:00.000Z');

    it('classifies as completed when ended_at is present', () => {
      const row = {
        started_at: '2026-10-22T10:00:00.000Z',
        ended_at: '2026-10-22T10:30:00.000Z'
      };
      assert.equal(classifyImpersonationStatus(row, fixedNow), 'completed');
    });

    it('classifies as in-progress when ended_at is null and elapsed < 45 min', () => {
      const row = {
        started_at: '2026-10-22T11:30:00.000Z', // 30 min ago
        ended_at: null
      };
      assert.equal(classifyImpersonationStatus(row, fixedNow), 'in-progress');
    });

    it('classifies as expired when ended_at is null and elapsed >= 45 min', () => {
      const rowExact = {
        started_at: '2026-10-22T11:15:00.000Z', // exactly 45 min ago
        ended_at: null
      };
      const rowPast = {
        started_at: '2026-10-22T11:00:00.000Z', // 60 min ago
        ended_at: null
      };
      assert.equal(classifyImpersonationStatus(rowExact, fixedNow), 'expired');
      assert.equal(classifyImpersonationStatus(rowPast, fixedNow), 'expired');
    });
  });

  describe('resolvePeriodDates', () => {
    const fixedNow = new Date('2026-10-22T15:30:00.000Z');

    it('resolves today', () => {
      const { from, to } = resolvePeriodDates('today', null, null, fixedNow);
      assert.equal(from, '2026-10-22T00:00:00.000Z');
      assert.equal(to, '2026-10-22T23:59:59.999Z');
    });

    it('resolves yesterday', () => {
      const { from, to } = resolvePeriodDates('yesterday', null, null, fixedNow);
      assert.equal(from, '2026-10-21T00:00:00.000Z');
      assert.equal(to, '2026-10-21T23:59:59.999Z');
    });

    it('resolves 7d', () => {
      const { from, to } = resolvePeriodDates('7d', null, null, fixedNow);
      assert.equal(from, '2026-10-15T00:00:00.000Z');
      assert.equal(to, '2026-10-22T23:59:59.999Z');
    });

    it('resolves 30d', () => {
      const { from, to } = resolvePeriodDates('30d', null, null, fixedNow);
      assert.equal(from, '2026-09-22T00:00:00.000Z');
      assert.equal(to, '2026-10-22T23:59:59.999Z');
    });

    it('resolves month', () => {
      const { from, to } = resolvePeriodDates('month', null, null, fixedNow);
      assert.equal(from, '2026-10-01T00:00:00.000Z');
      assert.equal(to, '2026-10-22T23:59:59.999Z');
    });

    it('resolves custom and all', () => {
      const custom = resolvePeriodDates('custom', '2026-01-01', '2026-01-31', fixedNow);
      assert.equal(custom.from, '2026-01-01');
      assert.equal(custom.to, '2026-01-31');

      const all = resolvePeriodDates('all', null, null, fixedNow);
      assert.equal(all.from, null);
      assert.equal(all.to, null);
    });
  });

  describe('mapImpersonationAuditLog', () => {
    it('normalizes raw row into camelCase and resolves super admin from userMap', () => {
      const userMap = new Map([
        ['admin-uuid-1', { full_name: 'Super Admin Wesley', email: 'admin@wesley.dev' }]
      ]);

      const rawRow = {
        id: 'log-uuid-1',
        super_admin_id: 'admin-uuid-1',
        target_user_id: 'target-uuid-2',
        target_user_email: 'gestor@escola.com',
        target_user_name: 'Diretor Silva',
        target_school_id: 'school-uuid-3',
        schools: { name: 'Colégio Modelo' },
        reason: 'Atendimento de suporte para liberação de turmas',
        started_at: '2026-10-22T10:00:00.000Z',
        ended_at: '2026-10-22T10:25:30.000Z',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 Test'
      };

      const mapped = mapImpersonationAuditLog(rawRow, userMap);

      assert.equal(mapped.id, 'log-uuid-1');
      assert.equal(mapped.superAdminId, 'admin-uuid-1');
      assert.equal(mapped.superAdminName, 'Super Admin Wesley');
      assert.equal(mapped.superAdminEmail, 'admin@wesley.dev');
      assert.equal(mapped.targetUserId, 'target-uuid-2');
      assert.equal(mapped.targetUserName, 'Diretor Silva');
      assert.equal(mapped.targetUserEmail, 'gestor@escola.com');
      assert.equal(mapped.schoolId, 'school-uuid-3');
      assert.equal(mapped.schoolName, 'Colégio Modelo');
      assert.equal(mapped.reason, 'Atendimento de suporte para liberação de turmas');
      assert.equal(mapped.startedAt, '2026-10-22T10:00:00.000Z');
      assert.equal(mapped.endedAt, '2026-10-22T10:25:30.000Z');
      assert.equal(mapped.duration, '25m 30s');
      assert.equal(mapped.durationSeconds, 1530);
      assert.equal(mapped.status, 'completed');
      assert.equal(mapped.ipAddress, '192.168.1.100');
      assert.equal(mapped.userAgent, 'Mozilla/5.0 Test');
    });

    it('falls back to null/defaults when userMap has no matching entry', () => {
      const rawRow = {
        id: 'log-uuid-2',
        super_admin_id: 'unknown-admin',
        target_user_id: 'target-uuid-3',
        target_user_email: 'anon@target.com',
        target_user_name: null,
        target_school_id: null,
        schools: null,
        reason: 'Teste sem mapeamento',
        started_at: '2026-10-22T11:00:00.000Z',
        ended_at: null
      };

      const mapped = mapImpersonationAuditLog(rawRow, new Map());

      assert.equal(mapped.superAdminName, null);
      assert.equal(mapped.superAdminEmail, null);
      assert.equal(mapped.targetUserName, '');
      assert.equal(mapped.schoolName, '');
      assert.equal(mapped.duration, null);
    });
  });

  describe('normalizeDateBoundaries', () => {
    it('normalizes YYYY-MM-DD strings to ISO UTC boundaries', () => {
      const { from, to } = normalizeDateBoundaries('2026-10-22', '2026-10-22');
      assert.equal(from, '2026-10-22T00:00:00.000Z');
      assert.equal(to, '2026-10-22T23:59:59.999Z');
    });

    it('preserves ISO strings unchanged', () => {
      const isoFrom = '2026-10-22T05:00:00.000Z';
      const isoTo = '2026-10-22T20:00:00.000Z';
      const { from, to } = normalizeDateBoundaries(isoFrom, isoTo);
      assert.equal(from, isoFrom);
      assert.equal(to, isoTo);
    });
  });
});

describe('P2 Impersonation Audit — Service & Repository Integration', () => {
  it('impersonationService.getImpersonationAuditHistory delegates to repository and paginates', async () => {
    const mockRows = [
      {
        id: 'log-1',
        super_admin_id: 'admin-1',
        target_user_id: 'user-1',
        target_user_email: 'u1@test.com',
        target_user_name: 'User One',
        target_school_id: 'school-1',
        schools: { name: 'Escola Um' },
        reason: 'Suporte geral ao operador',
        started_at: '2026-10-22T10:00:00.000Z',
        ended_at: '2026-10-22T10:10:00.000Z'
      },
      {
        id: 'log-2',
        super_admin_id: 'admin-1',
        target_user_id: 'user-2',
        target_user_email: 'u2@test.com',
        target_user_name: 'User Two',
        target_school_id: null,
        reason: 'Verificação de credenciais',
        started_at: '2026-10-22T11:00:00.000Z',
        ended_at: null
      }
    ];

    let capturedParams = null;
    const restoreRepo = stub(impersonationAuditRepository, {
      async listImpersonationAudit(params) {
        capturedParams = params;
        return { data: mockRows, count: 50, error: null };
      }
    });

    const restoreService = stub(impersonationService, {
      async getPlatformUsersMap() {
        return new Map([['admin-1', { full_name: 'Admin Master', email: 'master@admin.com' }]]);
      }
    });

    try {
      const result = await impersonationService.getImpersonationAuditHistory({
        superAdminId: 'admin-1',
        period: 'today',
        page: 2,
        pageSize: 10
      });

      assert.equal(result.error, null);
      assert.equal(result.total, 50);
      assert.equal(result.totalCount, 50);
      assert.equal(result.page, 2);
      assert.equal(result.pageSize, 10);
      assert.equal(result.totalPages, 5);
      assert.equal(result.data.length, 2);

      assert.equal(result.data[0].superAdminName, 'Admin Master');
      assert.equal(result.data[0].status, 'completed');
      assert.equal(result.data[0].duration, '10m');

      assert.equal(capturedParams.superAdminId, 'admin-1');
      assert.equal(capturedParams.limit, 10);
      assert.equal(capturedParams.offset, 10); // (page 2 - 1) * 10
    } finally {
      restoreRepo();
      restoreService();
    }
  });

  it('impersonationService.getImpersonationAuditMetrics calculates totals, statuses and duration average', async () => {
    const mockRows = [
      {
        id: 'log-1',
        started_at: '2026-10-22T10:00:00.000Z',
        ended_at: '2026-10-22T10:10:00.000Z' // 600s
      },
      {
        id: 'log-2',
        started_at: '2026-10-22T10:00:00.000Z',
        ended_at: '2026-10-22T10:20:00.000Z' // 1200s
      },
      {
        id: 'log-3',
        started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago (in-progress)
        ended_at: null
      },
      {
        id: 'log-4',
        started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 60 min ago (expired)
        ended_at: null
      }
    ];

    const restoreRepo = stub(impersonationAuditRepository, {
      async listImpersonationAudit() {
        return { data: mockRows, count: mockRows.length, error: null };
      }
    });

    try {
      const res = await impersonationService.getImpersonationAuditMetrics({ period: 'today' });
      assert.equal(res.error, null);
      const m = res.data;

      assert.equal(m.total, 4);
      assert.equal(m.completed, 2);
      assert.equal(m.inProgress, 1);
      assert.equal(m.expired, 1);
      assert.equal(m.activeOrExpired, 2);

      // Average duration of concluded: (600 + 1200) / 2 = 900s = 15m
      assert.equal(m.averageDurationSeconds, 900);
      assert.equal(m.averageDurationFormatted, '15m');
    } finally {
      restoreRepo();
    }
  });
});
