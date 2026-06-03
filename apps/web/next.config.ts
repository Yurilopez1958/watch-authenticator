import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@watch-auth/core'],
  typedRoutes: true,
};

export default nextConfig;
