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
    settingUp: 'Setting up your account...',
    savingContractor: 'Saving contractor info...'
  },
  ko: {
    processing: '처리 중...',
    signingIn: '로그인 완료 중...',
    redirecting: '리다이렉트 중...',
    loading: '로딩 중...',
    settingUp: '계정 설정 중...',
    savingContractor: '업체 정보 저장 중...'
  },
  zh: {
    processing: '处理中...',
    signingIn: '登录中...',
    redirecting: '重定向中...',
    loading: '加载中...',
    settingUp: '设置账户中...',
    savingContractor: '保存承包商信息...'
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
        let userEmail: string | null = null

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
          userEmail = data.user?.email || null
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
          userEmail = session.user?.email || null
          console.log('✅ Existing session found:', session.user?.email)
        }

        // ✅ users 테이블에 preferred_language 업데이트
        if (userId) {
          setStatus(t.settingUp)
          console.log('🌐 Updating preferred_language to:', cookieLocale)
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ preferred_language: cookieLocale })
            .eq('id', userId)
          
          if (updateError) {
            console.warn('⚠️ Failed to update preferred_language:', updateError.message)
          } else {
            console.log('✅ preferred_language updated successfully')
          }
        }

        // ✅ 업체 회원가입인 경우: localStorage에서 임시 데이터 가져와서 contractors 테이블에 저장
        if (authType === 'contractor' && userId) {
          setStatus(t.savingContractor)
          
          const tempDataStr = localStorage.getItem('contractor_temp_data')
          
          if (tempDataStr) {
            try {
              const tempData = JSON.parse(tempDataStr)
              console.log('📦 Found contractor temp data:', tempData)
              
              // 이미 등록된 contractor인지 확인
              const { data: existingContractor } = await supabase
                .from('contractors')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle()
              
              if (!existingContractor) {
                // contractors 테이블에 저장
                const contractorData = {
                  user_id: userId,
                  company_name: tempData.businessName,
                  contact_name: tempData.contactName,
                  phone: tempData.phone,
                  email: tempData.email || userEmail,
                  address: tempData.address,
                  status: 'active',
                  specialties: tempData.specialties,
                  years_experience: 0,
                  portfolio_count: 0,
                  rating: 0.0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
                
                console.log('📤 Saving contractor data:', contractorData)
                
                const { error: contractorError } = await supabase
                  .from('contractors')
                  .insert(contractorData)
                
                if (contractorError) {
                  console.error('❌ Failed to save contractor:', contractorError)
                } else {
                  console.log('✅ Contractor saved successfully')
                  
                  // users 테이블에 user_type 업데이트
                  await supabase
                    .from('users')
                    .update({ user_type: 'contractor' })
                    .eq('id', userId)
                  
                  // localStorage 캐시 업데이트
                  localStorage.setItem('cached_user_type', 'contractor')
                  localStorage.setItem('cached_user_name', tempData.businessName)
                }
              } else {
                console.log('ℹ️ Contractor already registered')
              }
              
              // 임시 데이터 삭제
              localStorage.removeItem('contractor_temp_data')
              
            } catch (parseError) {
              console.error('❌ Failed to parse contractor temp data:', parseError)
            }
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
