// ============================================
// 2. lib/supabase/hooks.ts - 재사용 가능한 훅
// ============================================
import { useCallback, useEffect, useState } from 'react'
import { createBrowserClient } from './clients'

export const useSupabase = () => {
  const [supabase] = useState(() => createBrowserClient())
  return supabase
}

export const useAuth = () => {
  const supabase = useSupabase()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkAuth()
  }, [supabase])

  return { user, loading, isAuthenticated: !!user }
}