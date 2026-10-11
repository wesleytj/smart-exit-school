import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { verifyHs256Jwt } from '../_shared/jwt.ts';
import { sendInviteEmail } from '../_shared/brevo.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_JWT_SECRET =
  Deno.env.get('SUPABASE_JWT_SECRET') ??
  Deno.env.get('JWT_SECRET') ??
  'super-secret-jwt-token-with-at-least-32-characters-long';

async function sha256(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateRawToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const callerToken = authHeader.replace('Bearer ', '').trim();

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Validar JWT do chamador (híbrido HS256 local + auth.getUser fallback)
    let callerSub: string | null = null;
    let callerEmail: string | null = null;

    const callerClaims = await verifyHs256Jwt(callerToken, SUPABASE_JWT_SECRET);
    if (callerClaims?.sub) {
      callerSub = callerClaims.sub as string;
      callerEmail = (callerClaims.email as string) ?? null;
    } else {
      const { data: { user: callerUser }, error: callerError } = await callerClient.auth.getUser(callerToken);
      if (!callerError && callerUser) {
        callerSub = callerUser.id;
        callerEmail = callerUser.email ?? null;
      }
    }

    if (!callerSub) {
      return new Response(JSON.stringify({ error: 'Invalid or expired caller token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Se o email não veio nas claims, busca do usuário
    if (!callerEmail) {
      const { data: userData } = await serviceClient.auth.admin.getUserById(callerSub);
      callerEmail = userData?.user?.email ?? null;
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { school_id, email, role, action, invitation_id } = body;

    // Ação alternativa: REVOGAR convite
    if (action === 'revoke') {
      if (!invitation_id) {
        return new Response(JSON.stringify({ error: 'Missing invitation_id for revocation' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Buscar convite
      const { data: targetInv, error: findInvError } = await serviceClient
        .from('school_invitations')
        .select('id, school_id, status')
        .eq('id', invitation_id)
        .single();

      if (findInvError || !targetInv) {
        return new Response(JSON.stringify({ error: 'Convite não encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Checar autoridade para revogar
      const { data: isPlatformAdmin } = await callerClient.rpc('is_platform_admin');
      if (!isPlatformAdmin) {
        const { data: callerMember } = await serviceClient
          .from('school_members')
          .select('id, status, roles!inner(name)')
          .eq('school_id', targetInv.school_id)
          .eq('profile_id', callerSub)
          .eq('status', 'active')
          .maybeSingle();

        const callerRoleName = (callerMember?.roles as unknown as { name: string })?.name;
        if (!callerMember || !['owner', 'administrator'].includes(callerRoleName)) {
          return new Response(JSON.stringify({ error: 'Sem permissão para revogar este convite' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      await serviceClient
        .from('school_invitations')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('id', invitation_id);

      return new Response(JSON.stringify({ ok: true, message: 'Convite revogado com sucesso.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fluxo Principal: CRIAR / REENVIAR CONVITE
    if (!school_id || typeof school_id !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid school_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Informe um endereço de e-mail válido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Trava de Auto-Convite
    if (callerEmail && normalizedEmail === callerEmail.trim().toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Você não pode convidar o seu próprio e-mail.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : '';
    const VALID_ROLES = ['owner', 'administrator', 'secretary', 'gatekeeper'];
    if (!VALID_ROLES.includes(normalizedRole)) {
      return new Response(JSON.stringify({ error: 'Papel inválido. Opções: owner, administrator, secretary, gatekeeper' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Checar existência e status da escola (C6)
    const { data: school, error: schoolError } = await serviceClient
      .from('schools')
      .select('id, name, status')
      .eq('id', school_id)
      .maybeSingle();

    if (schoolError || !school) {
      return new Response(JSON.stringify({ error: 'Instituição de ensino não encontrada.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (school.status !== 'active') {
      return new Response(JSON.stringify({ error: `Apenas escolas com status ativo podem receber convites (status atual: ${school.status}).` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Matriz de Autoridade e Anti-Escalada (C4)
    const { data: isPlatformAdmin } = await callerClient.rpc('is_platform_admin');

    if (!isPlatformAdmin) {
      const { data: callerMember } = await serviceClient
        .from('school_members')
        .select('id, status, roles!inner(name)')
        .eq('school_id', school_id)
        .eq('profile_id', callerSub)
        .eq('status', 'active')
        .maybeSingle();

      if (!callerMember) {
        return new Response(JSON.stringify({ error: 'Acesso negado: o usuário não é membro ativo desta instituição.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const callerRole = (callerMember.roles as unknown as { name: string })?.name;

      if (!['owner', 'administrator'].includes(callerRole)) {
        return new Response(JSON.stringify({ error: 'Apenas Proprietários ou Administradores podem convidar membros.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Anti-escalada: Administrator NÃO pode convidar Owner
      if (callerRole === 'administrator' && normalizedRole === 'owner') {
        return new Response(JSON.stringify({ error: 'Administradores não possuem permissão para convidar um Proprietário (owner).' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 5. Resolver role_id
    const { data: roleRecord, error: roleError } = await serviceClient
      .from('roles')
      .select('id, name')
      .eq('name', normalizedRole)
      .single();

    if (roleError || !roleRecord) {
      return new Response(JSON.stringify({ error: 'Erro ao resolver identificador do papel.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 6. Verificar se o e-mail já pertence a membro da escola
    const { data: userList } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingUser = userList?.users?.find(
      (u) => u.email?.trim().toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      const { data: existingMembership } = await serviceClient
        .from('school_members')
        .select('id, status')
        .eq('school_id', school_id)
        .eq('profile_id', existingUser.id)
        .maybeSingle();

      if (existingMembership?.status === 'active') {
        return new Response(JSON.stringify({ error: 'Este usuário já é membro ativo desta instituição de ensino.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (existingMembership?.status === 'inactive') {
        return new Response(JSON.stringify({ error: 'Este usuário possui vínculo inativo com a escola. Entre em contato com a administração.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 7. Gerar rawToken e tokenHash (C10)
    const rawToken = generateRawToken();
    const tokenHash = await sha256(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 8. Checar convite pendente existente para reenvio
    const { data: existingInvite } = await serviceClient
      .from('school_invitations')
      .select('id')
      .eq('school_id', school_id)
      .ilike('email', normalizedEmail)
      .eq('status', 'pending')
      .maybeSingle();

    let invitationId: string;

    if (existingInvite) {
      // Revalida o convite pendente existente
      const { data: updatedInv, error: updateError } = await serviceClient
        .from('school_invitations')
        .update({
          token_hash: tokenHash,
          role_id: roleRecord.id,
          invited_by: callerSub,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInvite.id)
        .select('id')
        .single();

      if (updateError || !updatedInv) {
        return new Response(JSON.stringify({ error: 'Falha ao revalidar convite existente.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      invitationId = updatedInv.id;
    } else {
      // Cria novo convite
      const { data: newInv, error: insertError } = await serviceClient
        .from('school_invitations')
        .insert({
          school_id,
          email: normalizedEmail,
          role_id: roleRecord.id,
          invited_by: callerSub,
          token_hash: tokenHash,
          status: 'pending',
          expires_at: expiresAt
        })
        .select('id')
        .single();

      if (insertError || !newInv) {
        return new Response(JSON.stringify({ error: 'Falha ao registrar convite no banco de dados.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      invitationId = newInv.id;
    }

    // 9. Enviar e-mail via Brevo SMTP (C7)
    const siteUrl = Deno.env.get('SITE_URL') || 'https://smart-exit-school.vercel.app';
    const inviteLink = `${siteUrl}/accept-invite?token=${rawToken}`;

    await sendInviteEmail({
      to: normalizedEmail,
      schoolName: school.name,
      roleName: normalizedRole,
      inviteLink
    });

    return new Response(
      JSON.stringify({
        ok: true,
        invitation_id: invitationId,
        email: normalizedEmail,
        role: normalizedRole,
        reissued: Boolean(existingInvite),
        message: existingInvite
          ? 'Convite existente revalidado e reenviado com sucesso.'
          : 'Convite enviado com sucesso.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
