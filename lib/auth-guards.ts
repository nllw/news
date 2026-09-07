import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/lib/types";

export class AuthError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "FORBIDDEN") {
    super(
      code === "UNAUTHENTICATED" ? "Sign in to continue." : "You do not have permission to do that."
    );
  }
}

export interface SessionUser {
  id: string;
  role: Role;
  email: string;
  name: string | null;
}

/** For server actions and route handlers: throws instead of redirecting. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id) throw new AuthError("UNAUTHENTICATED");
  return { id: u.id, role: u.role, email: u.email ?? "", name: u.name ?? null };
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new AuthError("FORBIDDEN");
  return user;
}

/** For pages: redirects to the login screen when signed out. */
export async function requirePageUser(): Promise<SessionUser> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id) redirect("/admin/login");
  return { id: u.id, role: u.role, email: u.email ?? "", name: u.name ?? null };
}

export function isAdmin(user: { role: Role }) {
  return user.role === "ADMIN";
}

export function canDelete(user: { role: Role }) {
  return user.role === "ADMIN";
}
