import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // 지원하는 언어 목록
  locales: ['en', 'ko', 'zh'],
  
  // 기본 언어
  defaultLocale: 'en',
  
  // URL 경로에 항상 locale prefix 표시
  // /en/quote, /ko/quote, /zh/quote
  localePrefix: 'always'
});

export const config = {
  // 모든 경로에 middleware 적용 (API 제외)
  matcher: ['/', '/(ko|en|zh)/:path*']
};
