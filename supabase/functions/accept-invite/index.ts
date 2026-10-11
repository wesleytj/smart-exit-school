import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { verifyHs256Jwt } from '../_shared/jwt.ts';

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

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
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
    const url = new URL(req.url);
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const isValidateRoute =
      url.pathname.endsWith('/validate') ||
      body.action === 'validate';

    const isConfirmRoute =
      url.pathname.endsWith('/confirm') ||
      body.action === 'confirm' ||
      !isValidateRoute; // Default se não for validate

    const { token } = body;
    if (!token || typeof token !== 'string' || token.trim().length < 16) {
      return new Response(JSON.stringify({ ok: false, valid: false, error: 'Token de convite inválido ou ausente' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const tokenHash = await sha256(token.trim());

    // =========================================================================
    // ENDPOINT: VALIDATE (PÚBLICO, C10)
    // =========================================================================
    if (isValidateRoute) {
      const { data: inv, error: invError } = await serviceClient
        .from('school_invitations')
        .select(`
          id,
          email,
          status,
          expires_at,
          schools ( id, name, slug, status ),
          roles ( id, name )
        `)
        .eq('token_hash', tokenHash)
        .maybeSingle();

      if (invError || !inv) {
        return new Response(
          JSON.stringify({ ok: false, valid: false, code: 'NOT_FOUND', message: 'Convite não encontrado.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (inv.status === 'accepted') {
        return new Response(
          JSON.stringify({ ok: false, valid: false, code: 'ALREADY_ACCEPTED', message: 'Este convite já foi aceito anteriormente.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (inv.status === 'revoked') {
        return new Response(
          JSON.stringify({ ok: false, valid: false, code: 'REVOKED', message: 'Este convite foi revogado pela instituição de ensino.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isExpired = inv.status !== 'pending' || new Date(inv.expires_at) <= new Date();
      if (isExpired) {
        return new Response(
          JSON.stringify({ ok: false, valid: false, code: 'EXPIRED', message: 'Este convite expirou.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const schoolData = inv.schools as unknown as { name: string; slug: string; status: string };
      const roleData = inv.roles as unknown as { name: string };

      return new Response(
        JSON.stringify({
          ok: true,
          valid: true,
          school_name: schoolData?.name || 'Instituição Escolar',
          role_name: roleData?.name || 'Membro',
          masked_email: maskEmail(inv.email),
          expires_at: inv.expires_at
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // ENDPOINT: CONFIRM (ATÔMICO, C1, C2, C3, C5)
    // =========================================================================
    if (isConfirmRoute) {
      const { full_name, password } = body;

      // 1. Buscar dados do convite para validar email e status prévio
      const { data: inv, error: invError } = await serviceClient
        .from('school_invitations')
        .select('id, email, status, expires_at, school_id, role_id')
        .eq('token_hash', tokenHash)
        .maybeSingle();

      if (invError || !inv) {
        return new Response(
          JSON.stringify({ ok: false, code: 'INVITATION_NOT_FOUND', message: 'Convite não encontrado.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (inv.status !== 'pending' || new Date(inv.expires_at) <= new Date()) {
        const msg = inv.status === 'accepted'
          ? 'Este convite já foi aceito anteriormente.'
          : inv.status === 'revoked'
            ? 'Este convite foi revogado.'
            : 'Este convite está expirado.';
        return new Response(
          JSON.stringify({ ok: false, code: 'INVITATION_INVALID', message: msg }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const normalizedInvEmail = inv.email.trim().toLowerCase();

      // 2. Verificar se o chamador está autenticado via header Bearer
      const authHeader = req.headers.get('Authorization');
      let targetUserId: string | null = null;
      let targetUserEmail: string | null = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const callerToken = authHeader.replace('Bearer ', '').trim();
        const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } }
        });

        const callerClaims = await verifyHs256Jwt(callerToken, SUPABASE_JWT_SECRET);
        if (callerClaims?.sub) {
          targetUserId = callerClaims.sub as string;
          targetUserEmail = (callerClaims.email as string) ?? null;
        } else {
          const { data: { user: callerUser } } = await callerClient.auth.getUser(callerToken);
          if (callerUser) {
            targetUserId = callerUser.id;
            targetUserEmail = callerUser.email ?? null;
          }
        }

        if (targetUserId && !targetUserEmail) {
          const { data: userData } = await serviceClient.auth.admin.getUserById(targetUserId);
          targetUserEmail = userData?.user?.email ?? null;
        }

        // C1: O e-mail da conta autenticada DEVE casar com o e-mail do convite
        if (targetUserEmail && targetUserEmail.trim().toLowerCase() !== normalizedInvEmail) {
          return new Response(
            JSON.stringify({
              ok: false,
              code: 'EMAIL_MISMATCH',
              message: `Você está autenticado como ${targetUserEmail}, mas este convite foi enviado para ${maskEmail(inv.email)}. Faça login com a conta correta para aceitar.`
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      let generatedSession = null;

      // 3. Se não estiver autenticado, precisa criar conta ou solicitar login
      if (!targetUserId) {
        if (!password || typeof password !== 'string' || password.length < 6) {
          return new Response(
            JSON.stringify({ ok: false, code: 'INVALID_PASSWORD', message: 'A senha deve conter no mínimo 6 caracteres.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Checar se já existe usuário cadastrado no Auth com esse e-mail
        const { data: userList } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existingAuthUser = userList?.users?.find(
          (u) => u.email?.trim().toLowerCase() === normalizedInvEmail
        );

        if (existingAuthUser) {
          return new Response(
            JSON.stringify({
              ok: false,
              code: 'USER_EXISTS_PLEASE_LOGIN',
              message: 'Já existe uma conta cadastrada com este e-mail. Por favor, faça login com sua senha para aceitar o convite.'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Criar usuário novo via service_role com email_confirm: true (C3)
        const userFullName = full_name?.trim() || normalizedInvEmail.split('@')[0];
        const { data: createdUserData, error: createError } = await serviceClient.auth.admin.createUser({
          email: normalizedInvEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: userFullName
          }
        });

        if (createError || !createdUserData?.user) {
          return new Response(
            JSON.stringify({ ok: false, code: 'CREATE_USER_FAILED', message: createError?.message || 'Falha ao criar conta de usuário.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        targetUserId = createdUserData.user.id;
        targetUserEmail = normalizedInvEmail;

        // Gerar sessão de autenticação imediatamente para o usuário novo
        const { data: signInData } = await serviceClient.auth.signInWithPassword({
          email: normalizedInvEmail,
          password: password
        });

        if (signInData?.session) {
          generatedSession = signInData.session;
        }
      }

      // 4. Invocar RPC atômica (FOR UPDATE, C5, C2, C1)
      const { data: rpcResult, error: rpcError } = await serviceClient.rpc('accept_school_invitation', {
        p_token_hash: tokenHash,
        p_user_id: targetUserId,
        p_user_email: targetUserEmail
      });

      if (rpcError) {
        return new Response(
          JSON.stringify({ ok: false, code: 'RPC_ERROR', message: rpcError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!rpcResult?.ok) {
        return new Response(
          JSON.stringify(rpcResult),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          ok: true,
          message: 'Convite aceito com sucesso! Bem-vindo(a) à equipe da escola.',
          school_id: rpcResult.school_id,
          session: generatedSession
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Endpoint não reconhecido' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
