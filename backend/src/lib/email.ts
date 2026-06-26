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

function isResendRecipientBlocked(message: string): boolean {
  return (
    message.includes('testing emails') ||
    message.includes('verify a domain') ||
    message.includes('not verified') ||
    message.includes('domain is not verified')
  );
}

function resolveSendTarget(intendedTo: string): {
  sendTo: string;
  devRedirect: boolean;
} {
  const normalized = intendedTo.trim().toLowerCase();
  const redirect = env.EMAIL_DEV_REDIRECT_TO?.trim().toLowerCase();

  if (
    redirect &&
    process.env.NODE_ENV !== 'production' &&
    normalized !== redirect
  ) {
    return { sendTo: redirect, devRedirect: true };
  }

  return { sendTo: normalized, devRedirect: false };
}

function logDevVerificationCode(input: {
  to: string;
  code: string;
  purpose: 'password-reset' | 'login' | 'register';
  reason: string;
  intendedTo?: string;
}) {
  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log(`[email:dev] ${input.reason}`);
  if (input.intendedTo && input.intendedTo !== input.to) {
    console.log(`  Solicitado: ${input.intendedTo}`);
    console.log(`  Enviado a:  ${input.to}`);
  } else {
    console.log(`  Para:    ${input.to}`);
  }
  console.log(`  Código:  ${input.code}`);
  console.log(`  Uso:     ${input.purpose}`);
  console.log('══════════════════════════════════════════════════════');
  console.log('');
}

function buildVerificationEmailHtml(
  code: string,
  purpose: 'password-reset' | 'login' | 'register',
  intendedTo?: string,
): string {
  const title =
    purpose === 'password-reset'
      ? 'Recupera tu acceso a Level Loop'
      : purpose === 'login'
        ? 'Código para iniciar sesión'
        : 'Verifica tu cuenta en Level Loop';

  const body =
    purpose === 'password-reset'
      ? 'Usa este código para restablecer tu contraseña. Expira en 15 minutos.'
      : purpose === 'login'
        ? 'Usa este código para completar tu inicio de sesión. Expira en 15 minutos.'
        : 'Usa este código para confirmar tu registro. Expira en 15 minutos.';

  const devNote =
    intendedTo && intendedTo !== env.EMAIL_DEV_REDIRECT_TO
      ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#ffd27f;background:rgba(255,210,127,0.12);padding:12px 14px;border-radius:10px;">
          Modo prueba: este código corresponde a <strong>${intendedTo}</strong>.
        </p>`
      : '';

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
                ${devNote}
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

export type SendVerificationCodeResult = {
  sent: boolean;
  devLogged: boolean;
};

export async function sendVerificationCodeEmail(input: {
  to: string;
  code: string;
  purpose: 'password-reset' | 'login' | 'register';
}): Promise<SendVerificationCodeResult> {
  const intendedTo = input.to.trim().toLowerCase();
  const { sendTo, devRedirect } = resolveSendTarget(intendedTo);

  const subject =
    devRedirect
      ? `${env.APP_NAME} — Código para ${intendedTo}: ${input.code}`
      : input.purpose === 'password-reset'
        ? `${env.APP_NAME} — Código de recuperación: ${input.code}`
        : input.purpose === 'login'
          ? `${env.APP_NAME} — Código de inicio de sesión: ${input.code}`
          : `${env.APP_NAME} — Código de verificación: ${input.code}`;

  const html = buildVerificationEmailHtml(
    input.code,
    input.purpose,
    devRedirect ? intendedTo : undefined,
  );
  const client = getResendClient();

  if (!client) {
    logDevVerificationCode({
      to: sendTo,
      intendedTo,
      code: input.code,
      purpose: input.purpose,
      reason: 'Sin RESEND_API_KEY — código solo en consola',
    });
    return { sent: false, devLogged: true };
  }

  if (devRedirect) {
    console.log(
      `[email:redirect] ${intendedTo} -> ${sendTo} (${input.purpose})`,
    );
  }

  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: sendTo,
    subject,
    html,
  });

  if (error) {
    const message = error.message || 'No se pudo enviar el correo.';
    if (env.EMAIL_DEV_FALLBACK && isResendRecipientBlocked(message)) {
      logDevVerificationCode({
        to: sendTo,
        intendedTo,
        code: input.code,
        purpose: input.purpose,
        reason:
          'Resend en modo prueba no envió el correo. Revisa EMAIL_DEV_REDIRECT_TO o el código en consola.',
      });
      return { sent: false, devLogged: true };
    }
    throw new Error(message);
  }

  return { sent: true, devLogged: false };
}
