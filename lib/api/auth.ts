import { createClient } from '@/lib/supabase/server'
import { ApiErrors } from './error'

export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw ApiErrors.unauthorized()
  }

  return { user, supabase }
}

export async function requireRole(allowedRoles: string[]) {
  const { user, supabase } = await requireAuth()

  const { data: profile } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (!profile || !allowedRoles.includes(profile.user_type)) {
    throw ApiErrors.forbidden()
  }

  return { user, supabase, userType: profile.user_type }
}

