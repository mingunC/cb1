import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Client-side Supabase client for browser usage (싱글톤 패턴)
let browserClient: ReturnType<typeof createClient<Database>> | null = null

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

  // ✅ Use standard createClient with localStorage (works reliably)
  browserClient = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        // ✅ PKCE flow 사용 - OAuth callback에서 code 파라미터 전달
        flowType: 'pkce',
        // localStorage 기반 세션 저장 (기본값)
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  )

  // 세션 상태 변경 리스너
  browserClient.auth.onAuthStateChange((event, session) => {
    // Skip logging for token refresh and initial session events
    if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
      return
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Auth state changed:', event, session?.user?.id)
      
      // 로그인 성공 시 localStorage 확인
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ Login successful')
        if (typeof window !== 'undefined') {
          const keys = Object.keys(localStorage).filter(k => k.includes('supabase'))
          console.log(`💾 Supabase localStorage keys: ${keys.length}`)
        }
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
