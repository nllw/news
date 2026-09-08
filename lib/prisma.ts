import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPragmasApplied?: boolean;
};

function createClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
  return client;
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * SQLite tuning: write-ahead logging lets readers proceed during a write, and
 * busy_timeout makes concurrent writers wait instead of failing immediately.
 * Safe to call repeatedly; runs once per process.
 */
export async function applySqlitePragmas() {
  if (globalForPrisma.prismaPragmasApplied) return;
  globalForPrisma.prismaPragmasApplied = true;
  try {
    // PRAGMA statements return a row in SQLite, so they must go through $queryRaw
    await prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL;");
    await prisma.$queryRawUnsafe("PRAGMA busy_timeout=5000;");
    await prisma.$queryRawUnsafe("PRAGMA foreign_keys=ON;");
  } catch (err) {
    console.warn("Could not apply SQLite pragmas", err);
  }
}

void applySqlitePragmas();
