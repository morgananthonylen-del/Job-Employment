/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  // Explicitly set the workspace root to silence lockfile warning
  outputFileTracingRoot: path.resolve(__dirname),
  // Disable source maps in production for better performance
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    // Optimize images to reduce bandwidth
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600, // Cache images for 1 hour
  },
  // Optimize bundle size - Temporarily disabled to fix webpack error
  // experimental: {
  //   optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  // },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Reduce bundle size
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    // Don't override optimization - let Next.js handle it
    return config;
  },
  // Add cache headers to reduce bandwidth costs
  async headers() {
    return [
      {
        source: '/api/jobs',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
      {
        source: '/api/jobs/:id',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
    ];
  },
  // Output configuration for better performance (only for production builds)
  // output: 'standalone', // Commented out - causes issues in dev mode
}

module.exports = nextConfig

