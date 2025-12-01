'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'

// 다국어 메시지
const messages = {
  en: {
    processing: 'Processing...',
    signingIn: 'Signing in...',
    redirecting: 'Redirecting...',
    loading: 'Loading...',
    settingUp: 'Setting up your account...'
  },
  ko: {
    processing: '처리 중...',
    signingIn: '로그인 완료 중...',
    redirecting: '리다이렉트 중...',
    loading: '로딩 중...',
    settingUp: '계정 설정 중...'
  },
  zh: {
    processing: '处理中...',
    signingIn: '登录中...',
    redirecting: '重定向中...',
    loading: '加载中...',
    settingUp: '设置账户中...'
  }
}

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('...')
  const [locale, setLocale] = useState('en')

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
      
      const cookieLocale = getCookie('auth_locale') || 'en'
      const authType = getCookie('auth_type') || 'customer'
      
      // locale 상태 설정
      setLocale(cookieLocale)
      
      // 해당 언어의 메시지 가져오기
      const t = messages[cookieLocale as keyof typeof messages] || messages.en
      
      setStatus(t.processing)
      
      console.log('🔐 Auth callback processing:', { locale: cookieLocale, authType })

      try {
        // URL에서 code 파라미터 확인
        const code = searchParams.get('code')
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (errorParam) {
          console.error('❌ OAuth error:', errorParam, errorDescription)
          const loginPath = authType === 'contractor' ? `/${cookieLocale}/contractor-login` : `/${cookieLocale}/login`
          router.push(`${loginPath}?error=${errorParam}`)
          return
        }

        let userId: string | null = null

        if (code) {
          // PKCE flow: code를 세션으로 교환
          setStatus(t.signingIn)
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('❌ Session exchange error:', error)
            const loginPath = authType === 'contractor' ? `/${cookieLocale}/contractor-login` : `/${cookieLocale}/login`
            router.push(`${loginPath}?error=auth_failed`)
            return
          }
          
          userId = data.user?.id || null
          console.log('✅ Session exchange successful:', data.user?.email)
        } else {
          // Implicit flow 또는 기존 세션 확인
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error || !session) {
            console.error('❌ No session found:', error)
            const loginPath = authType === 'contractor' ? `/${cookieLocale}/contractor-login` : `/${cookieLocale}/login`
            router.push(`${loginPath}?error=no_session`)
            return
          }
          
          userId = session.user?.id || null
          console.log('✅ Existing session found:', session.user?.email)
        }

        // ✅ Google OAuth 로그인 시 users 테이블에 preferred_language 업데이트
        if (userId) {
          setStatus(t.settingUp)
          console.log('🌐 Updating preferred_language to:', cookieLocale)
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ preferred_language: cookieLocale })
            .eq('id', userId)
          
          if (updateError) {
            // 업데이트 실패해도 로그인은 계속 진행 (치명적이지 않음)
            console.warn('⚠️ Failed to update preferred_language:', updateError.message)
          } else {
            console.log('✅ preferred_language updated successfully')
          }
        }

        // 쿠키 삭제
        document.cookie = 'auth_locale=; path=/; max-age=0'
        document.cookie = 'auth_type=; path=/; max-age=0'

        // 리다이렉트
        setStatus(t.redirecting)
        
        if (authType === 'contractor') {
          console.log('➡️ Redirecting to contractor dashboard')
          router.push(`/${cookieLocale}/contractor`)
        } else {
          console.log('➡️ Redirecting to home')
          router.push(`/${cookieLocale}`)
        }
        
      } catch (error) {
        console.error('❌ Unexpected callback error:', error)
        const loginPath = authType === 'contractor' ? `/${locale}/contractor-login` : `/${locale}/login`
        router.push(`${loginPath}?error=unexpected_error`)
      }
    }

    handleCallback()
  }, [router, searchParams, locale])

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
  // 기본 영어로 표시 (Suspense fallback에서는 cookie 접근 불가)
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-gray-50 to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
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
