import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { invitationService } from './invitationService.js';

// Utilitário de máscara idêntico ao da Edge Function para validação de contrato C10
function maskEmail(email) {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

// Matriz de regras de negócio de autoridade (C4)
function evaluateInviteAuthority({ callerRole, isPlatformAdmin, targetRole, schoolStatus, callerEmail, inviteEmail }) {
  // C6: Escola deve estar active
  if (schoolStatus !== 'active') {
    return { allowed: false, status: 400, error: 'Apenas escolas com status ativo podem receber convites' };
  }

  // Trava de Auto-Convite
  if (callerEmail && inviteEmail && callerEmail.trim().toLowerCase() === inviteEmail.trim().toLowerCase()) {
    return { allowed: false, status: 400, error: 'Você não pode convidar o seu próprio e-mail' };
  }

  // Platform Admin tem autoridade irrestrita para qualquer papel
  if (isPlatformAdmin) {
    return { allowed: true };
  }

  // Membros comuns (secretary, gatekeeper) não podem convidar
  if (!['owner', 'administrator'].includes(callerRole)) {
    return { allowed: false, status: 403, error: 'Apenas Proprietários ou Administradores podem convidar membros' };
  }

  // Anti-escalada: Administrator não pode convidar Owner
  if (callerRole === 'administrator' && targetRole === 'owner') {
    return { allowed: false, status: 403, error: 'Administradores não possuem permissão para convidar um Proprietário (owner)' };
  }

  // Co-ownership: Owner pode convidar outro Owner
  if (callerRole === 'owner' && targetRole === 'owner') {
    return { allowed: true };
  }

  return { allowed: true };
}

// Validação de aceite de convite (C1, C2, C5)
function evaluateAcceptanceRules({ invEmail, invStatus, isExpired, existingMemberStatus, sessionEmail }) {
  if (invStatus === 'accepted') {
    return { ok: false, code: 'ALREADY_ACCEPTED', error: 'Este convite já foi aceito anteriormente' };
  }

  if (invStatus === 'revoked') {
    return { ok: false, code: 'REVOKED', error: 'Este convite foi revogado' };
  }

  if (invStatus !== 'pending' || isExpired) {
    return { ok: false, code: 'EXPIRED', error: 'Este convite expirou' };
  }

  // C1: E-mail autenticado deve casar com o convite
  if (sessionEmail && sessionEmail.trim().toLowerCase() !== invEmail.trim().toLowerCase()) {
    return { ok: false, code: 'EMAIL_MISMATCH', error: 'O e-mail da conta não corresponde ao e-mail deste convite' };
  }

  // C2: Membro inativo rejeitado sem reativação automática
  if (existingMemberStatus === 'inactive') {
    return { ok: false, code: 'INACTIVE_MEMBER', error: 'Este usuário possui vínculo inativo com a escola' };
  }

  if (existingMemberStatus === 'active') {
    return { ok: false, code: 'ALREADY_ACTIVE_MEMBER', error: 'Este usuário já é membro ativo desta instituição' };
  }

  return { ok: true };
}

describe('Ciclo B — Provisionamento e Convite de Membros (Unit & Contract Tests)', () => {

  describe('C10 — Mascaramento Seguro de E-mail (Sem Enumeração)', () => {
    it('Mascara e-mail comum de forma consistente', () => {
      assert.strictEqual(maskEmail('wesley@escola.com.br'), 'w***y@escola.com.br');
      assert.strictEqual(maskEmail('mariadasilva@gmail.com'), 'm***a@gmail.com');
    });

    it('Mascara e-mails curtos com segurança', () => {
      assert.strictEqual(maskEmail('ab@dominio.com'), 'a***@dominio.com');
      assert.strictEqual(maskEmail('x@dominio.com'), 'x***@dominio.com');
    });
  });

  describe('C4 & Anti-Escalada — Matriz de Autoridade do Servidor', () => {
    it('Platform Admin pode convidar qualquer papel em escola ativa', () => {
      for (const role of ['owner', 'administrator', 'secretary', 'gatekeeper']) {
        const res = evaluateInviteAuthority({
          callerRole: null,
          isPlatformAdmin: true,
          targetRole: role,
          schoolStatus: 'active',
          callerEmail: 'admin@ses.com',
          inviteEmail: 'novo@escola.com'
        });
        assert.strictEqual(res.allowed, true);
      }
    });

    it('Owner pode convidar outro Owner (Co-ownership permitido)', () => {
      const res = evaluateInviteAuthority({
        callerRole: 'owner',
        isPlatformAdmin: false,
        targetRole: 'owner',
        schoolStatus: 'active',
        callerEmail: 'diretor@escola.com',
        inviteEmail: 'co-diretor@escola.com'
      });
      assert.strictEqual(res.allowed, true);
    });

    it('Administrator NÃO pode convidar Owner (Anti-escalada obrigatória)', () => {
      const res = evaluateInviteAuthority({
        callerRole: 'administrator',
        isPlatformAdmin: false,
        targetRole: 'owner',
        schoolStatus: 'active',
        callerEmail: 'coord@escola.com',
        inviteEmail: 'dono@escola.com'
      });
      assert.strictEqual(res.allowed, false);
      assert.strictEqual(res.status, 403);
      assert.match(res.error, /não possuem permissão para convidar um Proprietário/i);
    });

    it('Administrator pode convidar secretary, gatekeeper e administrator', () => {
      for (const role of ['administrator', 'secretary', 'gatekeeper']) {
        const res = evaluateInviteAuthority({
          callerRole: 'administrator',
          isPlatformAdmin: false,
          targetRole: role,
          schoolStatus: 'active',
          callerEmail: 'coord@escola.com',
          inviteEmail: 'outro@escola.com'
        });
        assert.strictEqual(res.allowed, true);
      }
    });

    it('Secretary e Gatekeeper recebem 403 Forbidden ao tentar convidar', () => {
      for (const role of ['secretary', 'gatekeeper']) {
        const res = evaluateInviteAuthority({
          callerRole: role,
          isPlatformAdmin: false,
          targetRole: 'secretary',
          schoolStatus: 'active',
          callerEmail: 'operador@escola.com',
          inviteEmail: 'alvo@escola.com'
        });
        assert.strictEqual(res.allowed, false);
        assert.strictEqual(res.status, 403);
      }
    });
  });

  describe('Trava de Auto-Convite', () => {
    it('Bloqueia usuário tentando convidar seu próprio e-mail', () => {
      const res = evaluateInviteAuthority({
        callerRole: 'owner',
        isPlatformAdmin: false,
        targetRole: 'secretary',
        schoolStatus: 'active',
        callerEmail: 'gestor@escola.com',
        inviteEmail: 'gestor@escola.com'
      });
      assert.strictEqual(res.allowed, false);
      assert.strictEqual(res.status, 400);
      assert.match(res.error, /não pode convidar o seu próprio e-mail/i);
    });

    it('Bloqueia auto-convite mesmo com maiúsculas/espaços', () => {
      const res = evaluateInviteAuthority({
        callerRole: 'owner',
        isPlatformAdmin: false,
        targetRole: 'secretary',
        schoolStatus: 'active',
        callerEmail: 'gestor@escola.com',
        inviteEmail: '  GESTOR@escola.com  '
      });
      assert.strictEqual(res.allowed, false);
      assert.match(res.error, /não pode convidar o seu próprio e-mail/i);
    });
  });

  describe('C6 — Validação de Status Ativo da Escola', () => {
    it('Rejeita convite quando a escola está suspended ou inactive', () => {
      for (const status of ['suspended', 'inactive', 'draft']) {
        const res = evaluateInviteAuthority({
          callerRole: 'owner',
          isPlatformAdmin: false,
          targetRole: 'secretary',
          schoolStatus: status,
          callerEmail: 'gestor@escola.com',
          inviteEmail: 'novo@escola.com'
        });
        assert.strictEqual(res.allowed, false);
        assert.strictEqual(res.status, 400);
        assert.match(res.error, /Apenas escolas com status ativo/i);
      }
    });
  });

  describe('C1, C2, C5 — Regras de Aceite e Transição Atômica', () => {
    it('C1: Rejeita aceite quando a sessão autenticada possui e-mail divergente do convite', () => {
      const res = evaluateAcceptanceRules({
        invEmail: 'convidado@escola.com',
        invStatus: 'pending',
        isExpired: false,
        existingMemberStatus: null,
        sessionEmail: 'outro.usuario@gmail.com'
      });
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.code, 'EMAIL_MISMATCH');
      assert.match(res.error, /O e-mail da conta não corresponde/i);
    });

    it('C1: Aceita quando o e-mail da sessão casa perfeitamente (case-insensitive)', () => {
      const res = evaluateAcceptanceRules({
        invEmail: 'convidado@escola.com',
        invStatus: 'pending',
        isExpired: false,
        existingMemberStatus: null,
        sessionEmail: '  CONVIDADO@ESCOLA.COM '
      });
      assert.strictEqual(res.ok, true);
    });

    it('C2: Rejeita membro existente com status="inactive" sem reativação automática', () => {
      const res = evaluateAcceptanceRules({
        invEmail: 'ex-membro@escola.com',
        invStatus: 'pending',
        isExpired: false,
        existingMemberStatus: 'inactive',
        sessionEmail: 'ex-membro@escola.com'
      });
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.code, 'INACTIVE_MEMBER');
      assert.match(res.error, /vínculo inativo com a escola/i);
    });

    it('Rejeita quando já é membro ativo na instituição', () => {
      const res = evaluateAcceptanceRules({
        invEmail: 'ativo@escola.com',
        invStatus: 'pending',
        isExpired: false,
        existingMemberStatus: 'active',
        sessionEmail: 'ativo@escola.com'
      });
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.code, 'ALREADY_ACTIVE_MEMBER');
      assert.match(res.error, /já é membro ativo/i);
    });

    it('Rejeita convite já aceito anteriormente', () => {
      const res = evaluateAcceptanceRules({
        invEmail: 'alvo@escola.com',
        invStatus: 'accepted',
        isExpired: false,
        existingMemberStatus: null,
        sessionEmail: null
      });
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.code, 'ALREADY_ACCEPTED');
    });

    it('Rejeita convite revogado pela gestão', () => {
      const res = evaluateAcceptanceRules({
        invEmail: 'alvo@escola.com',
        invStatus: 'revoked',
        isExpired: false,
        existingMemberStatus: null,
        sessionEmail: null
      });
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.code, 'REVOKED');
    });

    it('Rejeita convite com data de expiração ultrapassada', () => {
      const res = evaluateAcceptanceRules({
        invEmail: 'alvo@escola.com',
        invStatus: 'pending',
        isExpired: true,
        existingMemberStatus: null,
        sessionEmail: null
      });
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.code, 'EXPIRED');
    });
  });

  describe('invitationService — Validações de Entrada na DAL', () => {
    it('Rejeita chamada de convite com schoolId ausente', async () => {
      const res = await invitationService.inviteMember({ schoolId: '', email: 'teste@escola.com', role: 'secretary' });
      assert.strictEqual(res.data, null);
      assert.match(res.error.message, /Identificador da instituição não informado/i);
    });

    it('Rejeita chamada com e-mail inválido', async () => {
      const res = await invitationService.inviteMember({ schoolId: 'uuid-1', email: 'email_sem_arroba', role: 'secretary' });
      assert.strictEqual(res.data, null);
      assert.match(res.error.message, /Informe um endereço de e-mail válido/i);
    });

    it('Rejeita validação de token vazio ou nulo', async () => {
      const res = await invitationService.validateInvite('');
      assert.strictEqual(res.data, null);
      assert.match(res.error.message, /Token de convite não informado/i);
    });

    it('Rejeita confirmação de aceite com token vazio', async () => {
      const res = await invitationService.acceptInvite({ token: '', fullName: 'João', password: 'secretpassword' });
      assert.strictEqual(res.data, null);
      assert.match(res.error.message, /Token de convite não informado/i);
    });
  });

});
