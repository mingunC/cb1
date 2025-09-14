'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/login?error=auth_callback_failed')
          return
        }
        
        if (session) {
          console.log('Login successful:', session.user.email)
          
          // 관리자 권한 확인 후 리다이렉트
          try {
            const { data: userData, error: queryError } = await supabase
              .from('users')
              .select('user_type')
              .eq('id', session.user.id)
              .single()
            
            if (!queryError && userData?.user_type === 'admin') {
              // 관리자면 대시보드로 리다이렉트
              console.log('Admin user, redirecting to dashboard')
              router.push('/admin')
            } else {
              // 일반 사용자면 홈페이지로 리다이렉트
              console.log('Regular user, redirecting to home')
              router.push('/')
            }
          } catch (redirectError) {
            console.error('Redirect error:', redirectError)
            // 오류 시 홈페이지로 리다이렉트
            router.push('/')
          }
        } else {
          // 세션이 없으면 로그인 페이지로
          router.push('/login')
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        router.push('/login?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  )
}