import assert from 'node:assert/strict';
import { describe, it, after } from 'node:test';
import crypto from 'node:crypto';
import {
  getPlatformAdminClient,
  getServiceRoleClient,
  createAccessToken,
  createAuthedClient
} from './setup.mjs';

describe('E2E-01 — Auth, Criação de Escola e Convite de Membro', () => {
  const adminClient = getPlatformAdminClient();
  const serviceClient = getServiceRoleClient();

  const tempSchoolId = crypto.randomUUID();
  const newUserEmail = `e2e-member-${Date.now()}@smart-exit.local`;
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  let newUserId = null;
  let roleId = '98a4b1ea-652b-490d-9952-c9665ee0ff57';

  after(async () => {
    // Cleanup idempotente de todos os artefatos de teste
    try {
      await serviceClient.from('school_members').delete().eq('school_id', tempSchoolId);
      await serviceClient.from('school_invitations').delete().eq('school_id', tempSchoolId);
      await serviceClient.from('schools').delete().eq('id', tempSchoolId);
      if (newUserId) {
        try {
          await serviceClient.auth.admin.deleteUser(newUserId);
        } catch {
          // ignore
        }
      }
    } catch {
      // Ignora falhas de cleanup
    }
  });

  it('1. Platform Admin cria uma nova instituição escolar com sucesso', async () => {
    // Busca roles via adminClient (role authenticated possui grant de SELECT em public.roles)
    const { data: roles, error: rolesErr } = await adminClient
      .from('roles')
      .select('id, name')
      .in('name', ['secretary', 'administrator'])
      .limit(1);

    assert.equal(rolesErr, null, `Erro ao buscar roles: ${rolesErr?.message}`);
    assert.ok(roles && roles.length > 0, 'Deve encontrar pelo menos um papel no banco');
    roleId = roles[0].id;

    // Platform admin cria escola em public.schools
    const { data: createdSchool, error: schoolErr } = await adminClient
      .from('schools')
      .insert({
        id: tempSchoolId,
        name: `E2E Test Academy ${Date.now()}`,
        slug: `e2e-test-academy-${Date.now()}`,
        status: 'active',
        plan: 'pro',
        primary_color: '#0284c7',
        secondary_color: '#0369a1'
      })
      .select()
      .single();

    assert.equal(schoolErr, null, `Erro ao criar escola: ${schoolErr?.message}`);
    assert.equal(createdSchool.id, tempSchoolId);
    assert.equal(createdSchool.status, 'active');
  });

  it('2. Cria convite de membro com token criptográfico em school_invitations', async () => {
    const { data: invitation, error: inviteErr } = await serviceClient
      .from('school_invitations')
      .insert({
        school_id: tempSchoolId,
        email: newUserEmail,
        role_id: roleId,
        invited_by: '6f4f26ae-0bcf-434d-94ee-ada82ddc8b25',
        token_hash: tokenHash,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    assert.equal(inviteErr, null, `Erro ao emitir convite: ${inviteErr?.message}`);
    assert.equal(invitation.status, 'pending');
    assert.equal(invitation.email, newUserEmail);
  });

  it('3. Novo usuário aceita convite via RPC atômica accept_school_invitation e torna-se membro ativo', async () => {
    // Cria usuário real via Supabase Admin API (gatilho sync cria profile automaticamente)
    const { data: authData, error: authErr } = await serviceClient.auth.admin.createUser({
      email: newUserEmail,
      password: 'StrongPassword123!',
      email_confirm: true,
      user_metadata: { full_name: 'Novo Membro E2E' }
    });

    assert.equal(authErr, null, `Erro ao criar usuário Auth: ${authErr?.message}`);
    assert.ok(authData?.user?.id, 'Usuário criado deve ter ID');
    newUserId = authData.user.id;

    const userToken = createAccessToken(newUserId, 'authenticated', { email: newUserEmail });
    const userClient = createAuthedClient(userToken);

    // Invoca RPC accept_school_invitation
    const { data: result, error: rpcErr } = await userClient.rpc('accept_school_invitation', {
      p_token_hash: tokenHash,
      p_user_id: newUserId,
      p_user_email: newUserEmail
    });

    assert.equal(rpcErr, null, `Erro ao aceitar convite: ${rpcErr?.message}`);
    assert.equal(result?.ok, true, `RPC retornou erro de negócio: ${result?.message}`);

    // Verifica que membership ativa foi criada em school_members
    const { data: member, error: memberErr } = await userClient
      .from('school_members')
      .select('id, school_id, profile_id, role_id, status')
      .eq('school_id', tempSchoolId)
      .eq('profile_id', newUserId)
      .single();

    assert.equal(memberErr, null, `Erro ao consultar membership: ${memberErr?.message}`);
    assert.equal(member.status, 'active');
    assert.equal(member.role_id, roleId);

    // Verifica que o novo usuário agora consegue consultar a escola via RLS
    const { data: schoolData, error: sErr } = await userClient
      .from('schools')
      .select('id, name')
      .eq('id', tempSchoolId)
      .single();

    assert.equal(sErr, null, `Erro ao consultar escola com novo membro: ${sErr?.message}`);
    assert.equal(schoolData.id, tempSchoolId);
  });
});
