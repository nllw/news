import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { loginSchema } from "@/lib/validation/user";
import { verifyPassword } from "@/lib/data/users";
import { clearFailures, isRateLimited, recordFailure } from "@/lib/rate-limit";

export class RateLimitedError extends Error {
  code = "RATE_LIMITED";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw, request) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request?.headers?.get("x-real-ip") ||
          "unknown";
        const keys = [`login:ip:${ip}`, `login:email:${email}`];
        if (keys.some((k) => isRateLimited(k))) {
          throw new RateLimitedError("Too many attempts. Try again in a few minutes.");
        }

        const user = await prisma.user.findUnique({ where: { email } });
        const valid = user && user.active && (await verifyPassword(password, user.passwordHash));
        if (!valid) {
          keys.forEach((k) => recordFailure(k));
          return null;
        }
        keys.forEach((k) => clearFailures(k));
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
