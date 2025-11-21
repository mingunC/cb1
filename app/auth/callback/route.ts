import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const locale = requestUrl.searchParams.get('locale') || 'en'

  console.log('🔐 Auth callback received:', {
    hasCode: !!code,
    locale,
    url: requestUrl.toString()
  })

  if (code) {
    const cookieStore = await cookies()
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

      console.log('✅ Auth callback successful, redirecting to:', `/${locale}`)
      
      // 기본 언어로 리다이렉트
      return NextResponse.redirect(new URL(`/${locale}`, requestUrl.origin))
    } catch (error) {
      console.error('❌ Auth callback unexpected error:', error)
      return NextResponse.redirect(new URL(`/${locale}/login?error=unexpected_error`, requestUrl.origin))
    }
  }

  // 코드가 없으면 로그인 페이지로 리다이렉트
  console.log('⚠️ No auth code found, redirecting to login')
  return NextResponse.redirect(new URL(`/${locale}/login?error=no_code`, requestUrl.origin))
}

