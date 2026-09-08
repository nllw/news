import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe part of the Auth.js configuration. No database imports here so
 * middleware can use it. Providers are added in auth.ts.
 */
export const authConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  trustHost: true,
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "EDITOR";
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "ADMIN" | "EDITOR") ?? "EDITOR";
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLogin = pathname === "/admin/login";
      const isProtected =
        pathname === "/admin" ||
        pathname.startsWith("/admin/") ||
        pathname.startsWith("/api/admin");
      if (isLogin) {
        // Signed-in users skip the login page
        if (auth?.user) return Response.redirect(new URL("/admin", request.nextUrl));
        return true;
      }
      if (isProtected) return Boolean(auth?.user);
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
