'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import ImprovedContractorDashboard from './ImprovedDashboard'

export default function ContractorPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [contractorData, setContractorData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const authCheckRef = useRef(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    // 중복 실행 방지
    if (authCheckRef.current) return
    authCheckRef.current = true

    const checkAuth = async () => {
      if (process.env.NODE_ENV === 'development') console.log('🚀 Starting auth check')
      
      try {
        // 1. 세션 확인 (한 번만)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (process.env.NODE_ENV === 'development') console.log('📋 Session status:', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email
        })
        // 추가 체크 로그
        if (process.env.NODE_ENV === 'development') console.log('Session exists:', !!session)
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          throw new Error('세션 확인 중 오류가 발생했습니다.')
        }
        
        if (!session) {
          if (process.env.NODE_ENV === 'development') console.log('❌ No session - redirecting to login')
          router.push('/contractor-login')
          return
        }
        
        // 2. Contractor 정보 조회
        const { data: contractor, error: contractorError } = await supabase
          .from('contractors')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
        
        if (process.env.NODE_ENV === 'development') console.log('🏢 Contractor lookup:', {
          found: !!contractor,
          contractorId: contractor?.id,
          error: contractorError?.code
        })
        
        if (contractorError) {
          if (contractorError.code === 'PGRST116') {
            // Contractor 데이터 없음
            if (process.env.NODE_ENV === 'development') console.log('❌ No contractor profile - redirecting to signup')
            router.push('/contractor-signup')
            return
          }
          
          console.error('❌ Contractor lookup error:', contractorError)
          throw new Error('업체 정보를 불러오는 중 오류가 발생했습니다.')
        }
        
        if (!contractor) {
          if (process.env.NODE_ENV === 'development') console.log('❌ No contractor data - redirecting to signup')
          router.push('/contractor-signup')
          return
        }
        
        // 3. 성공 - 데이터 설정
        if (process.env.NODE_ENV === 'development') console.log('✅ Auth successful! Loading dashboard...')
        setContractorData(contractor)
        setIsLoading(false)
        
      } catch (error: any) {
        console.error('🔥 Auth check error:', error)
        setError(error.message || '인증 확인 중 오류가 발생했습니다.')
        setIsLoading(false)
      }
    }
    
    // Auth state change 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (process.env.NODE_ENV === 'development') console.log('🔄 Auth state changed:', event, !!session)
      
      if (event === 'SIGNED_OUT') {
        router.push('/contractor-login')
      } else if (event === 'SIGNED_IN' && !contractorData) {
        // 로그인 후 contractor 데이터 없으면 체크
        authCheckRef.current = false
        checkAuth()
      }
    })
    
    checkAuth()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase, contractorData])

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center max-w-md px-4 bg-white rounded-xl shadow-lg p-8">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">문제가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              페이지 새로고침
            </button>
            <button
              onClick={() => router.push('/contractor-login')}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
            >
              로그인 페이지로 이동
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 로딩 상태
  if (isLoading || !contractorData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold text-lg">대시보드 로딩 중...</p>
          <p className="mt-2 text-sm text-gray-500">잠시만 기다려주세요</p>
        </div>
      </div>
    )
  }
  
  // 정상 렌더링 - 새로운 ImprovedDashboard 사용
  return <ImprovedContractorDashboard initialContractorData={contractorData} />
}
