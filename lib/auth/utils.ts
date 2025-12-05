import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ContractorSummary, UserProfileResult, UserType } from '@/types'

// 에러 메시지를 에러 코드로 매핑 (번역은 UI에서 처리)
const AUTH_ERROR_CODES: Record<string, string> = {
  'Invalid login credentials': 'invalidCredentials',
  'Email not confirmed': 'emailNotConfirmed',
  'Too many requests': 'tooManyRequests',
}

/**
 * Translate Supabase auth errors into error codes.
 * The actual translation should be done in the UI using the locale.
 */
export function mapAuthErrorCode(message: string): string {
  for (const [key, code] of Object.entries(AUTH_ERROR_CODES)) {
    if (message.includes(key)) {
      return code
    }
  }
  return 'loginFailed'
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
      return { success: false, error: 'contractorQueryFailed' }
    }

    const { data: userData, error: userError } = await client
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      console.error('User type query error:', userError)
      return { success: false, error: 'userQueryFailed' }
    }

    if (userData && userData.user_type && userData.user_type !== 'contractor') {
      return { success: true, userType: userData.user_type as UserType }
    }

    return { success: true, userType: 'customer' }
  } catch (error) {
    console.error('getUserProfile error:', error)
    return { success: false, error: 'profileQueryFailed' }
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
