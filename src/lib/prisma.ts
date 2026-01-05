import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

// For Cloudflare Workers, the D1 binding is passed via context
// For local development, we use a SQLite file fallback

declare global {
  // eslint-disable-next-line no-var
  var __db__: D1Database | undefined;
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

// Type for D1Database from Cloudflare Workers
type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  dump: () => Promise<ArrayBuffer>;
  batch: <T = unknown>(statements: D1PreparedStatement[]) => Promise<D1Result<T>[]>;
  exec: (query: string) => Promise<D1ExecResult>;
};

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  first: <T = unknown>(colName?: string) => Promise<T | null>;
  run: <T = unknown>() => Promise<D1Result<T>>;
  all: <T = unknown>() => Promise<D1Result<T>>;
  raw: <T = unknown>() => Promise<T[]>;
};

type D1Result<T = unknown> = {
  results?: T[];
  success: boolean;
  error?: string;
  meta: object;
};

type D1ExecResult = {
  count: number;
  duration: number;
};

/**
 * Get Prisma client configured for D1 or local SQLite
 */
export function getPrismaClient(db?: D1Database): PrismaClient {
  // If D1 binding is provided (Cloudflare Workers runtime)
  if (db) {
    const adapter = new PrismaD1(db);
    return new PrismaClient({ adapter });
  }
  
  // For local development without D1
  if (globalThis.__prisma__) {
    return globalThis.__prisma__;
  }
  
  // Create new client for local dev (uses DATABASE_URL from .env)
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma__ = client;
  }
  
  return client;
}

// Default export for local development
const prisma = getPrismaClient();
export default prisma;
