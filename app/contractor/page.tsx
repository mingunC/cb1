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
    let retryCount = 0
    const MAX_RETRIES = 3

    const checkAuth = async () => {
      console.log(`🚀 Auth check attempt ${retryCount + 1}/${MAX_RETRIES}`)
      
      try {
        const supabase = createBrowserClient()
        
        // 세션 확인 (여러 번 시도)
        let session = null
        let sessionError = null
        
        for (let i = 0; i < 3; i++) {
          const result = await supabase.auth.getSession()
          session = result.data.session
          sessionError = result.error
          
          if (session || sessionError) break
          
          // 세션이 없으면 짧게 대기 후 재시도
          console.log(`⏳ Waiting for session... (attempt ${i + 1}/3)`)
          await new Promise(resolve => setTimeout(resolve, 300))
        }
        
        if (!isMounted) return
        
        console.log('📋 Session check result:', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          error: sessionError
        })
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          throw new Error('세션 확인 중 오류가 발생했습니다.')
        }
        
        if (!session) {
          console.log('❌ No session found')
          
          // 재시도 로직
          if (retryCount < MAX_RETRIES) {
            retryCount++
            console.log(`🔄 Retrying... (${retryCount}/${MAX_RETRIES})`)
            await new Promise(resolve => setTimeout(resolve, 1000))
            if (isMounted) {
              await checkAuth()
            }
            return
          }
          
          // 최대 재시도 후에도 세션 없음
          console.log('❌ Max retries reached, redirecting to login')
          router.push('/contractor-login')
          return
        }
        
        // Contractor 정보 조회
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
            console.log('❌ No contractor data - redirecting to signup')
            router.push('/contractor-signup')
            return
          }
          
          console.error('❌ Contractor lookup error:', contractorError)
          throw new Error('업체 정보를 불러오는 중 오류가 발생했습니다.')
        }
        
        if (!contractor) {
          console.log('❌ No contractor data - redirecting to signup')
          router.push('/contractor-signup')
          return
        }
        
        // 성공
        console.log('✅ Auth successful! Contractor ID:', contractor.id)
        setContractorData(contractor)
        setIsLoading(false)
        
      } catch (error: any) {
        console.error('🔥 Auth check error:', error)
        if (!isMounted) return
        
        setError(error.message || '인증 확인 중 오류가 발생했습니다.')
        setIsLoading(false)
      }
    }
    
    checkAuth()
    
    return () => {
      isMounted = false
    }
  }, [router])

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">문제가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              페이지 새로고침
            </button>
            <button
              onClick={() => router.push('/contractor-login')}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              로그인 페이지로 이동
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
          <p className="mt-2 text-sm text-gray-500">잠시만 기다려주세요</p>
        </div>
      </div>
    )
  }
  
  // 데이터 로드 중
  if (!contractorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-gray-400">
            <p>페이지를 준비하고 있습니다...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // 정상 렌더링
  return <IntegratedContractorDashboard initialContractorData={contractorData} />
}
