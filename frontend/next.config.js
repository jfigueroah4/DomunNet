const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.backblazeb2.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js', 'clsx', 'tailwind-merge', 'date-fns', 'decimal.js'],
    outputFileTracingRoot: path.join(__dirname, '..'),
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/.git/**',
          '**/.next/**',
          '**/.turbo/**',
          '**/node_modules/**',
          '**/dist/**',
          'C:/DumpStack.log.tmp',
          'C:/pagefile.sys',
          'C:/swapfile.sys',
        ],
      };
    }

    return config;
  },
  headers: async () => {
    return [
      {
        source: '/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async rewrites() {
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
    const baseUrl = rawUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${baseUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
