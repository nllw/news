"use server";

import { AuthError as NextAuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { loginSchema } from "@/lib/validation/user";

export interface LoginState {
  error?: string;
  email?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check your details.",
      email: String(formData.get("email") ?? ""),
    };
  }
  const next = String(formData.get("next") ?? "/admin");
  const safeNext = next.startsWith("/admin") ? next : "/admin";
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: safeNext });
  } catch (err) {
    // signIn throws a redirect on success; let it through
    if (isRedirectError(err)) throw err;
    if (err instanceof NextAuthError) {
      const cause = (err.cause as { err?: { code?: string; message?: string } } | undefined)?.err;
      if (cause?.code === "RATE_LIMITED") {
        return {
          error: "Too many attempts. Wait a few minutes and try again.",
          email: parsed.data.email,
        };
      }
      return { error: "Email or password is incorrect.", email: parsed.data.email };
    }
    throw err;
  }
  redirect(safeNext);
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}

function isRedirectError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
