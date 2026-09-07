import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  const imageHosts: string[] = [];
  const s3 = process.env.S3_PUBLIC_URL;
  if (s3) {
    try {
      imageHosts.push(new URL(s3).origin);
    } catch {
      // ignore
    }
  }
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' blob: data: ${imageHosts.join(" ")}`.trim(),
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    `media-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'self'`,
    `frame-src 'self'`,
    `upgrade-insecure-requests`,
  ];
  return directives.join("; ");
}

export default auth((req) => {
  // `auth` has already applied the `authorized` callback and redirected if needed.
  const nonce = btoa(crypto.getRandomValues(new Uint8Array(16)).join(""));
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-csp", buildCsp(nonce));
  // Lets layouts know which page they are wrapping (used for the masthead <h1>)
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", buildCsp(nonce));
  return res;
});

export const config = {
  matcher: [
    // Run on every page and API route except Next internals and static files
    "/((?!_next/static|_next/image|uploads/|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|feed.xml|news-sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|otf|woff2?)$).*)",
  ],
};
