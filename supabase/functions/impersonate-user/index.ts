import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { signHs256Jwt, verifyHs256Jwt } from '../_shared/jwt.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_JWT_SECRET =
  Deno.env.get('SUPABASE_JWT_SECRET') ??
  Deno.env.get('JWT_SECRET') ??
  'super-secret-jwt-token-with-at-least-32-characters-long';

const IMPERSONATION_TTL_SECONDS = 45 * 60; // 45 minutos

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

    // Validar sessão do chamador com Supabase Auth
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    const callerClaims = await verifyHs256Jwt(callerToken, SUPABASE_JWT_SECRET);
    if (!callerClaims || !callerClaims.sub) {
      return new Response(JSON.stringify({ error: 'Invalid or expired caller token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const callerSub = callerClaims.sub as string;

    // Validação de autoridade: Somente Platform Admin pode iniciar impersonation
    const { data: isPlatformAdmin, error: adminCheckError } = await callerClient.rpc('is_platform_admin');
    if (adminCheckError || !isPlatformAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: caller is not a platform admin' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validar payload
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { target_user_id, reason } = body;
    if (!target_user_id || typeof target_user_id !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing target_user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return new Response(JSON.stringify({ error: 'Reason must contain at least 5 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar dados do usuário alvo via Auth Admin API
    const { data: targetAuthUser, error: targetAuthError } = await serviceClient.auth.admin.getUserById(target_user_id);
    if (targetAuthError || !targetAuthUser?.user) {
      return new Response(JSON.stringify({ error: 'Target user not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar perfil do usuário alvo
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('full_name')
      .eq('id', target_user_id)
      .maybeSingle();

    const targetUserName = profile?.full_name || targetAuthUser.user.user_metadata?.full_name || null;

    // Buscar escola ativa do usuário alvo (se houver)
    const { data: member } = await serviceClient
      .from('school_members')
      .select('school_id')
      .eq('profile_id', target_user_id)
      .eq('status', 'active')
      .maybeSingle();

    const targetSchoolId = member?.school_id || null;

    // Inserir registro na trilha de auditoria
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || null;
    const userAgent = req.headers.get('user-agent') || null;

    const { data: auditLog, error: auditLogError } = await serviceClient
      .from('impersonation_audit_logs')
      .insert({
        super_admin_id: callerSub,
        target_user_id: target_user_id,
        target_user_email: targetAuthUser.user.email,
        target_user_name: targetUserName,
        target_school_id: targetSchoolId,
        reason: reason.trim(),
        ip_address: ipAddress,
        user_agent: userAgent,
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (auditLogError || !auditLog) {
      return new Response(JSON.stringify({ error: `Failed to create audit log: ${auditLogError?.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Cunhar JWT de impersonation assinado (Opção B)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + IMPERSONATION_TTL_SECONDS;

    const impersonationPayload = {
      iss: 'supabase',
      aud: 'authenticated',
      sub: target_user_id,
      role: 'authenticated',
      email: targetAuthUser.user.email,
      exp: expiresAt,
      iat: now,
      is_impersonated: true,
      impersonator_id: callerSub,
      impersonation_log_id: auditLog.id
    };

    const token = await signHs256Jwt(impersonationPayload, SUPABASE_JWT_SECRET);

    return new Response(
      JSON.stringify({
        token,
        expires_at: expiresAt,
        impersonation_log_id: auditLog.id,
        target_user: {
          id: target_user_id,
          email: targetAuthUser.user.email,
          full_name: targetUserName,
          school_id: targetSchoolId
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
