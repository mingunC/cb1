import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import type { ContractorSummary, UserProfileResult, UserType } from './types'

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'Email not confirmed': '이메일 인증이 필요합니다. 이메일을 확인해주세요.',
  'Too many requests': '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
}

/**
 * Translate Supabase auth errors into user-friendly messages.
 */
export function mapAuthErrorMessage(message: string): string {
  for (const [key, translated] of Object.entries(AUTH_ERROR_MESSAGES)) {
    if (message.includes(key)) {
      return translated
    }
  }

  return '로그인에 실패했습니다.'
}

/**
 * Determine target redirect path based on user type.
 */
export function getRedirectPath(userType?: UserType | null): string {
  switch (userType) {
    case 'admin':
      return '/admin'
    case 'contractor':
      return '/contractor'
    case 'customer':
    default:
      return '/'
  }
}

/**
 * Resolve the user profile (type + contractor information) using Supabase client.
 */
export async function getUserProfile(
  client: SupabaseClient<Database>,
  userId: string
): Promise<UserProfileResult> {
  try {
    const { data: contractorData, error: contractorError } = await client
      .from('contractors')
      .select('id, company_name, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (contractorData) {
      return {
        success: true,
        userType: 'contractor',
        contractorData: contractorData as ContractorSummary,
      }
    }

    if (contractorError && contractorError.code !== 'PGRST116') {
      console.error('Contractor data query error:', contractorError)
      return { success: false, error: '업체 정보 조회 실패' }
    }

    const { data: userData, error: userError } = await client
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      console.error('User type query error:', userError)
      return { success: false, error: '사용자 정보 조회 실패' }
    }

    if (userData && userData.user_type && userData.user_type !== 'contractor') {
      return { success: true, userType: userData.user_type as UserType }
    }

    return { success: true, userType: 'customer' }
  } catch (error) {
    console.error('getUserProfile error:', error)
    return { success: false, error: '사용자 정보 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * Check whether a given path is accessible based on user role information.
 */
export function checkPathPermission(
  pathname: string,
  userType?: UserType | null,
  isContractor: boolean = false,
  isAdmin: boolean = false
): {
  allowed: boolean
  redirectTo?: string
  reason?: string
} {
  const authPaths = ['/login', '/signup', '/contractor-login', '/contractor-signup', '/forgot-password']
  if (authPaths.includes(pathname)) {
    return { allowed: true }
  }

  const publicPaths = ['/', '/pros', '/portfolio', '/events', '/quote-request']
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/') || pathname.startsWith('/auth/')) {
    return { allowed: true }
  }

  const needsAuth =
    !userType &&
    (pathname.startsWith('/admin') ||
      pathname === '/contractor' ||
      pathname.startsWith('/contractor/') ||
      pathname.startsWith('/my-quotes') ||
      pathname.startsWith('/approved-projects') ||
      pathname.startsWith('/compare-quotes'))

  if (needsAuth) {
    return {
      allowed: false,
      redirectTo: '/login',
      reason: 'Authentication required',
    }
  }

  if (pathname.startsWith('/admin') && !isAdmin) {
    return {
      allowed: false,
      redirectTo: '/',
      reason: 'Admin access required',
    }
  }

  if (
    (pathname === '/contractor' || pathname.startsWith('/contractor/')) &&
    !pathname.includes('login') &&
    !pathname.includes('signup')
  ) {
    if (!isContractor) {
      return {
        allowed: false,
        redirectTo: '/contractor-signup',
        reason: 'Contractor access required',
      }
    }
  }

  return { allowed: true }
}

