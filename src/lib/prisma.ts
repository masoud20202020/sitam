import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const isProd = process.env.NODE_ENV === 'production';

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: isProd ? [] : ['query'],
  });

if (!isProd) globalForPrisma.prisma = prisma;
