import nodemailer from 'npm:nodemailer@6.9.16';

interface SendInviteParams {
  to: string;
  schoolName: string;
  roleName: string;
  inviteLink: string;
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  owner: 'Proprietário(a) / Gestor Geral',
  administrator: 'Administrador(a) Escolar',
  secretary: 'Secretaria Escolar',
  gatekeeper: 'Operador(a) de Portaria'
};

export async function sendInviteEmail({
  to,
  schoolName,
  roleName,
  inviteLink
}: SendInviteParams): Promise<{ ok: boolean; error?: string }> {
  const host = Deno.env.get('BREVO_SMTP_HOST') || 'smtp-relay.brevo.com';
  const port = Number(Deno.env.get('BREVO_SMTP_PORT') || '587');
  const user = Deno.env.get('BREVO_SMTP_USER') || '';
  const pass = Deno.env.get('BREVO_SMTP_PASS') || '';
  const from = Deno.env.get('BREVO_FROM') || 'Smart Exit School <noreply@smartexitschool.com>';

  const displayRole = ROLE_DISPLAY_NAMES[roleName] || roleName;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Convite para a equipe escolar — ${schoolName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="560px" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #ea580c; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Smart Exit School</h1>
              <p style="margin: 6px 0 0; color: #ffedd5; font-size: 13px;">Gestão e Saída Escolar Inteligente</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a;">Você foi convidado(a)!</h2>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
                Você foi convidado(a) para fazer parte da equipe de <strong>${schoolName}</strong> no Smart Exit School com o papel de <strong>${displayRole}</strong>.
              </p>
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px 24px; margin-bottom: 28px;">
                <p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Instituição:</strong> ${schoolName}</p>
                <p style="margin: 6px 0 0; font-size: 13px; color: #64748b;"><strong>Papel atribuído:</strong> ${displayRole}</p>
                <p style="margin: 6px 0 0; font-size: 13px; color: #64748b;"><strong>Validade:</strong> 7 dias a partir do envio</p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteLink}" style="display: inline-block; background-color: #ea580c; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);">
                  Aceitar Convite e Acessar
                </a>
              </div>
              <p style="margin: 28px 0 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                Caso o botão não funcione, copie e cole o link abaixo em seu navegador:<br>
                <span style="color: #ea580c; word-break: break-all;">${inviteLink}</span>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                Se você não esperava este convite, ignore esta mensagem com segurança.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Você foi convidado(a) para fazer parte da equipe de ${schoolName} no Smart Exit School!
Papel: ${displayRole}
Validade: 7 dias

Para aceitar o convite e configurar seu acesso, acesse o link:
${inviteLink}

Se você não esperava este convite, ignore esta mensagem.
  `.trim();

  // Se não houver credenciais SMTP configuradas (ex.: mock local ou ambiente sem secret):
  if (!user || !pass) {
    console.warn(`[BREVO_SMTP_LOCAL_MOCK] Credentials not configured. Simulating delivery to ${to}`);
    return { ok: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });

    await transporter.sendMail({
      from,
      to,
      subject: `Convite para a equipe escolar — ${schoolName}`,
      html,
      text
    });

    return { ok: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[BREVO_SMTP_ERROR] Failed to send email to ${to}:`, errorMsg);

    // Fallback: tentar Brevo REST API se pass for uma API Key
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': pass,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Smart Exit School', email: from.includes('<') ? from.split('<')[1].replace('>', '').trim() : from },
          to: [{ email: to }],
          subject: `Convite para a equipe escolar — ${schoolName}`,
          htmlContent: html,
          textContent: text
        })
      });

      if (response.ok) {
        return { ok: true };
      }
    } catch {
      // Ignorar fallback se também falhar
    }

    return { ok: false, error: errorMsg };
  }
}
