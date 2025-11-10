/** @type {import('next').NextConfig} */
const nextConfig = {
  // ==========================================
  // 1. React 및 성능 최적화
  // ==========================================
  reactStrictMode: true,
  poweredByHeader: false, // 보안: X-Powered-By 헤더 제거
  compress: true, // Gzip 압축 활성화

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
        hostname: '**.supabase.co', // Supabase Storage
      },
    ],
    formats: ['image/avif', 'image/webp'], // 최신 이미지 포맷 우선
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // 이미지 캐시 최소 시간 (초)
  },

  // ==========================================
  // 3. 빌드 최적화
  // ==========================================
  swcMinify: true, // SWC 컴파일러로 더 빠른 빌드
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] } // 프로덕션에서 console.log 제거
      : false,
  },

  // ==========================================
  // 4. Output File Tracing (스택 오버플로우 방지)
  // ==========================================
  outputFileTracingRoot: undefined,
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/linux-x64',
    ],
  },

  // ==========================================
  // 5. ESLint 설정
  // ==========================================
  eslint: {
    // 빌드 시 ESLint 에러를 무시하고 진행
    // 개발 중에는 'npm run lint'로 별도 체크
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript는 체크 (type-check는 통과함)
    ignoreBuildErrors: false,
  },

  // ==========================================
  // 6. 보안 헤더
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
  // 7. 리다이렉트 (필요시 추가)
  // ==========================================
  async redirects() {
    return [
      // 예시: www 없는 도메인으로 리다이렉트
      // {
      //   source: '/:path*',
      //   has: [{ type: 'host', value: 'www.canadabeaver.com' }],
      //   destination: 'https://canadabeaver.com/:path*',
      //   permanent: true,
      // },
    ]
  },

  // ==========================================
  // 8. 실험적 기능 (선택사항)
  // ==========================================
  experimental: {
    optimizePackageImports: ['lucide-react'], // 번들 크기 최적화
    // serverActions: true, // Server Actions 활성화 (Next.js 14+)
  },
}

// Bundle Analyzer (프로덕션 빌드 시 번들 크기 분석)
// ANALYZE=true npm run build 로 실행
if (process.env.ANALYZE === 'true') {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  })
  module.exports = withBundleAnalyzer(nextConfig)
} else {
  module.exports = nextConfig
}
