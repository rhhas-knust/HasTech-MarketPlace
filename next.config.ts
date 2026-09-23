import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
