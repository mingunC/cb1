'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import IntegratedContractorDashboard from './IntegratedDashboard2'

export default function ContractorPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [contractorData, setContractorData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      console.log('🚀 Starting contractor auth check...')
      
      try {
        const supabase = createBrowserClient()
        
        // 1. 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        console.log('📋 Session check:', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          error: sessionError
        })
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setError('세션 확인 중 오류가 발생했습니다.')
          setIsLoading(false)
          return
        }
        
        if (!session) {
          console.log('❌ No session - redirecting to login')
          router.push('/contractor-login')
          return
        }
        
        // 2. Contractor 정보 조회
        const { data: contractor, error: contractorError } = await supabase
          .from('contractors')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          
        if (!isMounted) return
        
        console.log('🏢 Contractor lookup:', {
          found: !!contractor,
          error: contractorError
        })
        
        if (contractorError) {
          if (contractorError.code === 'PGRST116') {
            // No rows found
            console.log('❌ Not a contractor - redirecting to signup')
            router.push('/contractor-signup')
            return
          }
          
          console.error('❌ Contractor lookup error:', contractorError)
          setError('업체 정보를 불러오는 중 오류가 발생했습니다.')
          setIsLoading(false)
          return
        }
        
        if (!contractor) {
          console.log('❌ No contractor data - redirecting to signup')
          router.push('/contractor-signup')
          return
        }
        
        // 3. 성공 - 상태 업데이트
        console.log('✅ Auth successful, contractor ID:', contractor.id)
        setContractorData(contractor)
        setIsLoading(false)
        
      } catch (error) {
        console.error('🔥 Unexpected error:', error)
        if (!isMounted) return
        
        setError('예상치 못한 오류가 발생했습니다.')
        setIsLoading(false)
      }
    }
    
    checkAuth()
    
    // Cleanup
    return () => {
      isMounted = false
    }
  }, [router])

  // 에러 발생 시
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️ {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

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
  
  // contractor 데이터가 없으면 (리다이렉션 전)
  if (!contractorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">페이지를 이동하는 중...</p>
        </div>
      </div>
    )
  }
  
  // 정상 렌더링
  return <IntegratedContractorDashboard initialContractorData={contractorData} />
}
