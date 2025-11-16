import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Client-side Supabase client for browser usage (싱글톤 패턴)
let browserClient: ReturnType<typeof createSSRBrowserClient<Database>> | null = null

export const createBrowserClient = () => {
  if (browserClient) {
    return browserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // During build time, env vars might not be available - return a dummy client
  if (!supabaseUrl || !supabaseAnonKey) {
    // Only throw in browser context, not during build
    if (typeof window !== 'undefined') {
      throw new Error('Missing Supabase environment variables')
    }
    // Return a dummy client during build that will never be used
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder-key')
  }

  // ✅ Use @supabase/ssr's createBrowserClient for cookie-based auth
  browserClient = createSSRBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined
          
          // 🔧 개선된 쿠키 파싱
          const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            if (key && value) {
              acc[key] = decodeURIComponent(value)
            }
            return acc
          }, {} as Record<string, string>)
          
          return cookies[name]
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return
          
          // 🔧 프로덕션 환경에 맞는 쿠키 설정
          const cookieOptions: string[] = []
          
          // 기본값: path는 항상 /
          cookieOptions.push(`path=${options?.path || '/'}`)
          
          // maxAge 설정
          if (options?.maxAge !== undefined) {
            cookieOptions.push(`max-age=${options.maxAge}`)
          }
          
          // 프로덕션 환경에서는 Secure와 SameSite 설정
          if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
            cookieOptions.push('secure')
            cookieOptions.push(`samesite=${options?.sameSite || 'lax'}`)
          } else {
            // 로컬 개발 환경
            cookieOptions.push(`samesite=${options?.sameSite || 'lax'}`)
          }
          
          // 도메인 설정 (options에 있는 경우에만)
          if (options?.domain) {
            cookieOptions.push(`domain=${options.domain}`)
          }
          
          const cookie = `${name}=${encodeURIComponent(value)}; ${cookieOptions.join('; ')}`
          document.cookie = cookie
          
          // 디버깅 로그 (개발 환경에서만)
          if (process.env.NODE_ENV === 'development') {
            console.log('🍪 Setting cookie:', { name, hasValue: !!value, options: cookieOptions })
          }
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return
          
          // 쿠키 삭제: maxAge를 0으로 설정
          const cookieOptions: string[] = [
            `max-age=0`,
            `path=${options?.path || '/'}`,
          ]
          
          if (options?.domain) {
            cookieOptions.push(`domain=${options.domain}`)
          }
          
          const cookie = `${name}=; ${cookieOptions.join('; ')}`
          document.cookie = cookie
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🗑️ Removing cookie:', name)
          }
        },
      },
    }
  )

  // 세션 상태 변경 리스너 추가 (중요한 이벤트만 로그)
  browserClient.auth.onAuthStateChange((event, session) => {
    // Skip logging for token refresh and initial session events
    if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
      return
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Auth state changed:', event, session?.user?.id)
      
      // 로그인 성공 시 쿠키 확인
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ Login successful, checking cookies...')
        const cookies = document.cookie.split(';').filter(c => c.trim().startsWith('sb-'))
        console.log(`🍪 Supabase cookies found: ${cookies.length}`)
      }
    }
  })

  return browserClient
}

// Server-side Supabase client for API routes
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Admin client for administrative operations
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
