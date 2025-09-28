'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import IntegratedContractorDashboard from './IntegratedDashboard2'

export default function ContractorPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [contractorData, setContractorData] = useState<any>(null)
  const router = useRouter()
  const authCheckRef = useRef(false) // 중복 실행 방지용 ref

  useEffect(() => {
    // 이미 체크 중이면 중복 실행 방지
    if (authCheckRef.current) return
    authCheckRef.current = true

    const checkAuth = async () => {
      console.log('🚀 Contractor page auth check starting...')
      
      try {
        const supabase = createBrowserClient()
        
        // 세션 체크 - 타임아웃 설정
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        )
        
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any
        
        console.log('📋 Session status:', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          error: sessionError
        })
        
        if (!session) {
          console.log('❌ No session found, redirecting to login')
          setIsLoading(false)
          router.push('/contractor-login')
          return
        }
        
        // Contractor 정보 확인 - 타임아웃 설정
        const contractorPromise = supabase
          .from('contractors')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          
        const contractorTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Contractor lookup timeout')), 5000)
        )
        
        const { data: contractor, error: contractorError } = await Promise.race([
          contractorPromise,
          contractorTimeoutPromise
        ]) as any
        
        console.log('🏢 Contractor lookup:', {
          found: !!contractor,
          data: contractor,
          status: contractor?.status,
          error: contractorError
        })
        
        if (!contractor) {
          console.log('❌ Not a contractor, checking user type...')
          
          // users 테이블에서 user_type 확인
          const { data: userData } = await supabase
            .from('users')
            .select('user_type')
            .eq('id', session.user.id)
            .maybeSingle()
          
          if (userData?.user_type === 'contractor') {
            // users 테이블에는 contractor로 등록되어 있지만
            // contractors 테이블에는 데이터가 없는 경우
            console.log('⚠️ User is marked as contractor but no contractor data found')
            setIsLoading(false)
            router.push('/contractor-signup?error=missing_contractor_data')
          } else {
            // 일반 사용자인 경우
            console.log('❌ Not a contractor user')
            setIsLoading(false)
            router.push('/contractor-signup')
          }
          return
        }
        
        console.log('✅ Authentication successful, rendering dashboard')
        console.log('📊 Contractor data for dashboard:', {
          contractor,
          userId: session.user.id,
          id: contractor.id
        })
        
        setContractorData(contractor)
        setIsAuthenticated(true)
        setIsLoading(false)
        
      } catch (error) {
        console.error('🔥 Auth check error:', error)
        setIsLoading(false)
        
        // 타임아웃 에러인 경우 재시도 옵션 제공
        if (error instanceof Error && error.message.includes('timeout')) {
          const retry = confirm('인증 확인이 지연되고 있습니다. 다시 시도하시겠습니까?')
          if (retry) {
            window.location.reload()
          } else {
            router.push('/contractor-login')
          }
        } else {
          router.push('/contractor-login')
        }
      }
    }
    
    checkAuth()
    
    // Cleanup function
    return () => {
      authCheckRef.current = false
    }
  }, [router])

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
          <p className="mt-2 text-sm text-gray-500">시간이 오래 걸리는 경우 페이지를 새로고침해주세요.</p>
        </div>
      </div>
    )
  }
  
  // 인증되지 않은 경우
  if (!isAuthenticated || !contractorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">리다이렉션 중...</p>
        </div>
      </div>
    )
  }
  
  // 인증된 경우 - 새 대시보드 컴포넌트 사용
  return <IntegratedContractorDashboard initialContractorData={contractorData} />
}
