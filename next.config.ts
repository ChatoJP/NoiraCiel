import type { NextConfig } from 'next'

const R2_BASE = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev'

const nextConfig: NextConfig = {
  distDir: '.next_out',
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },
  experimental: { viewTransition: true },
  serverExternalPackages: ['music-metadata'],
  async redirects() {
    return [
      {
        source: '/Videos/:path*',
        destination: `${R2_BASE}/Videos/:path*`,
        permanent: true,
      },
      {
        source: '/images/:path*',
        destination: `${R2_BASE}/images/:path*`,
        permanent: true,
      },
      {
        source: '/Audio/:path*',
        destination: `${R2_BASE}/Audio/:path*`,
        permanent: true,
      },
    ]
  },
  // Books is proxied (not redirected) because ScoreViewer fetches SVG pages
  // as text client-side — R2's public bucket sends no CORS headers, so a
  // cross-origin redirect would break that fetch. A same-origin rewrite
  // avoids the CORS requirement entirely.
  async rewrites() {
    return [
      {
        source: '/Books/:path*',
        destination: `${R2_BASE}/Books/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/api/audio/:path*',
        headers: [
          { key: 'Accept-Ranges', value: 'bytes' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ]
  },
}

export default nextConfig
