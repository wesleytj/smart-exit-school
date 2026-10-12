import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  DEFAULT_RETENTION_DAYS,
  DEFAULT_BATCH_LIMIT,
  MAX_BATCH_LIMIT,
  isEligibleForArchival,
  buildArchiveRecord,
  pickupArchiveService
} from './pickupArchiveService.js';
import { activeCallListQuery } from '../repositories/pickupEventRepository.js';

describe('C3: pickup_events_archive migration SQL contract', () => {
  const migrationSql = readFileSync(
    new URL('../../supabase/migrations/20261012173000_create_pickup_events_archive.sql', import.meta.url),
    'utf8'
  );

  it('defines partial temporal indexes on public.pickup_events', () => {
    assert.match(
      migrationSql,
      /create index if not exists idx_pickup_events_status_completed_at[\s\S]*?where status = 'completed';/i
    );
    assert.match(
      migrationSql,
      /create index if not exists idx_pickup_events_status_cancelled_at[\s\S]*?where status = 'cancelled';/i
    );
  });

  it('creates table public.pickup_events_archive with required constraints', () => {
    assert.match(migrationSql, /create table if not exists public\.pickup_events_archive/i);
    assert.match(migrationSql, /constraint pickup_events_archive_school_fk/i);
    assert.match(migrationSql, /constraint pickup_events_archive_student_enrollment_fk/i);
    assert.match(migrationSql, /constraint pickup_events_archive_gate_fk/i);
    assert.match(
      migrationSql,
      /constraint pickup_events_archive_status_check[\s\S]*?check \(status in \('completed', 'cancelled'\)\)/i
    );
    assert.match(migrationSql, /constraint pickup_events_archive_status_timestamps_check/i);
    assert.match(migrationSql, /archived_at timestamptz not null default now\(\)/i);
  });

  it('enforces RLS and grants SELECT only to authenticated on the archive table', () => {
    assert.match(migrationSql, /alter table public\.pickup_events_archive enable row level security;/i);
    assert.match(migrationSql, /create policy pickup_events_archive_select_member/i);
    assert.match(migrationSql, /grant select on table public\.pickup_events_archive to authenticated;/i);
    assert.match(
      migrationSql,
      /revoke insert, update, delete, truncate on table public\.pickup_events_archive from public, anon, authenticated;/i
    );
  });

  it('defines archive_old_pickup_events with SECURITY DEFINER and SKIP LOCKED', () => {
    assert.match(migrationSql, /create or replace function public\.archive_old_pickup_events/i);
    assert.match(migrationSql, /security definer/i);
    assert.match(migrationSql, /set search_path = public/i);
    assert.match(migrationSql, /for update skip locked/i);
    assert.match(migrationSql, /where status in \('completed', 'cancelled'\)/i);
  });

  it('strictly protects EXECUTE: granted to service_role ONLY, revoked from authenticated and anon', () => {
    assert.match(
      migrationSql,
      /revoke all on function public\.archive_old_pickup_events\(interval, integer, uuid\) from public, anon, authenticated;/i
    );
    assert.match(
      migrationSql,
      /grant execute on function public\.archive_old_pickup_events\(interval, integer, uuid\) to service_role;/i
    );

    // Sanction gate: authenticated must NEVER receive execute privilege
    const authenticatedGrantMatch = migrationSql.match(
      /grant execute on function public\.archive_old_pickup_events[^\n]*to authenticated/i
    );
    assert.equal(authenticatedGrantMatch, null, 'EXECUTE must not be granted to authenticated');
  });
});

describe('C3: pure archival retention logic (pickupArchiveService)', () => {
  const referenceNow = new Date('2026-10-12T12:00:00.000Z');

  it('identifies completed events older than 30 days as eligible', () => {
    assert.equal(DEFAULT_RETENTION_DAYS, 30);
    assert.equal(DEFAULT_BATCH_LIMIT, 5000);

    const oldCompletedEvent = {
      id: 'event-1',
      status: 'completed',
      called_at: '2026-08-01T14:00:00.000Z',
      completed_at: '2026-08-01T14:15:00.000Z',
      updated_at: '2026-08-01T14:15:00.000Z'
    };

    assert.equal(isEligibleForArchival(oldCompletedEvent, referenceNow, 30), true);
  });

  it('identifies cancelled events older than 30 days as eligible', () => {
    const oldCancelledEvent = {
      id: 'event-2',
      status: 'cancelled',
      called_at: '2026-08-10T14:00:00.000Z',
      cancelled_at: '2026-08-10T14:05:00.000Z',
      updated_at: '2026-08-10T14:05:00.000Z'
    };

    assert.equal(isEligibleForArchival(oldCancelledEvent, referenceNow, 30), true);
  });

  it('preserves recent completed and cancelled events (< 30 days)', () => {
    const recentCompleted = {
      id: 'event-3',
      status: 'completed',
      called_at: '2026-10-05T14:00:00.000Z',
      completed_at: '2026-10-05T14:10:00.000Z',
      updated_at: '2026-10-05T14:10:00.000Z'
    };

    const recentCancelled = {
      id: 'event-4',
      status: 'cancelled',
      called_at: '2026-10-10T14:00:00.000Z',
      cancelled_at: '2026-10-10T14:02:00.000Z',
      updated_at: '2026-10-10T14:02:00.000Z'
    };

    assert.equal(isEligibleForArchival(recentCompleted, referenceNow, 30), false);
    assert.equal(isEligibleForArchival(recentCancelled, referenceNow, 30), false);
  });

  it('INVARIANTE ABSOLUTO: active called events are NEVER eligible for archival regardless of age', () => {
    const veryOldActiveEvent = {
      id: 'event-active-old',
      status: 'called',
      called_at: '2025-01-01T08:00:00.000Z',
      completed_at: null,
      cancelled_at: null,
      updated_at: '2025-01-01T08:00:00.000Z'
    };

    assert.equal(isEligibleForArchival(veryOldActiveEvent, referenceNow, 30), false);
    assert.equal(isEligibleForArchival(veryOldActiveEvent, referenceNow, 0), false);
  });

  it('handles invalid or malformed event objects safely', () => {
    assert.equal(isEligibleForArchival(null), false);
    assert.equal(isEligibleForArchival(undefined), false);
    assert.equal(isEligibleForArchival({}), false);
    assert.equal(isEligibleForArchival({ status: 'unknown' }), false);
    assert.equal(isEligibleForArchival({ status: 'completed', completed_at: 'invalid-date' }), false);
  });

  it('buildArchiveRecord copies all event fields and stamps archived_at', () => {
    const completedEvent = {
      id: 'event-10',
      school_id: 'school-1',
      student_enrollment_id: 'enrollment-1',
      gate_id: 'gate-1',
      status: 'completed',
      called_at: '2026-08-01T14:00:00.000Z',
      completed_at: '2026-08-01T14:15:00.000Z',
      cancelled_at: null,
      created_at: '2026-08-01T14:00:00.000Z',
      updated_at: '2026-08-01T14:15:00.000Z'
    };

    const archivedAt = new Date('2026-10-12T15:00:00.000Z');
    const record = buildArchiveRecord(completedEvent, archivedAt);

    assert.equal(record.id, completedEvent.id);
    assert.equal(record.school_id, completedEvent.school_id);
    assert.equal(record.student_enrollment_id, completedEvent.student_enrollment_id);
    assert.equal(record.gate_id, completedEvent.gate_id);
    assert.equal(record.status, 'completed');
    assert.equal(record.completed_at, completedEvent.completed_at);
    assert.equal(record.cancelled_at, null);
    assert.equal(record.archived_at, archivedAt.toISOString());
  });

  it('buildArchiveRecord rejects called status events', () => {
    assert.throws(() => {
      buildArchiveRecord({ id: 'active-1', status: 'called' });
    }, /Apenas eventos completados ou cancelados/);
  });
});

describe('C3: backend service_role DAL isolation (pickupArchiveService)', () => {
  it('rejects execution if supabaseAdmin is not provided', async () => {
    const result = await pickupArchiveService.archiveOldCalls(null);
    assert.equal(result.data, null);
    assert.match(result.error.message, /service_role/i);
  });

  it('rejects execution if client lacks rpc method', async () => {
    const result = await pickupArchiveService.archiveOldCalls({});
    assert.equal(result.data, null);
    assert.match(result.error.message, /service_role/i);
  });

  it('invokes RPC with sanitized batchLimit and olderThan parameters', async () => {
    let capturedArgs = null;
    const mockAdmin = {
      rpc: async (fnName, args) => {
        capturedArgs = { fnName, args };
        return { data: [{ archived_count: 42 }], error: null };
      }
    };

    const result = await pickupArchiveService.archiveOldCalls(mockAdmin, {
      olderThan: '60 days',
      batchLimit: 2500,
      schoolId: 'school-abc'
    });

    assert.equal(result.data, 42);
    assert.equal(result.error, null);
    assert.equal(capturedArgs.fnName, 'archive_old_pickup_events');
    assert.equal(capturedArgs.args.p_older_than, '60 days');
    assert.equal(capturedArgs.args.p_batch_limit, 2500);
    assert.equal(capturedArgs.args.p_school_id, 'school-abc');
  });

  it('clamps batchLimit between 1 and MAX_BATCH_LIMIT', async () => {
    let capturedBatch = null;
    const mockAdmin = {
      rpc: async (_fnName, args) => {
        capturedBatch = args.p_batch_limit;
        return { data: [{ archived_count: 0 }], error: null };
      }
    };

    await pickupArchiveService.archiveOldCalls(mockAdmin, { batchLimit: 999999 });
    assert.equal(capturedBatch, MAX_BATCH_LIMIT);

    await pickupArchiveService.archiveOldCalls(mockAdmin, { batchLimit: -5 });
    assert.equal(capturedBatch, 1);
  });
});

describe('C3: operational queue non-regression', () => {
  it('activeCallListQuery continues to filter exclusively status = called', () => {
    const query = activeCallListQuery('school-123');

    assert.equal(query.table, 'pickup_events');
    assert.equal(query.status, 'called');
    assert.equal(query.orderColumn, 'called_at');
    assert.equal(query.ascending, false);
  });
});
