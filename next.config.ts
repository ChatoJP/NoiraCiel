import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['music-metadata'],
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
