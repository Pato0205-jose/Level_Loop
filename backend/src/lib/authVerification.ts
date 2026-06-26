import { createHash, randomInt } from 'node:crypto';
import { prisma } from './prisma.js';
import { env } from './env.js';
import { sendVerificationCodeEmail } from './email.js';

export type AuthVerificationPurpose = 'login' | 'register';

export type RegisterVerificationPayload = {
  passwordHash: string;
  name: string;
};

const CODE_TTL_MS = 15 * 60 * 1000;

export function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}

export function hashAuthVerificationCode(
  code: string,
  purpose: AuthVerificationPurpose,
  email: string,
): string {
  return createHash('sha256')
    .update(`${code}:${purpose}:${email}:${env.JWT_SECRET}`)
    .digest('hex');
}

export async function issueAuthVerificationCode(input: {
  email: string;
  purpose: AuthVerificationPurpose;
  payload?: RegisterVerificationPayload;
}): Promise<{ emailSent: boolean; devCode?: string }> {
  const code = generateVerificationCode();
  const tokenHash = hashAuthVerificationCode(code, input.purpose, input.email);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await prisma.authVerificationCode.deleteMany({
    where: {
      email: input.email,
      purpose: input.purpose,
      usedAt: null,
    },
  });

  await prisma.authVerificationCode.create({
    data: {
      email: input.email,
      purpose: input.purpose,
      tokenHash,
      payload: input.payload,
      expiresAt,
    },
  });

  const emailResult = await sendVerificationCodeEmail({
    to: input.email,
    code,
    purpose: input.purpose,
  });

  return {
    emailSent: emailResult.sent,
    devCode:
      emailResult.devLogged && env.EMAIL_EXPOSE_DEV_CODE ? code : undefined,
  };
}

export async function consumeAuthVerificationCode(input: {
  email: string;
  purpose: AuthVerificationPurpose;
  code: string;
}) {
  const tokenHash = hashAuthVerificationCode(
    input.code,
    input.purpose,
    input.email,
  );

  const row = await prisma.authVerificationCode.findFirst({
    where: {
      email: input.email,
      purpose: input.purpose,
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!row) {
    return null;
  }

  await prisma.authVerificationCode.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });

  await prisma.authVerificationCode.deleteMany({
    where: {
      email: input.email,
      purpose: input.purpose,
      usedAt: null,
      id: { not: row.id },
    },
  });

  return row;
}
