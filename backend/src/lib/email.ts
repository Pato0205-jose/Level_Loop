import { Resend } from 'resend';
import { env } from './env.js';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

function buildVerificationEmailHtml(code: string, purpose: 'password-reset'): string {
  const title =
    purpose === 'password-reset'
      ? 'Recupera tu acceso a Level Loop'
      : 'Verifica tu correo en Level Loop';

  const body =
    purpose === 'password-reset'
      ? 'Usa este código para restablecer tu contraseña. Expira en 15 minutos.'
      : 'Usa este código para verificar tu correo. Expira en 15 minutos.';

  return `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background:#120f1f;font-family:Arial,sans-serif;color:#f5f0ff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#201d32;border-radius:16px;border:1px solid #3d2f55;">
            <tr>
              <td style="padding:32px 28px;text-align:center;">
                <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#9bd0ff;">${env.APP_NAME}</p>
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#ffffff;">${title}</h1>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.5;color:#c8bfd9;">${body}</p>
                <div style="display:inline-block;padding:18px 28px;border-radius:12px;background:linear-gradient(135deg,#6b4eff,#51d5ff);">
                  <span style="font-size:32px;font-weight:700;letter-spacing:0.35em;color:#ffffff;">${code}</span>
                </div>
                <p style="margin:28px 0 0;font-size:13px;line-height:1.5;color:#948ea0;">
                  Si no solicitaste este código, puedes ignorar este correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendVerificationCodeEmail(input: {
  to: string;
  code: string;
  purpose: 'password-reset';
}): Promise<{ sent: boolean; devLogged: boolean }> {
  const subject =
    input.purpose === 'password-reset'
      ? `${env.APP_NAME} — Código de recuperación: ${input.code}`
      : `${env.APP_NAME} — Código de verificación: ${input.code}`;

  const html = buildVerificationEmailHtml(input.code, input.purpose);
  const client = getResendClient();

  if (!client) {
    console.log(`[email:dev] ${input.to} -> código ${input.code} (${input.purpose})`);
    return { sent: false, devLogged: true };
  }

  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message || 'No se pudo enviar el correo.');
  }

  return { sent: true, devLogged: false };
}
