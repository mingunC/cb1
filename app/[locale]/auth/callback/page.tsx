'use client'

import { useEffect, Suspense, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { CheckCircle } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const hasProcessed = useRef(false)
  
  const loginType = searchParams.get('type')
  const authCode = searchParams.get('code')

  useEffect(() => {
    if (hasProcessed.current) {
      return
    }

    const handleAuthCallback = async () => {
      const supabase = createBrowserClient()
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!authCode && session) {
          if (process.env.NODE_ENV === 'development') console.log('Already logged in, redirecting...')
          hasProcessed.current = true
          
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

        if (authCode) {
          hasProcessed.current = true
          
          if (sessionError) {
            console.error('Auth callback error:', sessionError)
            setVerificationStatus('error')
            setTimeout(() => router.push('/login?error=auth_callback_failed'), 3000)
            return
          }
          
          const { data: { session: newSession }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Auth callback error:', error)
            setVerificationStatus('error')
            setTimeout(() => router.push('/login?error=auth_callback_failed'), 3000)
            return
          }
          
          if (newSession) {
            if (process.env.NODE_ENV === 'development') console.log('Authentication successful:', newSession.user.email)
            
            if (newSession.user.app_metadata?.provider === 'google') {
              if (process.env.NODE_ENV === 'development') console.log('🔍 Google OAuth user detected')
              
              const { data: existingUser } = await supabase
                .from('users')
                .select('id, email, created_at')
                .eq('id', newSession.user.id)
                .maybeSingle()
              
              if (!existingUser) {
                if (process.env.NODE_ENV === 'development') console.log('✨ New Google user - creating user record')
                const fullName = newSession.user.user_metadata?.full_name || ''
                const nameParts = fullName.split(' ')
                
                const { error: insertError } = await supabase
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
                
                if (insertError) {
                  console.error('Error creating user record:', insertError)
                }
              } else {
                if (process.env.NODE_ENV === 'development') console.log('✅ Automatic Linking: Google identity linked to existing account')
                if (process.env.NODE_ENV === 'development') console.log('   Existing user:', existingUser.email)
                if (process.env.NODE_ENV === 'development') console.log('   Created at:', existingUser.created_at)
              }
            }
            
            if (loginType === 'contractor') {
              const { data: contractorData } = await supabase
                .from('contractors')
                .select('id, company_name')
                .eq('user_id', newSession.user.id)
                .maybeSingle()
              
              if (contractorData) {
                if (process.env.NODE_ENV === 'development') console.log('Contractor login successful:', contractorData.company_name)
                setVerificationStatus('success')
                setTimeout(() => router.replace('/contractor'), 1500)
                return
              } else {
                if (process.env.NODE_ENV === 'development') console.log('Not a contractor, redirecting to contractor signup')
                setVerificationStatus('error')
                setTimeout(() => router.push('/contractor-signup?message=not_contractor'), 3000)
                return
              }
            }
            
            try {
              const { data: contractorData } = await supabase
                .from('contractors')
                .select('id')
                .eq('user_id', newSession.user.id)
                .maybeSingle()
              
              if (contractorData) {
                if (process.env.NODE_ENV === 'development') console.log('Contractor user, redirecting to contractor dashboard')
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
                if (process.env.NODE_ENV === 'development') console.log('Admin user, redirecting to admin dashboard')
                setVerificationStatus('success')
                setTimeout(() => router.replace('/admin'), 1500)
              } else {
                if (process.env.NODE_ENV === 'development') console.log('Customer user, redirecting to home')
                setVerificationStatus('success')
                setTimeout(() => router.replace('/'), 1500)
              }
            } catch (redirectError) {
              console.error('Redirect error:', redirectError)
              setVerificationStatus('success')
              setTimeout(() => router.replace('/'), 1500)
            }
          } else {
            const redirectTo = loginType === 'contractor' ? '/contractor-login' : '/login'
            setVerificationStatus('error')
            setTimeout(() => router.push(redirectTo), 3000)
          }
        } else {
          if (process.env.NODE_ENV === 'development') console.log('No auth code and no session, redirecting to login')
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
  }, [authCode, loginType, router])

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome! 🎉
          </h2>
          <p className="text-gray-600 mb-4">
            Your account is ready.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    )
  }

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
            There was an issue. Redirecting to login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing...</p>
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
