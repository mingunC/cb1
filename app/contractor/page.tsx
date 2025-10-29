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
  const mountedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // 이미 마운트되었으면 중복 실행 방지
    if (mountedRef.current) return
    mountedRef.current = true

    // AbortController로 비동기 작업 취소 가능하게
    abortControllerRef.current = new AbortController()

    const checkAuth = async () => {
      console.log('🚀 Contractor page auth check starting...')
      
      try {
        const supabase = createBrowserClient()
        
        // 세션이 완전히 로드될 때까지 대기
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // 세션 체크
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // 컴포넌트가 언마운트되었으면 중단
        if (abortControllerRef.current?.signal.aborted) return
        
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
        
        // Contractor 정보 확인
        const { data: contractor, error: contractorError } = await supabase
          .from('contractors')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          
        // 컴포넌트가 언마운트되었으면 중단
        if (abortControllerRef.current?.signal.aborted) return
        
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
          
          // 컴포넌트가 언마운트되었으면 중단
          if (abortControllerRef.current?.signal.aborted) return
          
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
        
        // 상태를 한 번에 업데이트 (렌더링 최소화)
        setContractorData(contractor)
        setIsAuthenticated(true)
        setIsLoading(false)
        
      } catch (error) {
        console.error('🔥 Auth check error:', error)
        
        // 컴포넌트가 언마운트되었으면 중단
        if (abortControllerRef.current?.signal.aborted) return
        
        setIsLoading(false)
        router.push('/contractor-login')
      }
    }
    
    checkAuth()
    
    // Cleanup function - 컴포넌트 언마운트 시 실행
    return () => {
      console.log('🧹 Cleaning up contractor page...')
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [router])

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
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
