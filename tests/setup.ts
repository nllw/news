import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll } from "vitest";

/**
 * Each test file gets its own fresh SQLite database under tests/tmp. Schema is
 * pushed with `prisma db push` so tests never touch the development database.
 * A unique name per file avoids picking up a stale WAL from a previous file.
 */
const dbFile = path.resolve(process.cwd(), `tests/tmp/test-${randomUUID()}.db`);
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

process.env.DATABASE_URL = `file:${dbFile}`;
process.env.AUTH_SECRET = "test-secret-test-secret-test-secret-1234";
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
process.env.STORAGE_DRIVER = "local";
process.env.UPLOADS_DIR = "tests/tmp/uploads";

// Push the schema now, at module load, so it happens before the test file's own
// imports instantiate the Prisma client (which opens the file and starts a WAL).
try {
  execSync("npx prisma db push --skip-generate --force-reset", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: `file:${dbFile}` },
  });
} catch (err) {
  const e = err as { stdout?: Buffer; stderr?: Buffer };
  throw new Error(
    `prisma db push failed:\n${e.stdout?.toString() ?? ""}\n${e.stderr?.toString() ?? ""}`
  );
}

beforeAll(() => {
  // Schema is already in place; the hook keeps the lifecycle explicit.
});

afterAll(async () => {
  const { prisma } = await import("@/lib/prisma");
  await prisma.$disconnect();
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    try {
      fs.unlinkSync(`${dbFile}${suffix}`);
    } catch {
      // ignore
    }
  }
});
