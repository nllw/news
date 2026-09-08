import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { CreateUserInput } from "@/lib/validation/user";
import { createAuthor } from "./taxonomy";
import type { Role } from "@/lib/types";

const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** URL-safe temporary password shown once to the admin who creates the account. */
export function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export const listUsers = () =>
  prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
      author: { select: { id: true, name: true, slug: true } },
    },
  });

export const getUserById = (id: string) => prisma.user.findUnique({ where: { id } });

export const getUserByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email: email.toLowerCase() } });

export async function createUser(input: CreateUserInput) {
  const password = input.password ?? generateTemporaryPassword();
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email: input.email, name: input.name, role: input.role, passwordHash },
  });
  if (input.createAuthor) {
    await createAuthor({ name: input.name, bio: "", avatarId: null, userId: user.id });
  }
  return { user, temporaryPassword: input.password ? null : password };
}

export async function updateUser(
  id: string,
  data: { name?: string; role?: Role; active?: boolean }
) {
  return prisma.user.update({ where: { id }, data });
}

export async function setPassword(id: string, password: string) {
  return prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(password) },
  });
}

export async function resetPassword(id: string) {
  const password = generateTemporaryPassword();
  await setPassword(id, password);
  return password;
}

export const countAdmins = () => prisma.user.count({ where: { role: "ADMIN", active: true } });
