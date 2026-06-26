import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  return new PrismaClient();
}

const cached = globalForPrisma.prisma;
const staleClient =
  cached &&
  typeof (cached as PrismaClient & { authVerificationCode?: unknown }).authVerificationCode ===
    'undefined';

export const prisma = staleClient || !cached ? createPrismaClient() : cached;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
