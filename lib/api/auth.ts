import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { ApiErrors } from './error'

/**
 * API Route용 Supabase 클라이언트 생성
 * Request 객체의 쿠키를 사용
 */
function createApiClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    throw ApiErrors.internal('Server configuration error')
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // API Routes don't support setting cookies directly
          // Cookies should be set in the response
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
        },
      },
    }
  )
}

export async function requireAuth(request: NextRequest) {
  const supabase = createApiClient(request)
  
  // Log available cookies for debugging
  if (process.env.NODE_ENV === 'development') {
    const allCookies = request.cookies.getAll()
    console.log('🍪 Request cookies:', allCookies.map(c => c.name))
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.error('❌ Auth error:', error?.message || 'No user found')
    throw ApiErrors.unauthorized()
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ User authenticated:', user.email)
  }

  return { user, supabase }
}

export async function requireRole(allowedRoles: string[], request: NextRequest) {
  const { user, supabase } = await requireAuth(request)

  const { data: profile, error } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Profile check:', {
      userId: user.id.slice(0, 8),
      email: user.email,
      userType: profile?.user_type,
      allowedRoles,
      error: error?.message
    })
  }

  if (error) {
    console.error('❌ Profile fetch error:', error)
    throw ApiErrors.internal('Failed to fetch user profile')
  }

  if (!profile) {
    console.error('❌ No profile found for user:', user.id)
    throw ApiErrors.forbidden('User profile not found')
  }

  if (!allowedRoles.includes(profile.user_type)) {
    console.error('❌ Role mismatch:', {
      required: allowedRoles,
      actual: profile.user_type
    })
    throw ApiErrors.forbidden(`Access denied. Required role: ${allowedRoles.join(' or ')}`)
  }

  return { user, supabase, userType: profile.user_type }
}
