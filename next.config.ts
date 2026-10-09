import type { NextConfig } from "next";

// Sent on every response. No script-src: the pages use inline scripts
// (theme/consent init, JSON-LD) and a nonce-based policy would make every
// page dynamic. These cover framing, MIME sniffing, plugin content and
// referrer leakage without that cost.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    serverActions: {
      // Product image uploads (src/lib/product-images.ts, 5MB cap) and
      // digital product file uploads (src/lib/product-files.ts, 20MB cap)
      // both go through Server Actions, not a plain multipart POST route --
      // Next's default 1MB cap on Server Action request bodies was
      // silently rejecting anything over ~1MB before our own file-size
      // checks ever ran, surfacing as a generic server error instead of a
      // friendly "too large" message.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
