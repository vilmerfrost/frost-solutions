import path from 'path';
import { fileURLToPath } from 'url';
import { withSentryConfig } from '@sentry/nextjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // App is served from frostsolutions.se/app (root domain has marketing site)
  basePath: '/app',
  // Turbopack disabled due to Runtime ChunkLoadError with basePath in development
  // Can be re-enabled when Next.js fixes the issue
  // Removed turbopack config to use webpack instead
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
};

const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  
  // Upload source maps to Sentry for better error tracking
  // Set SENTRY_AUTH_TOKEN and SENTRY_ORG/SENTRY_PROJECT env vars to enable
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Only upload source maps in production
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',
};

const sentryOptions = {
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  
  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: false,
  
  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: '/monitoring',
  
  // Automatically instrument Next.js data fetching methods and API routes
  automaticVercelMonitors: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions, sentryOptions);
