import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const DEFAULT_NEON_DATABASE_URL =
  "postgresql://neondb_owner:npg_d3JDH2ulKwIV@ep-damp-snow-a13riy99-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || DEFAULT_NEON_DATABASE_URL;
}

export function hasNeonDatabase(): boolean {
  const url = getDatabaseUrl();
  return url.startsWith('postgres://') || url.startsWith('postgresql://');
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = getDatabaseUrl();
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
    globalForPrisma.pool = pool;
  }

  return client;
}

export const prisma = getPrismaClient();
