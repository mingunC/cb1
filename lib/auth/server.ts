import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { Session } from '@supabase/supabase-js'
import type { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-clients'
import type { Database } from '@/lib/types/database'
import type { AuthCredentials, AuthResult, UserType } from './types'
import { checkPathPermission as checkPermission, getRedirectPath, getUserProfile, mapAuthErrorMessage } from './utils'

/**
 * Server-side sign in helper (for API routes).
 */
export async function signInServer(credentials: AuthCredentials): Promise<AuthResult> {
  const supabase = await createServerClient()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    })

    if (error) {
      return { success: false, error: mapAuthErrorMessage(error.message) }
    }

    if (!data.user) {
      return { success: false, error: 'Authentication failed' }
    }

    const profileResult = await getUserProfile(supabase, data.user.id)
    if (!profileResult.success) {
      return { success: false, error: profileResult.error || '사용자 정보를 불러올 수 없습니다.' }
    }

    return {
      success: true,
      user: data.user,
      userType: profileResult.userType,
      contractorData: profileResult.contractorData,
      redirectTo: getRedirectPath(profileResult.userType),
    }
  } catch (error) {
    console.error('Server login error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export interface MiddlewareAuthResult {
  session: Session | null
  userType?: UserType
  isContractor: boolean
  isAdmin: boolean
}

/**
 * Retrieve user information for Next.js middleware.
 */
export async function getUserForMiddleware(
  req: NextRequest,
  res: NextResponse
): Promise<MiddlewareAuthResult> {
  try {
    const supabase = createMiddlewareClient<Database>({ req, res })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { session: null, isContractor: false, isAdmin: false }
    }

    const profileResult = await getUserProfile(supabase, session.user.id)
    if (!profileResult.success) {
      return {
        session,
        userType: 'customer',
        isContractor: false,
        isAdmin: false,
      }
    }

    const userType = profileResult.userType ?? 'customer'
    return {
      session,
      userType,
      isContractor: userType === 'contractor',
      isAdmin: userType === 'admin',
    }
  } catch (error) {
    console.error('getUserForMiddleware error:', error)
    return { session: null, isContractor: false, isAdmin: false }
  }
}

/**
 * Re-exported permission checker for route guards.
 */
export const checkPathPermission = checkPermission

