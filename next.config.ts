import type { NextConfig } from "next";

/**
 * Prefer runtime Route Handlers (`/upstream-api`) over build-time rewrites so
 * `API_INTERNAL_URL` can change without rebuild (local, Docker, Vercel).
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};

export default nextConfig;
