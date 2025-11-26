'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('처리 중...')

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createBrowserClient()
      
      // cookie에서 locale과 auth type 읽기
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return null
      }
      
      const locale = getCookie('auth_locale') || 'en'
      const authType = getCookie('auth_type') || 'customer'
      
      console.log('🔐 Auth callback processing:', { locale, authType })

      try {
        // URL에서 code 파라미터 확인
        const code = searchParams.get('code')
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (errorParam) {
          console.error('❌ OAuth error:', errorParam, errorDescription)
          const loginPath = authType === 'contractor' ? `/${locale}/contractor-login` : `/${locale}/login`
          router.push(`${loginPath}?error=${errorParam}`)
          return
        }

        if (code) {
          // PKCE flow: code를 세션으로 교환
          setStatus('로그인 완료 중...')
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('❌ Session exchange error:', error)
            const loginPath = authType === 'contractor' ? `/${locale}/contractor-login` : `/${locale}/login`
            router.push(`${loginPath}?error=auth_failed`)
            return
          }
          
          console.log('✅ Session exchange successful:', data.user?.email)
        } else {
          // Implicit flow 또는 기존 세션 확인
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error || !session) {
            console.error('❌ No session found:', error)
            const loginPath = authType === 'contractor' ? `/${locale}/contractor-login` : `/${locale}/login`
            router.push(`${loginPath}?error=no_session`)
            return
          }
          
          console.log('✅ Existing session found:', session.user?.email)
        }

        // 쿠키 삭제
        document.cookie = 'auth_locale=; path=/; max-age=0'
        document.cookie = 'auth_type=; path=/; max-age=0'

        // 리다이렉트
        setStatus('리다이렉트 중...')
        
        if (authType === 'contractor') {
          console.log('➡️ Redirecting to contractor dashboard')
          router.push(`/${locale}/contractor`)
        } else {
          console.log('➡️ Redirecting to home')
          router.push(`/${locale}`)
        }
        
      } catch (error) {
        console.error('❌ Unexpected callback error:', error)
        const loginPath = authType === 'contractor' ? `/${locale}/contractor-login` : `/${locale}/login`
        router.push(`${loginPath}?error=unexpected_error`)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-gray-50 to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{status}</p>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-gray-50 to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  )
}
