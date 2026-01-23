// next.config.ts

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Skip TypeScript and ESLint checks during Vercel builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-expect-error - eslint config exists but not in NextConfig type
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Optimize for production
  poweredByHeader: false,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;