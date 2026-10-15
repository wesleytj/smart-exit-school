import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import process from 'node:process';

// Carrega variáveis locais de suporte caso existam
if (fs.existsSync('.env.e2e')) {
  dotenv.config({ path: '.env.e2e' });
}
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
if (fs.existsSync('.env.staging')) {
  dotenv.config({ path: '.env.staging' });
}
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('[ERRO] SUPABASE_SERVICE_ROLE_KEY não foi informada nas variáveis de ambiente.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const TENANT_ALPHA_SCHOOL_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_BETA_SCHOOL_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

export async function resetFixtures() {
  console.log(`[reset-e2e-fixtures] Conectando ao Supabase em: ${supabaseUrl}`);

  // 1. Deletar anos letivos temporários criados nos testes (>= 2028)
  const { error: errSchoolYearsDelete } = await supabase
    .from('school_years')
    .delete()
    .gte('year', 2028);

  if (errSchoolYearsDelete) {
    throw new Error(`Erro ao deletar anos letivos >= 2028: ${errSchoolYearsDelete.message}`);
  }

  // 2. Restaurar ano letivo 2026 como ativo único para Tenant Alpha e Beta
  const { error: errDeactivateYears } = await supabase
    .from('school_years')
    .update({ is_active: false })
    .in('school_id', [TENANT_ALPHA_SCHOOL_ID, TENANT_BETA_SCHOOL_ID]);

  if (errDeactivateYears) {
    throw new Error(`Erro ao desativar anos letivos: ${errDeactivateYears.message}`);
  }

  const { error: errActivate2026 } = await supabase
    .from('school_years')
    .update({ is_active: true })
    .in('school_id', [TENANT_ALPHA_SCHOOL_ID, TENANT_BETA_SCHOOL_ID])
    .eq('year', 2026);

  if (errActivate2026) {
    throw new Error(`Erro ao ativar ano 2026: ${errActivate2026.message}`);
  }

  // 3. Deletar alunos temporários de testes E2E (identificador E2E-* ou nome Aluno E2E Playwright*)
  const { error: errDeleteStudents } = await supabase
    .from('students')
    .delete()
    .or('student_identifier.ilike.E2E-%,full_name.ilike.Aluno E2E Playwright%');

  if (errDeleteStudents) {
    throw new Error(`Erro ao deletar alunos temporários E2E: ${errDeleteStudents.message}`);
  }

  // 4. Limpar eventos de pickup e arquivos das escolas de teste
  const { error: errDeletePickupEvents } = await supabase
    .from('pickup_events')
    .delete()
    .in('school_id', [TENANT_ALPHA_SCHOOL_ID, TENANT_BETA_SCHOOL_ID]);

  if (errDeletePickupEvents) {
    throw new Error(`Erro ao limpar pickup_events: ${errDeletePickupEvents.message}`);
  }

  const { error: errDeleteArchive } = await supabase
    .from('pickup_events_archive')
    .delete()
    .in('school_id', [TENANT_ALPHA_SCHOOL_ID, TENANT_BETA_SCHOOL_ID]);

  if (errDeleteArchive) {
    // Tabela de arquivo pode não existir se a migração C3 não estiver aplicada
    console.warn(`[aviso] Não foi possível limpar pickup_events_archive: ${errDeleteArchive.message}`);
  }

  // 5. Recriar fixtures canônicas de chamadas em estado 'called' para Alpha e Beta
  const nowIso = new Date().toISOString();
  const { error: errInsertPickups } = await supabase
    .from('pickup_events')
    .insert([
      {
        id: 'aaaaaaaa-8000-0000-0000-aaaaaaaaaaaa',
        school_id: TENANT_ALPHA_SCHOOL_ID,
        student_enrollment_id: 'aaaaaaaa-6000-0000-0000-aaaaaaaaaaaa',
        gate_id: 'aaaaaaaa-0003-0000-0000-aaaaaaaaaaaa',
        status: 'called',
        called_at: nowIso
      },
      {
        id: 'bbbbbbbb-8000-0000-0000-bbbbbbbbbbbb',
        school_id: TENANT_BETA_SCHOOL_ID,
        student_enrollment_id: 'bbbbbbbb-6000-0000-0000-bbbbbbbbbbbb',
        gate_id: 'bbbbbbbb-0003-0000-0000-bbbbbbbbbbbb',
        status: 'called',
        called_at: nowIso
      }
    ]);

  if (errInsertPickups) {
    throw new Error(`Erro ao recriar chamadas de teste: ${errInsertPickups.message}`);
  }

  console.log('Fixtures resetadas com sucesso.');
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('reset-e2e-fixtures.js')) {
  resetFixtures().catch((err) => {
    console.error('[FATAL] Falha no reset de fixtures:', err);
    process.exit(1);
  });
}
