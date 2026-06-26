import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16).default('change-me-in-local-dev'),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_ORIGIN: z.string().default('http://localhost:8082'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Level Loop <onboarding@resend.dev>'),
  APP_NAME: z.string().default('Level Loop'),
  /** En desarrollo, reenvía todos los correos a esta dirección (cuenta Resend). */
  EMAIL_DEV_REDIRECT_TO: z.string().email().optional(),
  /** Si Resend rechaza el destinatario (modo prueba), registra el código en consola y continúa. */
  EMAIL_DEV_FALLBACK: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  /** En desarrollo, devuelve el código en la respuesta API para probar en el celular. */
  EMAIL_EXPOSE_DEV_CODE: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  EMAIL_DEV_FALLBACK:
    parsed.EMAIL_DEV_FALLBACK ?? process.env.NODE_ENV !== 'production',
  EMAIL_EXPOSE_DEV_CODE:
    parsed.EMAIL_EXPOSE_DEV_CODE ?? process.env.NODE_ENV !== 'production',
};
