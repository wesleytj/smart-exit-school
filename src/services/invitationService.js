import { supabase } from '../lib/supabase.js';
import { schoolInvitationRepository } from '../repositories/schoolInvitationRepository.js';
import { schoolMemberRepository } from '../repositories/schoolMemberRepository.js';

const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
const nodeEnv = typeof globalThis !== 'undefined' && globalThis.process ? globalThis.process.env : undefined;

const supabaseUrl = metaEnv?.VITE_SUPABASE_URL || nodeEnv?.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = metaEnv?.VITE_SUPABASE_ANON_KEY || nodeEnv?.VITE_SUPABASE_ANON_KEY || 'anon-key';

export const invitationService = {
  /**
   * Consulta os convites registrados para a escola (RLS restrito a gestores e platform admin)
   */
  async listInvitations(schoolId) {
    return await schoolInvitationRepository.listBySchool(schoolId);
  },

  /**
   * Consulta a lista de membros ativos e inativos da escola
   */
  async listMembers(schoolId) {
    return await schoolMemberRepository.listBySchool(schoolId);
  },

  /**
   * Dispara o envio ou reenvio de convite para a Edge Function invite-member
   */
  async inviteMember({ schoolId, email, role }) {
    if (!schoolId) {
      return { data: null, error: new Error('Identificador da instituição não informado.') };
    }
    if (!email || !email.includes('@')) {
      return { data: null, error: new Error('Informe um endereço de e-mail válido.') };
    }
    if (!role) {
      return { data: null, error: new Error('Papel do membro não informado.') };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (sessionError || !token) {
      return { data: null, error: new Error('Sessão expirada. Faça login novamente.') };
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/invite-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          school_id: schoolId,
          email: email.trim().toLowerCase(),
          role: role.trim().toLowerCase()
        })
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { data: null, error: new Error(json.error || `Erro HTTP ${response.status} ao enviar convite.`) };
      }

      return { data: json, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  /**
   * Revoga um convite pendente
   */
  async revokeInvitation(invitationId) {
    if (!invitationId) {
      return { data: null, error: new Error('Identificador do convite não informado.') };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (sessionError || !token) {
      return { data: null, error: new Error('Sessão expirada. Faça login novamente.') };
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/invite-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          action: 'revoke',
          invitation_id: invitationId
        })
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { data: null, error: new Error(json.error || `Erro HTTP ${response.status} ao revogar convite.`) };
      }

      return { data: json, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  /**
   * Valida publicamente um token de convite via accept-invite/validate
   */
  async validateInvite(token) {
    if (!token || typeof token !== 'string') {
      return { data: null, error: new Error('Token de convite não informado.') };
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/accept-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          action: 'validate',
          token: token.trim()
        })
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { data: json, error: new Error(json.message || json.error || `Erro ao validar convite.`) };
      }

      return { data: json, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  /**
   * Confirma o aceite do convite via accept-invite/confirm
   */
  async acceptInvite({ token, fullName, password }) {
    if (!token || typeof token !== 'string') {
      return { data: null, error: new Error('Token de convite não informado.') };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const userToken = sessionData?.session?.access_token;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey
    };

    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/accept-invite`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'confirm',
          token: token.trim(),
          full_name: fullName?.trim() || undefined,
          password: password || undefined
        })
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json.ok) {
        const errorMsg = json.message || json.error || `Erro ao confirmar convite.`;
        return { data: json, error: new Error(errorMsg) };
      }

      // Se a função retornou uma nova sessão (usuário recém-criado), inicializa no Supabase client
      if (json.session?.access_token && json.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: json.session.access_token,
          refresh_token: json.session.refresh_token
        });
      }

      return { data: json, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }
};
