import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['zh', 'en', 'ko'],
  
  // Used when no locale matches
  defaultLocale: 'en',
  
  // Always use locale prefix
  localePrefix: 'always'
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(zh|en|ko)/:path*']
};
