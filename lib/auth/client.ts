import { createBrowserClient } from '@/lib/supabase/clients'
import type { AuthCredentials, AuthResult } from '@/types'
import { getRedirectPath, getUserProfile, mapAuthErrorCode } from './utils'

/**
 * Sign in using user-provided credentials (client-side).
 * Returns error codes instead of translated messages for i18n support.
 */
export async function signIn(credentials: AuthCredentials): Promise<AuthResult> {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    })

    if (error) {
      return { success: false, error: mapAuthErrorCode(error.message) }
    }

    if (!data.user) {
      return { success: false, error: 'loginFailed' }
    }

    const profileResult = await getUserProfile(supabase, data.user.id)
    if (!profileResult.success) {
      return { success: false, error: profileResult.error || 'profileQueryFailed' }
    }

    return {
      success: true,
      user: data.user,
      userType: profileResult.userType,
      contractorData: profileResult.contractorData,
      redirectTo: getRedirectPath(profileResult.userType),
    }
  } catch (error) {
    console.error('Unexpected error during login:', error)
    return {
      success: false,
      error: 'unexpectedError',
    }
  }
}

/**
 * Retrieve the currently authenticated user (client-side).
 */
export async function getCurrentUser(): Promise<{
  user: AuthResult['user'] | null
  userType?: AuthResult['userType']
  contractorData?: AuthResult['contractorData']
}> {
  const supabase = createBrowserClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return { user: null }
    }

    const profileResult = await getUserProfile(supabase, user.id)
    if (!profileResult.success) {
      return { user }
    }

    return {
      user,
      userType: profileResult.userType,
      contractorData: profileResult.contractorData,
    }
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return { user: null }
  }
}

/**
 * Sign out the currently authenticated user.
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  const supabase = createBrowserClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out error:', error)
      return { success: false, error: 'logoutFailed' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected sign out error:', error)
    return { success: false, error: 'logoutFailed' }
  }
}
