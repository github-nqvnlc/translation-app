import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

export const createSqliteAdapter = () => {
  const fallbackUrl = "file:./prisma/dev.db";
  const databaseUrl = process.env.DATABASE_URL ?? fallbackUrl;

  return new PrismaBetterSqlite3({
    url: databaseUrl,
  });
};

