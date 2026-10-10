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

describe('Impersonation Edge Functions — JWT Minting & Session Control (Branch 2)', () => {
  let adminToken;
  let regularUserToken;
  let serviceRoleClient;
  const createdAuditLogIds = [];

  before(() => {
    adminToken = createToken(PLATFORM_ADMIN_ID, 'authenticated');
    regularUserToken = createToken(REGULAR_USER_ID, 'authenticated');
    const serviceToken = createToken('00000000-0000-0000-0000-000000000000', 'service_role');
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

  describe('POST /functions/v1/impersonate-user', () => {
    it('Rejects non-platform admin caller with 403 Forbidden', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/impersonate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${regularUserToken}`
        },
        body: JSON.stringify({
          target_user_id: PLATFORM_ADMIN_ID,
          reason: 'Tentativa não autorizada'
        })
      });

      assert.equal(response.status, 403);
      const data = await response.json();
      assert.match(data.error, /Forbidden/i);
    });

    it('Rejects request with reason shorter than 5 characters with 400 Bad Request', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/impersonate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          target_user_id: PLATFORM_ADMIN_ID,
          reason: '1234'
        })
      });

      assert.equal(response.status, 400);
      const data = await response.json();
      assert.match(data.error, /Reason must contain at least 5 characters/i);
    });

    it('Rejects request without target_user_id with 400 Bad Request', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/impersonate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          reason: 'Motivo com mais de cinco caracteres'
        })
      });

      assert.equal(response.status, 400);
      const data = await response.json();
      assert.match(data.error, /Missing target_user_id/i);
    });

    it('Rejects request for nonexistent target user with 404 Not Found', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/impersonate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          target_user_id: '00000000-0000-0000-0000-000000000000',
          reason: 'Motivo com mais de cinco caracteres'
        })
      });

      assert.equal(response.status, 404);
      const data = await response.json();
      assert.match(data.error, /Target user not found/i);
    });

    it('Platform Admin can mint impersonation token with valid payload', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/impersonate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          target_user_id: PLATFORM_ADMIN_ID,
          reason: 'Auditoria e validação técnica da Edge Function'
        })
      });

      assert.equal(response.status, 200);
      const data = await response.json();

      assert.ok(data.token, 'Must return signed token');
      assert.ok(data.expires_at, 'Must return expires_at timestamp');
      assert.ok(data.impersonation_log_id, 'Must return impersonation_log_id');
      assert.equal(data.target_user?.id, PLATFORM_ADMIN_ID);
      assert.equal(data.target_user?.email, 'admin@alltech.com');

      createdAuditLogIds.push(data.impersonation_log_id);

      // Decodificar e validar claims do JWT
      const decoded = jwt.decode(data.token);
      assert.equal(decoded.sub, PLATFORM_ADMIN_ID);
      assert.equal(decoded.role, 'authenticated');
      assert.equal(decoded.is_impersonated, true);
      assert.equal(decoded.impersonator_id, PLATFORM_ADMIN_ID);
      assert.equal(decoded.impersonation_log_id, data.impersonation_log_id);
      assert.equal(decoded.iss, 'supabase');
      assert.equal(decoded.aud, 'authenticated');

      // Validar assinatura criptográfica com o secret
      const verified = jwt.verify(data.token, JWT_SECRET);
      assert.equal(verified.sub, PLATFORM_ADMIN_ID);

      // Validar que o token cunhado é aceito pelo PostgREST
      const postgrestRes = await fetch(`${SUPABASE_URL}/rest/v1/schools?select=id,name`, {
        headers: {
          Authorization: `Bearer ${data.token}`,
          apikey: SUPABASE_ANON_KEY
        }
      });

      assert.equal(postgrestRes.status, 200, 'PostgREST must accept impersonated JWT');
      const schools = await postgrestRes.json();
      assert.ok(Array.isArray(schools));
    });
  });

  describe('POST /functions/v1/end-impersonation', () => {
    it('Records ended_at and closes the impersonation session', async () => {
      // 1. Iniciar impersonation para obter um log_id
      const startRes = await fetch(`${SUPABASE_URL}/functions/v1/impersonate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          target_user_id: PLATFORM_ADMIN_ID,
          reason: 'Sessão temporária para testar encerramento'
        })
      });

      assert.equal(startRes.status, 200);
      const startData = await startRes.json();
      createdAuditLogIds.push(startData.impersonation_log_id);

      // 2. Chamar end-impersonation usando o token cunhado
      const endRes = await fetch(`${SUPABASE_URL}/functions/v1/end-impersonation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${startData.token}`
        },
        body: JSON.stringify({
          impersonation_log_id: startData.impersonation_log_id
        })
      });

      assert.equal(endRes.status, 200);
      const endData = await endRes.json();
      assert.equal(endData.success, true);
      assert.equal(endData.impersonation_log_id, startData.impersonation_log_id);
      assert.ok(endData.ended_at);

      // 3. Verificar no banco que ended_at está gravado
      const { data: logRecord } = await serviceRoleClient
        .from('impersonation_audit_logs')
        .select('*')
        .eq('id', startData.impersonation_log_id)
        .single();

      assert.ok(logRecord.ended_at, 'ended_at must be populated in database');
      assert.ok(new Date(logRecord.ended_at) >= new Date(logRecord.started_at));
    });

    it('Rejects end-impersonation from unauthorized non-admin caller', async () => {
      const endRes = await fetch(`${SUPABASE_URL}/functions/v1/end-impersonation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${regularUserToken}`
        },
        body: JSON.stringify({
          impersonation_log_id: '00000000-0000-0000-0000-000000000000'
        })
      });

      assert.equal(endRes.status, 403);
    });
  });
});
