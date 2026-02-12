export type PrismaConfig = {
  datasourceUrl?: string;
};

export const prismaConfig: PrismaConfig = {
  datasourceUrl: process.env.DATABASE_URL,
};

export default prismaConfig;
