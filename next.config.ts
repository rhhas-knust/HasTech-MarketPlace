import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Product image uploads (src/lib/product-images.ts) allow up to 5MB
      // and go through a Server Action, not a plain multipart POST route --
      // Next's default 1MB cap on Server Action request bodies was
      // silently rejecting anything over ~1MB before our own file-size
      // check ever ran, surfacing as a generic server error instead of the
      // "Images must be 5MB or smaller" message.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
