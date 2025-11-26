import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // ✅ cookie에서 locale과 auth type 읽기
  const cookieStore = await cookies()
  const locale = cookieStore.get('auth_locale')?.value || 'en'
  const authType = cookieStore.get('auth_type')?.value || 'customer'

  console.log('🔐 Auth callback received:', {
    hasCode: !!code,
    locale,
    authType,
    url: requestUrl.toString()
  })

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Cookie might be set in a different context
              console.error('Cookie set error:', error)
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Cookie remove error:', error)
            }
          },
        },
      }
    )

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('❌ Auth callback exchange error:', exchangeError)
        return NextResponse.redirect(new URL(`/${locale}/login?error=auth_failed`, requestUrl.origin))
      }

      // ✅ auth type에 따라 리다이렉트 경로 결정
      let redirectPath = `/${locale}`
      
      if (authType === 'contractor') {
        redirectPath = `/${locale}/contractor`
        console.log('✅ Auth callback successful (contractor), redirecting to:', redirectPath)
      } else {
        console.log('✅ Auth callback successful (customer), redirecting to:', redirectPath)
      }
      
      // ✅ auth cookies 삭제
      const response = NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
      response.cookies.delete('auth_locale')
      response.cookies.delete('auth_type')
      
      return response
    } catch (error) {
      console.error('❌ Auth callback unexpected error:', error)
      return NextResponse.redirect(new URL(`/${locale}/login?error=unexpected_error`, requestUrl.origin))
    }
  }

  // 코드가 없으면 로그인 페이지로 리다이렉트
  console.log('⚠️ No auth code found, redirecting to login')
  const loginPath = authType === 'contractor' ? `/${locale}/contractor-login` : `/${locale}/login`
  return NextResponse.redirect(new URL(`${loginPath}?error=no_code`, requestUrl.origin))
}
