import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import process from 'node:process';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const JWT_SECRET = process.env.SUPABASE_LOCAL_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long';

const PLATFORM_ADMIN_ID = '6f4f26ae-0bcf-434d-94ee-ada82ddc8b25';
const REGULAR_USER_ID = '99999999-9999-4999-8999-999999999999';

function createToken(sub, role = 'authenticated') {
  return jwt.sign(
    {
      aud: 'authenticated',
      role,
      sub,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000)
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

describe('Impersonation Foundation — Database & Security (Branch 1)', () => {
  let adminClient;
  let userClient;
  let serviceRoleClient;
  const createdAuditLogIds = [];

  before(() => {
    const adminToken = createToken(PLATFORM_ADMIN_ID, 'authenticated');
    const userToken = createToken(REGULAR_USER_ID, 'authenticated');
    const serviceToken = createToken('00000000-0000-0000-0000-000000000000', 'service_role');

    adminClient = createClientWithToken(adminToken);
    userClient = createClientWithToken(userToken);
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

  describe('RPC: list_platform_users', () => {
    it('Platform Admin can call list_platform_users and receives catalog users', async () => {
      const { data, error } = await adminClient.rpc('list_platform_users');
      assert.equal(error, null, `Expected no error, got: ${error?.message}`);
      assert.ok(Array.isArray(data), 'Result must be an array');
      assert.ok(data.length > 0, 'Catalog should contain at least the seeded user');

      const adminUser = data.find((u) => u.user_id === PLATFORM_ADMIN_ID);
      assert.ok(adminUser, 'Catalog must include the platform admin user');
      assert.equal(adminUser.email, 'admin@alltech.com');
      assert.equal(adminUser.full_name, 'admin');
    });

    it('Regular user calling list_platform_users fails with error 42501 (access denied)', async () => {
      const { data, error } = await userClient.rpc('list_platform_users');
      assert.equal(data, null);
      assert.ok(error, 'Expected error for non-platform admin caller');
      assert.equal(error.code, '42501', `Expected code 42501, got: ${error.code}`);
      assert.match(error.message, /Access denied: caller is not a platform admin/i);
    });

    it('Platform Admin can filter list_platform_users by search parameter', async () => {
      const { data, error } = await adminClient.rpc('list_platform_users', {
        p_search: 'admin@alltech'
      });
      assert.equal(error, null);
      assert.ok(Array.isArray(data));
      assert.ok(data.some((u) => u.email === 'admin@alltech.com'));

      const { data: noMatch } = await adminClient.rpc('list_platform_users', {
        p_search: 'nonexistent-query-string-xyz'
      });
      assert.ok(Array.isArray(noMatch));
      assert.equal(noMatch.length, 0);
    });
  });

  describe('Table: impersonation_audit_logs RLS & Grants', () => {
    it('Authenticated client cannot INSERT into impersonation_audit_logs', async () => {
      const { data, error } = await adminClient
        .from('impersonation_audit_logs')
        .insert({
          super_admin_id: PLATFORM_ADMIN_ID,
          target_user_id: PLATFORM_ADMIN_ID,
          target_user_email: 'admin@alltech.com',
          reason: 'Attempt by authenticated client directly'
        });

      assert.equal(data, null);
      assert.ok(error, 'Direct INSERT by authenticated user must be denied');
      assert.equal(error.code, '42501');
    });

    it('Service role client can INSERT an audit log entry', async () => {
      const { data, error } = await serviceRoleClient
        .from('impersonation_audit_logs')
        .insert({
          super_admin_id: PLATFORM_ADMIN_ID,
          target_user_id: PLATFORM_ADMIN_ID,
          target_user_email: 'admin@alltech.com',
          target_user_name: 'admin',
          reason: 'Verificação de suporte técnico autorizado via service role',
          ip_address: '127.0.0.1',
          user_agent: 'Node.js Test Runner'
        })
        .select()
        .single();

      assert.equal(error, null, `Insert via service_role failed: ${error?.message}`);
      assert.ok(data?.id);
      assert.equal(data.reason, 'Verificação de suporte técnico autorizado via service role');
      assert.ok(data.started_at);
      assert.equal(data.ended_at, null);

      createdAuditLogIds.push(data.id);
    });

    it('Rejects INSERT when reason has fewer than 5 characters', async () => {
      const { data, error } = await serviceRoleClient
        .from('impersonation_audit_logs')
        .insert({
          super_admin_id: PLATFORM_ADMIN_ID,
          target_user_id: PLATFORM_ADMIN_ID,
          target_user_email: 'admin@alltech.com',
          reason: 'abcd' // Less than 5 characters
        })
        .select()
        .single();

      assert.equal(data, null);
      assert.ok(error, 'Check constraint must reject reason < 5 chars');
      assert.equal(error.code, '23514'); // check_violation
    });

    it('Platform Admin can SELECT rows from impersonation_audit_logs', async () => {
      const { data, error } = await adminClient
        .from('impersonation_audit_logs')
        .select('*');

      assert.equal(error, null, `Platform Admin select failed: ${error?.message}`);
      assert.ok(Array.isArray(data));
      assert.ok(data.length > 0, 'Platform Admin should see the inserted audit log');
      const found = data.find((row) => createdAuditLogIds.includes(row.id));
      assert.ok(found, 'Platform Admin must see the newly created audit log entry');
    });

    it('Regular user SELECT on impersonation_audit_logs returns 0 rows (RLS blocks)', async () => {
      const { data, error } = await userClient
        .from('impersonation_audit_logs')
        .select('*');

      assert.equal(error, null, 'Query executes but returns empty list under RLS');
      assert.ok(Array.isArray(data));
      assert.equal(data.length, 0, 'Non-admin authenticated user must receive 0 rows');
    });
  });
});
