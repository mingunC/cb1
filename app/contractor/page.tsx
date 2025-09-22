'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import IntegratedContractorDashboard from './IntegratedDashboard'

export default function ContractorPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [contractorData, setContractorData] = useState<any>(null)
  const router = useRouter()
  const checkCompleted = useRef(false)

  useEffect(() => {
    if (checkCompleted.current) {
      return
    }

    const checkAuth = async () => {
      console.log('🚀 Contractor page auth check starting...')
      checkCompleted.current = true
      
      try {
        const supabase = createBrowserClient()
        
        // 세션 체크
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('📋 Session status:', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          error: sessionError
        })
        
        if (!session) {
          console.log('❌ No session found, redirecting to login')
          setIsLoading(false)
          setTimeout(() => {
            router.push('/contractor-login')
          }, 100)
          return
        }
        
        // Contractor 정보 확인
        const { data: contractor, error: contractorError } = await supabase
          .from('contractors')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
        
        console.log('🏢 Contractor lookup:', {
          found: !!contractor,
          data: contractor,
          status: contractor?.status,
          error: contractorError
        })
        
        if (!contractor) {
          console.log('❌ Not a contractor, redirecting to signup')
          setIsLoading(false)
          setTimeout(() => {
            router.push('/contractor-signup')
          }, 100)
          return
        }
        
        // status 체크를 일시적으로 비활성화하거나 완화
        // if (contractor.status !== 'active') {
        //   console.log('⚠️ Contractor not active, status:', contractor.status)
        //   setIsLoading(false)
        //   setTimeout(() => {
        //     router.push('/')
        //   }, 100)
        //   return
        // }
        
        // status가 없거나 pending이어도 일단 허용
        if (contractor.status === 'suspended' || contractor.status === 'banned') {
          console.log('⚠️ Contractor suspended or banned')
          setIsLoading(false)
          setTimeout(() => {
            router.push('/')
          }, 100)
          return
        }
        
        console.log('✅ Authentication successful, rendering dashboard')
        setContractorData(contractor)
        setIsAuthenticated(true)
        setIsLoading(false)
        
      } catch (error) {
        console.error('🔥 Auth check error:', error)
        setIsLoading(false)
        setTimeout(() => {
          router.push('/contractor-login')
        }, 100)
      }
    }
    
    checkAuth()
  }, [])

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
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">리다이렉션 중...</p>
        </div>
      </div>
    )
  }
  
  // 인증된 경우 대시보드 렌더링
  return <IntegratedContractorDashboard initialContractorData={contractorData} />
}
