import { createHash, randomInt } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { env } from '../lib/env.js';
import { sendVerificationCodeEmail } from '../lib/email.js';
import {
  consumeAuthVerificationCode,
  issueAuthVerificationCode,
  type RegisterVerificationPayload,
} from '../lib/authVerification.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
const router = Router();

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  bio: true,
  dailyGoalMin: true,
  interests: true,
  onboardingDone: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const authUserSelect = {
  ...publicUserSelect,
  passwordHash: true,
} satisfies Prisma.UserSelect;

const registerSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(80).optional(),
});

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

const updateMeSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(200).optional(),
  dailyGoalMin: z.number().int().min(5).max(240).optional(),
  interests: z.array(z.string().trim().min(1)).max(20).optional(),
  onboardingDone: z.boolean().optional(),
});

const passwordResetSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
});

const passwordResetConfirmSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  code: z.string().regex(/^\d{6}$/, 'Invalid verification code'),
  password: z.string().min(8),
});

const verifyCodeSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  code: z.string().regex(/^\d{6}$/, 'Invalid verification code'),
});

const CODE_TTL_MS = 15 * 60 * 1000;

function formatAuthRouteError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Unexpected server error';
  }
  const msg = error.message;
  if (msg.includes('testing emails') || msg.includes('verify a domain')) {
    return 'No se pudo enviar el correo a esa dirección. Usa un email permitido o verifica tu dominio en Resend.';
  }
  if (msg.includes('deleteMany') || msg.includes('authVerificationCode')) {
    return 'Error interno de verificación. Reinicia el backend e intenta de nuevo.';
  }
  return process.env.NODE_ENV !== 'production' ? msg : 'Unexpected server error';
}

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '30d' });
}

function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}

function hashVerificationCode(code: string, userId: string): string {
  return createHash('sha256').update(`${code}:${userId}:${env.JWT_SECRET}`).digest('hex');
}

router.post('/register/request-code', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', issues: parsed.error.flatten() });
    }

    const { email, password, name } = parsed.data;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const payload: RegisterVerificationPayload = {
      passwordHash,
      name: name?.trim() || email.split('@')[0] || 'Cadete',
    };

    const delivery = await issueAuthVerificationCode({
      email,
      purpose: 'register',
      payload,
    });

    return res.json({
      ok: true,
      message: delivery.emailSent
        ? 'Verification code sent to your email.'
        : 'Verification code generated. Check backend console or dev hint in the app.',
      ...(delivery.devCode ? { devCode: delivery.devCode } : {}),
    });
  } catch (error) {
    console.error('[register/request-code]', error);
    return res.status(500).json({ error: formatAuthRouteError(error) });
  }
});

router.post('/register/verify-code', async (req, res) => {
  try {
    const parsed = verifyCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', issues: parsed.error.flatten() });
    }

    const { email, code } = parsed.data;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const row = await consumeAuthVerificationCode({
      email,
      purpose: 'register',
      code,
    });

    if (!row?.payload) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const payload = row.payload as RegisterVerificationPayload;
    const createdUser = await prisma.user.create({
      data: {
        email,
        passwordHash: payload.passwordHash,
        name: payload.name,
        progress: { create: {} },
      },
      select: publicUserSelect,
    });

    return res.status(201).json({
      user: createdUser,
      token: signToken(createdUser.id),
    });
  } catch (error) {
    console.error('[register/verify-code]', error);
    const message =
      process.env.NODE_ENV !== 'production' && error instanceof Error
        ? error.message
        : 'Unexpected server error';
    return res.status(500).json({ error: message });
  }
});

router.post('/login/request-code', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', issues: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email },
      select: authUserSelect,
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const delivery = await issueAuthVerificationCode({
      email,
      purpose: 'login',
    });

    return res.json({
      ok: true,
      message: delivery.emailSent
        ? 'Verification code sent to your email.'
        : 'Verification code generated. Check backend console or dev hint in the app.',
      ...(delivery.devCode ? { devCode: delivery.devCode } : {}),
    });
  } catch (error) {
    console.error('[login/request-code]', error);
    return res.status(500).json({ error: formatAuthRouteError(error) });
  }
});

router.post('/login/verify-code', async (req, res) => {
  try {
    const parsed = verifyCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', issues: parsed.error.flatten() });
    }

    const { email, code } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email },
      select: authUserSelect,
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const row = await consumeAuthVerificationCode({
      email,
      purpose: 'login',
      code,
    });

    if (!row) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const { passwordHash: _passwordHash, ...publicUser } = user;
    return res.json({ user: publicUser, token: signToken(user.id) });
  } catch (error) {
    console.error('[login/verify-code]', error);
    const message =
      process.env.NODE_ENV !== 'production' && error instanceof Error
        ? error.message
        : 'Unexpected server error';
    return res.status(500).json({ error: message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', issues: parsed.error.flatten() });
    }

    const { email, password, name } = parsed.data;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const createdUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name?.trim() || email.split('@')[0] || 'Cadete',
        progress: { create: {} },
      },
      select: publicUserSelect,
    });

    return res.status(201).json({
      user: createdUser,
      token: signToken(createdUser.id),
    });
  } catch (error) {
    console.error('[register]', error);
    const message =
      process.env.NODE_ENV !== 'production' && error instanceof Error
        ? error.message
        : 'Unexpected server error';
    return res.status(500).json({ error: message });
  }
});

router.post('/login', async (_req, res) => {
  return res.status(400).json({
    error: 'Email verification required. Use /auth/login/request-code first.',
  });
});

router.post('/password-reset', async (req, res) => {
  try {
    const parsed = passwordResetSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', issues: parsed.error.flatten() });
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const code = generateVerificationCode();
      const tokenHash = hashVerificationCode(code, user.id);
      const expiresAt = new Date(Date.now() + CODE_TTL_MS);

      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const emailResult = await sendVerificationCodeEmail({
        to: email,
        code,
        purpose: 'password-reset',
      });

      return res.json({
        ok: true,
        message: 'If the account exists, a verification code was sent.',
        ...(emailResult.devLogged && env.EMAIL_EXPOSE_DEV_CODE ? { devCode: code } : {}),
      });
    }

    return res.json({
      ok: true,
      message: 'If the account exists, a verification code was sent.',
    });
  } catch (error) {
    console.error('[password-reset]', error);
    const message =
      process.env.NODE_ENV !== 'production' && error instanceof Error
        ? error.message
        : 'Unexpected server error';
    return res.status(500).json({ error: message });
  }
});

router.post('/password-reset/confirm', async (req, res) => {
  try {
    const parsed = passwordResetConfirmSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', issues: parsed.error.flatten() });
    }

    const { email, code, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const tokenHash = hashVerificationCode(code, user.id);
    const resetRow = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetRow) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRow.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          usedAt: null,
          id: { not: resetRow.id },
        },
      }),
    ]);

    return res.json({ ok: true });
  } catch (error) {
    console.error('[password-reset/confirm]', error);
    const message =
      process.env.NODE_ENV !== 'production' && error instanceof Error
        ? error.message
        : 'Unexpected server error';
    return res.status(500).json({ error: message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ user });
});

router.patch('/me', requireAuth, async (req, res) => {
  const { userId } = req as AuthedRequest;
  const parsed = updateMeSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body', issues: parsed.error.flatten() });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.bio !== undefined ? { bio: parsed.data.bio } : {}),
      ...(parsed.data.dailyGoalMin !== undefined ? { dailyGoalMin: parsed.data.dailyGoalMin } : {}),
      ...(parsed.data.interests !== undefined ? { interests: parsed.data.interests } : {}),
      ...(parsed.data.onboardingDone !== undefined ? { onboardingDone: parsed.data.onboardingDone } : {}),
    },
    select: publicUserSelect,
  });

  return res.json({ user: updatedUser });
});

export { router as authRouter };
