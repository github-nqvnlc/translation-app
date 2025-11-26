import { PrismaClient } from "@prisma/client";
import { createSqliteAdapter } from "./prisma-adapter";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient(
    process.env.VERCEL ? undefined : { adapter: createSqliteAdapter() },
  );

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

