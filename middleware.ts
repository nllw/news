import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const cookie = req.cookies.get(SESSION_COOKIE);
    // Compare against the env var directly here since middleware runs
    // on the edge runtime, separate from lib/auth's server helpers.
    const expected = process.env.SESSION_SECRET || "dev-secret-change-me";
    if (!cookie || cookie.value !== expected) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
