// lib/supabase/hooks.ts
'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from './clients'
import { UserRole } from '../supabase'
import type { User } from '@supabase/supabase-js'

// Supabase 클라이언트를 모듈 레벨에서 한 번만 생성
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient()
  }
  return supabaseClient
}

// Custom hook for authentication
export const useAuth = () => {
  // Supabase 클라이언트를 useMemo로 메모이제이션
  const supabase = useMemo(() => getSupabaseClient(), [])
  
  // 사용자 상태 관리 (선택적)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 초기 사용자 로드 (선택적 - 필요한 경우만)
  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (mounted) {
          setUser(user)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading user:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadUser()

    // Auth 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  // useCallback으로 함수들을 메모이제이션
  const getUser = useCallback(async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  }, [supabase])

  const getUserRole = useCallback(async (userId?: string) => {
    const { data, error } = await supabase.rpc('get_user_role', {
      user_id: userId
    })
    return { role: data as UserRole, error }
  }, [supabase])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }, [supabase])

  const signUp = useCallback(async (email: string, password: string, role: UserRole = 'customer') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role
        }
      }
    })
    return { data, error }
  }, [supabase])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }, [supabase])

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    return { data, error }
  }, [supabase])

  const resetPassword = useCallback(async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { data, error }
  }, [supabase])

  const updatePassword = useCallback(async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  }, [supabase])

  const updateUserRole = useCallback(async (userId: string, newRole: UserRole) => {
    const { data, error } = await supabase.rpc('update_user_role', {
      user_id: userId,
      new_role: newRole
    })
    return { data, error }
  }, [supabase])

  return {
    // 상태
    user,
    loading,
    // 메서드
    getUser,
    getUserRole,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    updateUserRole
  }
}

// Hook for real-time subscriptions
export const useRealtime = () => {
  // Supabase 클라이언트를 useMemo로 메모이제이션
  const supabase = useMemo(() => getSupabaseClient(), [])

  const subscribeToTable = useCallback((table: string, callback: (payload: any) => void) => {
    const subscription = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe()

    return subscription
  }, [supabase])

  const unsubscribe = useCallback((subscription: any) => {
    supabase.removeChannel(subscription)
  }, [supabase])

  return {
    subscribeToTable,
    unsubscribe
  }
}