'use client'

import { useEffect, Suspense, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { CheckCircle } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient()
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const hasProcessed = useRef(false)
  
  const loginType = searchParams.get('type')
  const authCode = searchParams.get('code') // 실제 인증 코드 확인

  useEffect(() => {
    // 이미 처리됐으면 스킵
    if (hasProcessed.current) {
      return
    }

    const handleAuthCallback = async () => {
      try {
        // 먼저 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // 1. 인증 코드가 없고 이미 세션이 있으면 -> 이미 로그인된 상태
        if (!authCode && session) {
          console.log('Already logged in, redirecting...')
          hasProcessed.current = true
          
          // 사용자 타입에 따라 리다이렉트
          const { data: contractorData } = await supabase
            .from('contractors')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle()
          
          if (contractorData) {
            router.replace('/contractor')
          } else {
            const { data: userData } = await supabase
              .from('users')
              .select('user_type')
              .eq('id', session.user.id)
              .maybeSingle()
            
            if (userData?.user_type === 'admin') {
              router.replace('/admin')
            } else {
              router.replace('/')
            }
          }
          return
        }

        // 2. 인증 코드가 있으면 -> 실제 이메일 인증 처리
        if (authCode) {
          hasProcessed.current = true
          
          // exchangeCodeForSession이 이미 처리되었으므로 세션 다시 가져오기
          const { data: { session: newSession }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Auth callback error:', error)
            setVerificationStatus('error')
            setTimeout(() => router.push('/login?error=auth_callback_failed'), 3000)
            return
          }
          
          if (newSession) {
            console.log('Email verification successful:', newSession.user.email)
            
            // Google OAuth 처리
            if (newSession.user.app_metadata?.provider === 'google') {
              console.log('🔍 Google OAuth user')
              
              const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('id', newSession.user.id)
                .maybeSingle()
              
              if (!existingUser) {
                console.log('Creating new user record for Google user')
                const fullName = newSession.user.user_metadata?.full_name || ''
                const nameParts = fullName.split(' ')
                
                await supabase
                  .from('users')
                  .insert({
                    id: newSession.user.id,
                    email: newSession.user.email,
                    user_type: 'customer',
                    first_name: nameParts[0] || '',
                    last_name: nameParts.slice(1).join(' ') || '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
              }
            }
            
            // 업체 로그인 타입인 경우
            if (loginType === 'contractor') {
              const { data: contractorData } = await supabase
                .from('contractors')
                .select('id, company_name')
                .eq('user_id', newSession.user.id)
                .maybeSingle()
              
              if (contractorData) {
                console.log('Contractor login successful:', contractorData.company_name)
                setVerificationStatus('success')
                setTimeout(() => router.replace('/contractor'), 1500)
                return
              } else {
                console.log('Not a contractor, redirecting to contractor signup')
                setVerificationStatus('error')
                setTimeout(() => router.push('/contractor-signup?message=not_contractor'), 3000)
                return
              }
            }
            
            // 일반 로그인 처리
            try {
              const { data: contractorData } = await supabase
                .from('contractors')
                .select('id')
                .eq('user_id', newSession.user.id)
                .maybeSingle()
              
              if (contractorData) {
                console.log('Contractor user, redirecting to contractor dashboard')
                setVerificationStatus('success')
                setTimeout(() => router.replace('/contractor'), 1500)
                return
              }
              
              const { data: userData } = await supabase
                .from('users')
                .select('user_type')
                .eq('id', newSession.user.id)
                .maybeSingle()
              
              if (userData?.user_type === 'admin') {
                console.log('Admin user, redirecting to admin dashboard')
                setVerificationStatus('success')
                setTimeout(() => router.replace('/admin'), 1500)
              } else {
                console.log('Email verified, redirecting to home')
                setVerificationStatus('success')
                setTimeout(() => router.replace('/'), 1500)
              }
            } catch (redirectError) {
              console.error('Redirect error:', redirectError)
              setVerificationStatus('success')
              setTimeout(() => router.replace('/'), 1500)
            }
          } else {
            // 세션이 없으면 로그인 페이지로
            const redirectTo = loginType === 'contractor' ? '/contractor-login' : '/login'
            setVerificationStatus('error')
            setTimeout(() => router.push(redirectTo), 3000)
          }
        } else {
          // 3. 인증 코드도 없고 세션도 없으면 -> 로그인 페이지로
          console.log('No auth code and no session, redirecting to login')
          hasProcessed.current = true
          const redirectTo = loginType === 'contractor' ? '/contractor-login' : '/login'
          router.replace(redirectTo)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setVerificationStatus('error')
        setTimeout(() => router.push('/login?error=unexpected_error'), 3000)
      }
    }

    handleAuthCallback()
  }, [router, authCode, loginType, supabase])

  // 이메일 확인 성공 화면
  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Email Verified! ✅
          </h2>
          <p className="text-gray-600 mb-4">
            Your account has been successfully activated.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    )
  }

  // 이메일 확인 실패 화면
  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verification Failed
          </h2>
          <p className="text-gray-600">
            There was an issue verifying your email. Redirecting to login...
          </p>
        </div>
      </div>
    )
  }

  // 로딩 중
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Verifying your email...</p>
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
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
