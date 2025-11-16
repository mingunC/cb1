import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { ApiErrors } from './error'

/**
 * API Route용 Supabase 클라이언트 생성
 * Authorization 헤더에서 토큰을 가져옴 (localStorage 기반 인증)
 */
function createApiClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    throw ApiErrors.internal('Server configuration error')
  }

  // Authorization 헤더에서 토큰 추출
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  })

  return client
}

export async function requireAuth(request: NextRequest) {
  const supabase = createApiClient(request)
  
  // 🔍 강화된 디버깅 로그
  if (process.env.NODE_ENV === 'development') {
    const authHeader = request.headers.get('authorization')
    console.log('🔑 Authorization header:', authHeader ? 'Present' : 'Missing')
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.error('❌ Auth error:', error?.message || 'No user found')
    console.error('📍 Request URL:', request.url)
    console.error('📍 Request method:', request.method)
    throw ApiErrors.unauthorized()
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ User authenticated:', {
      id: user.id.slice(0, 8),
      email: user.email,
    })
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
