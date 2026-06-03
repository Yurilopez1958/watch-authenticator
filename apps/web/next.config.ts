import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@watch-auth/core'],
  typedRoutes: true,
  // TypeScript and ESLint are checked separately in CI (pnpm typecheck / pnpm lint).
  // Skipping them here avoids known issues with inferred return types referencing
  // types from workspace packages (@watch-auth/core) during production build.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
