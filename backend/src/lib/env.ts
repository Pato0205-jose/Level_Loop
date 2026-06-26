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
});

export const env = envSchema.parse(process.env);
