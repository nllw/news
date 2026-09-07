/* eslint-disable no-console */
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Load .env and .env.local the same way Next.js does
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const DEFAULT_SECTIONS = [
  { name: "Politics", slug: "politics", order: 10 },
  { name: "World", slug: "world", order: 20 },
  { name: "Business", slug: "business", order: 30 },
  { name: "Technology", slug: "technology", order: 40 },
  { name: "Climate", slug: "climate", order: 50 },
  { name: "Culture", slug: "culture", order: 60 },
  { name: "Sports", slug: "sports", order: 70 },
  { name: "Opinion", slug: "opinion", order: 80 },
];

async function main() {
  for (const s of DEFAULT_SECTIONS) {
    await prisma.section.upsert({ where: { slug: s.slug }, create: s, update: { order: s.order } });
  }
  console.log(`Sections: ${DEFAULT_SECTIONS.length} ensured`);

  const admins = await prisma.user.count({ where: { role: "ADMIN" } });
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (admins === 0) {
    if (!email || !password) {
      console.log(
        "No admin exists and SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD are not set. Skipping admin."
      );
    } else if (password.length < 12) {
      throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters");
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: { email, name: "Editor in Chief", role: "ADMIN", passwordHash },
      });
      await prisma.author.create({
        data: { name: "Editor in Chief", slug: "editor-in-chief", userId: user.id },
      });
      console.log(`Admin created: ${email}`);
    }
  } else {
    console.log(`Admin already exists (${admins}). Skipping.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
