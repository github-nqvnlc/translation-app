import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
  var prismaPgPool: Pool | undefined;
}

const datasourceUrl = process.env.DATABASE_URL;

if (!datasourceUrl) {
  throw new Error("DATABASE_URL is required to initialize PrismaClient");
}

// Optimize connection pool for Vercel serverless
const pool =
  globalThis.prismaPgPool ??
  new Pool({
    connectionString: datasourceUrl,
    // Optimize for serverless: smaller pool, faster timeouts
    max: 1, // Vercel serverless functions are short-lived
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // Enable connection reuse
    allowExitOnIdle: true,
  });

const adapter = new PrismaPg(pool);

// Prisma Client with optimized settings for production
export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter,
    // Only log errors and warnings to reduce console noise
    // Set PRISMA_LOG_QUERIES=true to enable query logging for debugging
    log: process.env.PRISMA_LOG_QUERIES === "true" 
      ? ["query", "error", "warn"] 
      : process.env.NODE_ENV === "development" 
        ? ["error", "warn"] 
        : ["error"],
  });

// Cache Prisma Client in globalThis for both dev and production (Vercel serverless)
if (!globalThis.prisma) {
  globalThis.prisma = prisma;
  globalThis.prismaPgPool = pool;
}

