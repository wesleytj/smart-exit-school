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

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || !body.impersonation_log_id) {
      return new Response(JSON.stringify({ error: 'Missing impersonation_log_id in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { impersonation_log_id } = body;

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    let callerSub: string | null = null;
    let isMatchingImpersonatedSession = false;

    // 1. Tentar validação como token de suporte interno cunhado (HS256)
    const callerClaims = await verifyHs256Jwt(callerToken, SUPABASE_JWT_SECRET);
    if (callerClaims?.sub) {
      callerSub = callerClaims.sub as string;
      if (
        callerClaims.is_impersonated === true &&
        callerClaims.impersonation_log_id === impersonation_log_id
      ) {
        isMatchingImpersonatedSession = true;
      }
    } else {
      // 2. Se não for HS256, validar via Supabase Auth (suporta tokens ES256 e outros do GoTrue)
      const { data: { user: callerUser }, error: callerError } = await callerClient.auth.getUser(callerToken);
      if (!callerError && callerUser) {
        callerSub = callerUser.id;
      }
    }

    if (!callerSub) {
      return new Response(JSON.stringify({ error: 'Invalid or expired caller token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: isPlatformAdmin } = await callerClient.rpc('is_platform_admin');

    if (!isPlatformAdmin && !isMatchingImpersonatedSession) {
      return new Response(JSON.stringify({ error: 'Forbidden: unauthorized to end this impersonation session' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const endedAt = new Date().toISOString();
    const { data: updatedLog, error: updateError } = await serviceClient
      .from('impersonation_audit_logs')
      .update({ ended_at: endedAt })
      .eq('id', impersonation_log_id)
      .select('id, started_at, ended_at')
      .single();

    if (updateError || !updatedLog) {
      return new Response(JSON.stringify({ error: `Failed to update audit log: ${updateError?.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        impersonation_log_id: updatedLog.id,
        started_at: updatedLog.started_at,
        ended_at: updatedLog.ended_at
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
