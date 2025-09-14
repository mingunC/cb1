'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { useAuth } from '@/lib/supabase/hooks'

export default function AuthTestPage() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const { getUser } = useAuth()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient()
        
        // 현재 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Current session:', session)
        console.log('Session error:', sessionError)
        setSession(session)
        
        // 현재 사용자 확인
        const { user, error: userError } = await getUser()
        console.log('Current user:', user)
        console.log('User error:', userError)
        setUser(user)
        
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // 인증 상태 변화 감지
    const supabase = createBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session)
      setSession(session)
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 상태 확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">인증 상태 테스트</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 세션 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">세션 정보</h2>
            {session ? (
              <div className="space-y-2">
                <p><strong>액세스 토큰:</strong> {session.access_token ? '있음' : '없음'}</p>
                <p><strong>만료 시간:</strong> {new Date(session.expires_at * 1000).toLocaleString()}</p>
                <p><strong>사용자 ID:</strong> {session.user?.id}</p>
                <p><strong>이메일:</strong> {session.user?.email}</p>
                <p><strong>이메일 확인:</strong> {session.user?.email_confirmed_at ? '확인됨' : '미확인'}</p>
              </div>
            ) : (
              <p className="text-red-600">세션이 없습니다.</p>
            )}
          </div>

          {/* 사용자 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">사용자 정보</h2>
            {user ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>이메일:</strong> {user.email}</p>
                <p><strong>생성일:</strong> {new Date(user.created_at).toLocaleString()}</p>
                <p><strong>마지막 로그인:</strong> {new Date(user.last_sign_in_at).toLocaleString()}</p>
                <p><strong>역할:</strong> {user.user_metadata?.role || 'customer'}</p>
              </div>
            ) : (
              <p className="text-red-600">사용자 정보가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 로그인 상태 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">로그인 상태</h2>
          {user && session ? (
            <div className="text-green-600">
              <p className="text-lg">✅ 로그인됨</p>
              <p>이메일: {user.email}</p>
            </div>
          ) : (
            <div className="text-red-600">
              <p className="text-lg">❌ 로그인되지 않음</p>
            </div>
          )}
        </div>

        {/* 디버깅 정보 */}
        <div className="mt-6 bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">디버깅 정보</h2>
          <p className="text-sm text-gray-600">
            브라우저 개발자 도구 (F12) → Console 탭에서 상세한 로그를 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
