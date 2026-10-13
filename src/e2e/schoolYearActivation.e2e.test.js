import assert from 'node:assert/strict';
import { describe, it, after } from 'node:test';
import crypto from 'node:crypto';
import {
  getAlphaClient,
  TENANT_A_SCHOOL_ID,
  TENANT_A_SCHOOL_YEAR_ID,
  TENANT_B_SCHOOL_ID
} from './setup.mjs';

describe('E2E-05 — Ativação Atômica de Ano Letivo (RPC activate_school_year)', () => {
  const clientA = getAlphaClient();

  const year2027Id = crypto.randomUUID();

  after(async () => {
    // Restaura o ano 2026 como ativo e limpa o ano temporário
    try {
      await clientA.rpc('activate_school_year', {
        p_year_id: TENANT_A_SCHOOL_YEAR_ID,
        p_school_id: TENANT_A_SCHOOL_ID
      });
      await clientA.from('school_years').delete().eq('id', year2027Id);
    } catch {
      // ignore
    }
  });

  it('1. Operador cadastra novo ano letivo inativo (2027) para a escola', async () => {
    const { error: insertErr } = await clientA
      .from('school_years')
      .insert({
        id: year2027Id,
        school_id: TENANT_A_SCHOOL_ID,
        year: 2027,
        is_active: false,
        starts_at: '2027-01-01',
        ends_at: '2027-12-31'
      });

    assert.equal(insertErr, null, `Erro ao criar ano 2027: ${insertErr?.message}`);

    const { data: years, error: qErr } = await clientA
      .from('school_years')
      .select('id, year, is_active')
      .eq('school_id', TENANT_A_SCHOOL_ID);

    assert.equal(qErr, null);
    const activeCount = years.filter((y) => y.is_active).length;
    assert.equal(activeCount, 1, 'Exatamente 1 ano letivo deve estar ativo inicialmente');
    assert.ok(years.find((y) => y.id === TENANT_A_SCHOOL_YEAR_ID && y.is_active));
    assert.ok(years.find((y) => y.id === year2027Id && !y.is_active));
  });

  it('2. Operador aciona RPC activate_school_year; novo ano vira ativo e ano anterior é desativado atomicamente', async () => {
    const { data: activated, error: rpcErr } = await clientA.rpc('activate_school_year', {
      p_year_id: year2027Id,
      p_school_id: TENANT_A_SCHOOL_ID
    });

    assert.equal(rpcErr, null, `Erro na RPC activate_school_year: ${rpcErr?.message}`);
    assert.equal(activated.id, year2027Id);
    assert.equal(activated.is_active, true);

    // Consulta estado de todos os anos da escola
    const { data: years, error: qErr } = await clientA
      .from('school_years')
      .select('id, year, is_active')
      .eq('school_id', TENANT_A_SCHOOL_ID);

    assert.equal(qErr, null);
    const y2026 = years.find((y) => y.id === TENANT_A_SCHOOL_YEAR_ID);
    const y2027 = years.find((y) => y.id === year2027Id);

    assert.equal(y2027.is_active, true, 'Ano 2027 deve estar ativo');
    assert.equal(y2026.is_active, false, 'Ano 2026 deve ter sido desativado atomicamente');

    const activeYears = years.filter((y) => y.is_active);
    assert.equal(activeYears.length, 1, 'Invariante: exatamente 1 ano ativo por tenant');
  });

  it('3. RPC rejeita ativação com erro se o chamador tentar ativar em escola não autorizada ou ano inexistente', async () => {
    // Caso A: Tenta ativar ano informando tenant não autorizado (Tenant Beta)
    const { data: crossTenantRes, error: crossTenantErr } = await clientA.rpc('activate_school_year', {
      p_year_id: year2027Id,
      p_school_id: TENANT_B_SCHOOL_ID
    });

    assert.notEqual(crossTenantErr, null, 'RPC deve falhar ao tentar acionar tenant alheio');
    assert.ok(
      crossTenantErr.message.includes('Acesso não autorizado') ||
      crossTenantErr.message.includes('not found') ||
      crossTenantErr.code === '42501' ||
      crossTenantErr.code === 'P0002',
      `Erro de segurança esperado, recebido: ${crossTenantErr.message}`
    );
    assert.equal(crossTenantRes, null);

    // Caso B: Tenta ativar ano inexistente na própria escola
    const fakeYearId = crypto.randomUUID();
    const { data: notFoundRes, error: notFoundErr } = await clientA.rpc('activate_school_year', {
      p_year_id: fakeYearId,
      p_school_id: TENANT_A_SCHOOL_ID
    });

    assert.notEqual(notFoundErr, null, 'RPC deve falhar para ano inexistente');
    assert.ok(
      notFoundErr.message.includes('not found for school') || notFoundErr.code === 'P0002',
      `Mensagem de não encontrado esperada, recebida: ${notFoundErr.message}`
    );
    assert.equal(notFoundRes, null);
  });

  it('4. Reativa o ano 2026 via RPC e restaura o baseline da escola', async () => {
    const { data: restored, error: rpcErr } = await clientA.rpc('activate_school_year', {
      p_year_id: TENANT_A_SCHOOL_YEAR_ID,
      p_school_id: TENANT_A_SCHOOL_ID
    });

    assert.equal(rpcErr, null, `Erro ao restaurar ano 2026: ${rpcErr?.message}`);
    assert.equal(restored.id, TENANT_A_SCHOOL_YEAR_ID);
    assert.equal(restored.is_active, true);

    const { data: years } = await clientA
      .from('school_years')
      .select('id, year, is_active')
      .eq('school_id', TENANT_A_SCHOOL_ID);

    const activeYears = years.filter((y) => y.is_active);
    assert.equal(activeYears.length, 1);
    assert.equal(activeYears[0].id, TENANT_A_SCHOOL_YEAR_ID);
  });
});
