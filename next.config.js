/** @type {import('next').NextConfig} */
const nextConfig = {
  // ==========================================
  // 1. React 및 성능 최적화
  // ==========================================
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // ==========================================
  // 2. 이미지 최적화
  // ==========================================
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // ==========================================
  // 3. 빌드 최적화
  // ==========================================
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // ==========================================
  // 4. ESLint 설정
  // ==========================================
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // ==========================================
  // 5. 보안 헤더
  // ==========================================
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // ==========================================
  // 6. 실험적 기능
  // ==========================================
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
