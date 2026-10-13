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

const TENANT_A_SCHOOL_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B_SCHOOL_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const USER_A_ID = '11111111-1111-1111-1111-111111111111';
const USER_B_ID = '22222222-2222-2222-2222-222222222222';
const PLATFORM_ADMIN_ID = '6f4f26ae-0bcf-434d-94ee-ada82ddc8b25';

function createAccessToken(userId, role = 'authenticated', extraClaims = {}) {
  return jwt.sign(
    {
      aud: 'authenticated',
      role,
      sub: userId,
      email: `${userId}@smart-exit.local`,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iss: 'supabase',
      ...extraClaims
    },
    JWT_SECRET
  );
}

function createAuthedClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

describe('Multi-Tenant RLS Runtime Isolation Tests (PostgreSQL)', () => {
  let clientA;
  let clientB;
  let createdStudentIds = [];

  before(async () => {
    const tokenA = createAccessToken(USER_A_ID);
    const tokenB = createAccessToken(USER_B_ID);

    clientA = createAuthedClient(tokenA);
    clientB = createAuthedClient(tokenB);
  });

  after(async () => {
    if (createdStudentIds.length > 0) {
      for (const id of createdStudentIds) {
        await clientA.from('students').delete().eq('id', id);
      }
    }
  });

  // ------------------------------------------------------------
  // Cenário 1 (Autorizado): Usuário Alpha consulta e insere dados de Alpha -> 200 OK
  // ------------------------------------------------------------
  describe('Cenário 1 — Acesso Autorizado Intra-Tenant', () => {
    it('Usuário Alpha pode consultar a própria escola e recebe Tenant Alpha School', async () => {
      const { data, error } = await clientA
        .from('schools')
        .select('id, name, slug')
        .eq('id', TENANT_A_SCHOOL_ID);

      assert.equal(error, null, `Erro inesperado: ${error?.message}`);
      assert.ok(Array.isArray(data), 'Data deve ser array');
      assert.equal(data.length, 1);
      assert.equal(data[0].id, TENANT_A_SCHOOL_ID);
      assert.equal(data[0].name, 'Tenant Alpha School');
    });

    it('Usuário Alpha pode consultar seus próprios alunos e portões', async () => {
      const { data: students, error: sErr } = await clientA
        .from('students')
        .select('id, full_name, student_identifier')
        .eq('school_id', TENANT_A_SCHOOL_ID);

      assert.equal(sErr, null);
      assert.ok(students.length >= 1);
      assert.ok(students.some((s) => s.student_identifier === 'ALPHA-001'));

      const { data: gates, error: gErr } = await clientA
        .from('gates')
        .select('id, name')
        .eq('school_id', TENANT_A_SCHOOL_ID);

      assert.equal(gErr, null);
      assert.ok(gates.length >= 1);
      assert.ok(gates.some((g) => g.name === 'Portão Alpha'));
    });

    it('Usuário Alpha pode inserir novos dados no seu tenant (Alpha)', async () => {
      const newStudentId = 'aaaaaaaa-5000-0000-0000-999999999001';
      createdStudentIds.push(newStudentId);

      const { data, error } = await clientA
        .from('students')
        .insert({
          id: newStudentId,
          school_id: TENANT_A_SCHOOL_ID,
          student_identifier: 'ALPHA-RT-001',
          full_name: 'Aluno Runtime Alpha Test',
          birth_date: '2016-03-15',
          status: 'active'
        })
        .select();

      assert.equal(error, null, `Inserção autorizada falhou: ${error?.message}`);
      assert.ok(data && data.length === 1);
      assert.equal(data[0].student_identifier, 'ALPHA-RT-001');
    });
  });

  // ------------------------------------------------------------
  // Cenário 2 (Vazamento Cruzado - Leitura): Usuário Alpha tenta consultar dados de Beta -> 0 linhas
  // ------------------------------------------------------------
  describe('Cenário 2 — Isolamento Cruzado de Leitura', () => {
    it('Usuário Alpha tentando consultar escolas de Beta recebe 0 linhas', async () => {
      const { data, error } = await clientA
        .from('schools')
        .select('*')
        .eq('id', TENANT_B_SCHOOL_ID);

      assert.equal(error, null);
      assert.ok(Array.isArray(data));
      assert.equal(data.length, 0, 'Usuário Alpha não deve enxergar Tenant Beta School');
    });

    it('Usuário Alpha tentando consultar alunos de Beta recebe 0 linhas', async () => {
      const { data, error } = await clientA
        .from('students')
        .select('*')
        .eq('school_id', TENANT_B_SCHOOL_ID);

      assert.equal(error, null);
      assert.ok(Array.isArray(data));
      assert.equal(data.length, 0, 'Usuário Alpha não deve listar alunos do Tenant Beta');
    });

    it('Usuário Alpha tentando consultar portões e chamadas de Beta recebe 0 linhas', async () => {
      const { data: gates, error: gErr } = await clientA
        .from('gates')
        .select('*')
        .eq('school_id', TENANT_B_SCHOOL_ID);

      assert.equal(gErr, null);
      assert.equal(gates.length, 0);

      const { data: pickups, error: pErr } = await clientA
        .from('pickup_events')
        .select('*')
        .eq('school_id', TENANT_B_SCHOOL_ID);

      assert.equal(pErr, null);
      assert.equal(pickups.length, 0);
    });

    it('Usuário Beta tentando consultar dados de Alpha recebe 0 linhas', async () => {
      const { data: students, error: sErr } = await clientB
        .from('students')
        .select('*')
        .eq('school_id', TENANT_A_SCHOOL_ID);

      assert.equal(sErr, null);
      assert.equal(students.length, 0, 'Usuário Beta não deve listar alunos do Tenant Alpha');
    });
  });

  // ------------------------------------------------------------
  // Cenário 3 (Vazamento Cruzado - Escrita): Usuário Alpha tenta inserir dados vinculando ao school_id de Beta -> erro RLS
  // ------------------------------------------------------------
  describe('Cenário 3 — Bloqueio Cruzado de Escrita (RLS Check)', () => {
    it('Usuário Alpha tentando inserir aluno em Beta falha com erro RLS 42501', async () => {
      const { data, error } = await clientA
        .from('students')
        .insert({
          school_id: TENANT_B_SCHOOL_ID,
          student_identifier: 'MALICIOUS-001',
          full_name: 'Invasor Tenant Alpha em Beta',
          birth_date: '2016-01-01',
          status: 'active'
        })
        .select();

      assert.equal(data, null);
      assert.ok(error, 'Inserção cruzada de aluno deve ser rejeitada pelo RLS');
      assert.equal(error.code, '42501');
      assert.match(error.message, /violates row-level security policy/i);
    });

    it('Usuário Alpha tentando inserir portão em Beta falha com erro RLS 42501', async () => {
      const { data, error } = await clientA
        .from('gates')
        .insert({
          school_id: TENANT_B_SCHOOL_ID,
          name: 'Portão Clandestino',
          status: 'active'
        })
        .select();

      assert.equal(data, null);
      assert.ok(error, 'Inserção cruzada de portão deve ser rejeitada pelo RLS');
      assert.equal(error.code, '42501');
      assert.match(error.message, /violates row-level security policy/i);
    });

    it('Usuário Alpha tentando atualizar registro de aluno de Beta não afeta nenhuma linha', async () => {
      const { data, error } = await clientA
        .from('students')
        .update({ full_name: 'Nome Alterado Ilegalmente' })
        .eq('student_identifier', 'BETA-001')
        .select();

      assert.equal(error, null);
      assert.ok(Array.isArray(data));
      assert.equal(data.length, 0, 'Nenhuma linha do Tenant Beta deve ser atualizada pelo Tenant Alpha');
    });
  });

  // ------------------------------------------------------------
  // Cenário 4 (Impersonation Cross-Tenant): Token impersonado de Alpha tenta ler dados de Beta -> 0 linhas
  // ------------------------------------------------------------
  describe('Cenário 4 — Impersonation Cross-Tenant Isolation', () => {
    it('Sessão impersonada em nome do Usuário Alpha não consegue acessar dados do Tenant Beta', async () => {
      const impersonatedToken = createAccessToken(USER_A_ID, 'authenticated', {
        app_metadata: {
          impersonated_by: PLATFORM_ADMIN_ID,
          impersonation_session_id: 'test-impersonation-session-001',
          started_at: new Date().toISOString()
        }
      });

      const impersonatedClient = createAuthedClient(impersonatedToken);

      // Leitura de dados de Alpha continua autorizada
      const { data: alphaSchools, error: aErr } = await impersonatedClient
        .from('schools')
        .select('id, name')
        .eq('id', TENANT_A_SCHOOL_ID);

      assert.equal(aErr, null);
      assert.equal(alphaSchools.length, 1);
      assert.equal(alphaSchools[0].name, 'Tenant Alpha School');

      // Tentativa de leitura de dados de Beta resulta em 0 linhas
      const { data: betaSchools, error: bErr } = await impersonatedClient
        .from('schools')
        .select('id, name')
        .eq('id', TENANT_B_SCHOOL_ID);

      assert.equal(bErr, null);
      assert.equal(betaSchools.length, 0, 'Sessão impersonada em Alpha não deve ver escola Beta');

      const { data: betaStudents, error: bsErr } = await impersonatedClient
        .from('students')
        .select('*')
        .eq('school_id', TENANT_B_SCHOOL_ID);

      assert.equal(bsErr, null);
      assert.equal(betaStudents.length, 0, 'Sessão impersonada em Alpha não deve ver alunos Beta');
    });
  });

  // ------------------------------------------------------------
  // Cenário 5 (Privilégios de Plataforma): Usuário comum tenta consultar platform_admins ou chamar list_platform_users -> 0 linhas / erro 42501
  // ------------------------------------------------------------
  describe('Cenário 5 — Proteção de Privilégios de Plataforma', () => {
    it('Usuário comum de tenant chamando list_platform_users recebe erro 42501 (Access Denied)', async () => {
      const { data, error } = await clientA.rpc('list_platform_users');

      assert.equal(data, null);
      assert.ok(error, 'Chamada não autorizada a RPC de plataforma deve ser rejeitada');
      assert.equal(error.code, '42501');
      assert.match(error.message, /Access denied: caller is not a platform admin/i);
    });

    it('Usuário comum de tenant consultando a tabela platform_admins recebe 0 linhas', async () => {
      const { data, error } = await clientA
        .from('platform_admins')
        .select('*');

      assert.equal(error, null);
      assert.ok(Array.isArray(data));
      assert.equal(data.length, 0, 'Usuário comum não deve ter visibilidade da lista de administradores da plataforma');
    });
  });
});
