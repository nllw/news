/** @type {import('next').NextConfig} */

function imageHost() {
  const url = process.env.S3_PUBLIC_URL;
  if (!url) return null;
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

const s3 = imageHost();

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  });
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: s3
      ? [{ protocol: s3.protocol.replace(":", ""), hostname: s3.hostname, pathname: "/**" }]
      : [],
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    instrumentationHook: true,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
