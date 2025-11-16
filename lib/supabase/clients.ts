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
          const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
          return cookie ? cookie.split('=')[1] : undefined
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return
          let cookie = `${name}=${value}`
          if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
          if (options?.path) cookie += `; path=${options.path}`
          if (options?.domain) cookie += `; domain=${options.domain}`
          if (options?.secure) cookie += '; secure'
          if (options?.sameSite) cookie += `; samesite=${options.sameSite}`
          document.cookie = cookie
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return
          let cookie = `${name}=; max-age=0`
          if (options?.path) cookie += `; path=${options.path}`
          if (options?.domain) cookie += `; domain=${options.domain}`
          document.cookie = cookie
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
    if (process.env.NODE_ENV === 'development') console.log('🔐 Auth state changed:', event, session?.user?.id)
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
