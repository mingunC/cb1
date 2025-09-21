'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient()
  
  // URL 파라미터에서 type 확인 (contractor 여부)
  const loginType = searchParams.get('type')

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
          
          // Google OAuth 메타데이터 디버깅
          if (session.user.app_metadata?.provider === 'google') {
            console.log('🔍 Google OAuth 메타데이터:')
            console.log('- user_metadata:', session.user.user_metadata)
            console.log('- app_metadata:', session.user.app_metadata)
            console.log('- identities:', session.user.identities)
            
            // Google Identity 데이터 상세 확인
            const googleIdentity = session.user.identities?.find(id => id.provider === 'google')
            if (googleIdentity) {
              console.log('- Google Identity data:', googleIdentity.identity_data)
            }
          }
          
          // 업체 로그인 타입인 경우
          if (loginType === 'contractor') {
            // 업체 여부 확인
            const { data: contractorData } = await supabase
              .from('contractors')
              .select('id, company_name')
              .eq('user_id', session.user.id)
              .maybeSingle()
            
            if (contractorData) {
              console.log('Contractor login successful:', contractorData.company_name)
              router.push('/contractor')
              return
            } else {
              console.log('Not a contractor, redirecting to contractor signup')
              router.push('/contractor-signup?message=not_contractor')
              return
            }
          }
          
          // 일반 로그인 처리
          try {
            // 먼저 업체인지 확인
            const { data: contractorData } = await supabase
              .from('contractors')
              .select('id')
              .eq('user_id', session.user.id)
              .maybeSingle()
            
            if (contractorData) {
              // 업체면 업체 대시보드로
              console.log('Contractor user, redirecting to contractor dashboard')
              router.push('/contractor')
              return
            }
            
            // 일반 사용자 타입 확인
            const { data: userData } = await supabase
              .from('users')
              .select('user_type')
              .eq('id', session.user.id)
              .single()
            
            if (userData?.user_type === 'admin') {
              // 관리자면 관리자 대시보드로
              console.log('Admin user, redirecting to admin dashboard')
              router.push('/admin')
            } else {
              // 일반 사용자면 홈페이지로
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
          const redirectTo = loginType === 'contractor' ? '/contractor-login' : '/login'
          router.push(redirectTo)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        router.push('/login?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router, supabase, loginType])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
