// This file is deprecated - auth callback is now handled by page.tsx (client component)
// Keeping this file to handle direct GET requests and redirect to the page

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  // 모든 query parameters를 유지하면서 같은 경로로 리다이렉트
  // Next.js가 page.tsx를 렌더링하도록 함
  // 이 route.ts는 page.tsx가 있으면 실행되지 않음
  
  // Fallback: 직접 접근 시 로그인 페이지로 리다이렉트
  const locale = 'en'
  return NextResponse.redirect(new URL(`/${locale}/login`, requestUrl.origin))
}
