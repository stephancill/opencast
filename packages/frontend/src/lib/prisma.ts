import { PrismaClient } from '@selekt/db';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: ['query', 'info', 'warn']
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
