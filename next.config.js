/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  typescript: {
    // 빌드 시 TypeScript 오류 무시 (임시)
    ignoreBuildErrors: true,
  },
  eslint: {
    // 빌드 시 ESLint 오류 무시 (임시)
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
