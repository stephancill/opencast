import { PrismaClient } from '@selekt/db';
import { isProduction } from './env';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'info', 'warn']
  });

if (isProduction) globalForPrisma.prisma = prisma;
