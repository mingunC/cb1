import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'ko', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'always'
});

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, auth)
    // Skip all files in public folder (images, icons, etc)
    // Skip sitemap.xml and robots.txt for SEO
    '/((?!api|_next|auth|sitemap.xml|robots.txt|favicon.ico|logo.png|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico|.*\\.webp).*)',
    // Include root
    '/',
    // Include all locale paths
    '/(ko|en|zh)/:path*'
  ]
};
