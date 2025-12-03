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
    savingContractor: 'Saving contractor info...',
    checkingContractor: 'Checking contractor status...'
  },
  ko: {
    processing: '처리 중...',
    signingIn: '로그인 완료 중...',
    redirecting: '리다이렉트 중...',
    loading: '로딩 중...',
    settingUp: '계정 설정 중...',
    savingContractor: '업체 정보 저장 중...',
    checkingContractor: '업체 등록 상태 확인 중...'
  },
  zh: {
    processing: '处理中...',
    signingIn: '登录中...',
    redirecting: '重定向中...',
    loading: '加载中...',
    settingUp: '设置账户中...',
    savingContractor: '保存承包商信息...',
    checkingContractor: '检查承包商状态...'
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
        // URL에서 error 파라미터 확인
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (errorParam) {
          console.error('❌ OAuth error:', errorParam, errorDescription)
          const loginPath = authType === 'contractor' ? `/${cookieLocale}/contractor-login` : `/${cookieLocale}/login`
          router.push(`${loginPath}?error=${errorParam}`)
          return
        }

        setStatus(t.signingIn)

        // ✅ Supabase가 URL의 code를 자동으로 처리하도록 getSession 호출
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          const loginPath = authType === 'contractor' ? `/${cookieLocale}/contractor-login` : `/${cookieLocale}/login`
          router.push(`${loginPath}?error=session_error`)
          return
        }
        
        if (!session) {
          console.error('❌ No session found')
          const loginPath = authType === 'contractor' ? `/${cookieLocale}/contractor-login` : `/${cookieLocale}/login`
          router.push(`${loginPath}?error=no_session`)
          return
        }
        
        const userId = session.user?.id || null
        const userEmail = session.user?.email || null
        const userMetadata = session.user?.user_metadata || {}
        console.log('✅ Session found:', session.user?.email)

        // ✅ users 테이블에 레코드 확인 및 생성/업데이트
        if (userId) {
          setStatus(t.settingUp)
          console.log('🌐 Checking/creating user record with preferred_language:', cookieLocale)
          
          // 먼저 users 테이블에 레코드가 있는지 확인
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .maybeSingle()
          
          if (checkError) {
            console.warn('⚠️ Error checking user:', checkError.message)
          }
          
          if (existingUser) {
            // 레코드가 있으면 preferred_language만 업데이트
            const { error: updateError } = await supabase
              .from('users')
              .update({ 
                preferred_language: cookieLocale,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId)
            
            if (updateError) {
              console.warn('⚠️ Failed to update preferred_language:', updateError.message)
            } else {
              console.log('✅ preferred_language updated successfully')
            }
          } else {
            // 레코드가 없으면 새로 생성
            console.log('📝 Creating new user record...')
            
            // Google 메타데이터에서 이름 추출
            const firstName = userMetadata.given_name || userMetadata.full_name?.split(' ')[0] || userEmail?.split('@')[0] || 'User'
            const lastName = userMetadata.family_name || userMetadata.full_name?.split(' ').slice(1).join(' ') || ''
            
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: userEmail,
                first_name: firstName,
                last_name: lastName,
                user_type: authType === 'contractor' ? 'contractor' : 'customer',
                preferred_language: cookieLocale,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            
            if (insertError) {
              console.error('❌ Failed to create user record:', insertError.message)
            } else {
              console.log('✅ User record created successfully')
            }
          }
        }

        // ✅ 업체 로그인/회원가입인 경우 처리
        if (authType === 'contractor' && userId) {
          setStatus(t.checkingContractor)
          
          // 이미 등록된 contractor인지 확인
          const { data: existingContractor } = await supabase
            .from('contractors')
            .select('id, company_name')
            .eq('user_id', userId)
            .maybeSingle()
          
          if (existingContractor) {
            // 이미 업체로 등록되어 있으면 → contractor 대시보드로
            console.log('✅ Already registered as contractor:', existingContractor.company_name)
            localStorage.setItem('cached_user_type', 'contractor')
            localStorage.setItem('cached_user_name', existingContractor.company_name)
            
            // 쿠키 삭제
            document.cookie = 'auth_locale=; path=/; max-age=0'
            document.cookie = 'auth_type=; path=/; max-age=0'
            
            setStatus(t.redirecting)
            router.push(`/${cookieLocale}/contractor`)
            return
          }
          
          // localStorage에 contractor_temp_data가 있는지 확인 (이메일 인증 후 돌아온 경우)
          const tempDataStr = localStorage.getItem('contractor_temp_data')
          
          if (tempDataStr) {
            // 이메일 인증 후 돌아온 경우 → contractors 테이블에 저장
            setStatus(t.savingContractor)
            
            try {
              const tempData = JSON.parse(tempDataStr)
              console.log('📦 Found contractor temp data:', tempData)
              
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
              
              // 임시 데이터 삭제
              localStorage.removeItem('contractor_temp_data')
              
              // 쿠키 삭제
              document.cookie = 'auth_locale=; path=/; max-age=0'
              document.cookie = 'auth_type=; path=/; max-age=0'
              
              setStatus(t.redirecting)
              router.push(`/${cookieLocale}/contractor`)
              return
              
            } catch (parseError) {
              console.error('❌ Failed to parse contractor temp data:', parseError)
            }
          }
          
          // Google 로그인으로 처음 온 경우 → contractor-signup 페이지로 리다이렉트
          console.log('➡️ Redirecting to contractor-signup for profile completion')
          
          // 쿠키 삭제
          document.cookie = 'auth_locale=; path=/; max-age=0'
          document.cookie = 'auth_type=; path=/; max-age=0'
          
          setStatus(t.redirecting)
          router.push(`/${cookieLocale}/contractor-signup`)
          return
        }

        // 쿠키 삭제
        document.cookie = 'auth_locale=; path=/; max-age=0'
        document.cookie = 'auth_type=; path=/; max-age=0'

        // 고객 로그인 → 홈으로 리다이렉트
        setStatus(t.redirecting)
        console.log('➡️ Redirecting to home')
        router.push(`/${cookieLocale}`)
        
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
