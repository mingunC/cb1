'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import IntegratedContractorDashboard from './IntegratedDashboard'

export default function ContractorPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [contractorData, setContractorData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🚀 Contractor page auth check starting...')
      
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
          router.push('/contractor-login')
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
          error: contractorError
        })
        
        if (!contractor) {
          console.log('❌ Not a contractor, redirecting to signup')
          router.push('/contractor-signup')
          return
        }
        
        if (contractor.status !== 'active') {
          console.log('⚠️ Contractor not active')
          router.push('/')
          return
        }
        
        console.log('✅ Authentication successful, rendering dashboard')
        setContractorData(contractor)
        setIsAuthenticated(true)
        
      } catch (error) {
        console.error('🔥 Auth check error:', error)
        router.push('/contractor-login')
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
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
  
  // 인증되지 않은 경우 (리다이렉션 전 잠시 표시)
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
