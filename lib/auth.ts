import { cookies } from "next/headers";

export const SESSION_COOKIE = "editor_session";

// Simple local-auth: the cookie value must match the session secret.
// Fine for running privately on your own machine. If you ever deploy
// this publicly, swap this for a real auth solution (e.g. NextAuth).
export function isValidPassword(password: string): boolean {
  const expected = process.env.EDITOR_PASSWORD || "changeme123";
  return password === expected;
}

export function getSessionSecret(): string {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

export function isAuthenticated(): boolean {
  const store = cookies();
  const cookie = store.get(SESSION_COOKIE);
  return cookie?.value === getSessionSecret();
}
