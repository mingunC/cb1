import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserForMiddleware, checkPathPermission } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  try {
    // 사용자 정보 조회
    const { session, userType, isContractor, isAdmin } = await getUserForMiddleware(req, res);

    // 경로별 권한 확인
    const permission = checkPathPermission(pathname, userType, isContractor, isAdmin);

    if (!permission.allowed && permission.redirectTo) {
      console.log(`🚫 Access denied to: ${pathname} (${permission.reason})`);
      return NextResponse.redirect(new URL(permission.redirectTo, req.url));
    }

    // 이미 로그인한 사용자가 인증 페이지 접근 시 리다이렉트
    const authPages = ['/login', '/signup', '/contractor-login', '/contractor-signup'];
    if (session && authPages.includes(pathname)) {
      console.log(`🔄 Authenticated user redirecting from auth page: ${pathname}`);
      
      let redirectTo = '/';
      if (isAdmin) {
        redirectTo = '/admin';
      } else if (isContractor) {
        redirectTo = '/contractor';
      }
      
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }

    console.log(`✅ Access granted to: ${pathname} (${session ? `${userType}` : 'public'})`);
    return res;

  } catch (error) {
    console.error('Middleware error:', error);
    
    // 에러 발생 시 보호된 경로는 로그인 페이지로 리다이렉트
    const protectedPaths = ['/admin', '/contractor', '/my-quotes'];
    if (protectedPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
