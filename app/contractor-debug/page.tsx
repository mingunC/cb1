'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { useRouter } from 'next/navigation'

export default function TestContractorPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    async function loadData() {
      const supabase = createBrowserClient()
      
      // 1. 세션 확인
      const { data: { session } } = await supabase.auth.getSession()
      
      let contractorData = null
      let userData = null
      let projectsData = null
      let myQuotes = null
      
      if (session) {
        // 2. Contractor 정보 가져오기
        const { data: contractor } = await supabase
          .from('contractors')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle()
        
        // 3. User 정보 가져오기
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        
        contractorData = contractor
        userData = user
        
        if (contractor) {
          // 4. 프로젝트 가져오기
          const { data: projects } = await supabase
            .from('quote_requests')
            .select('*, selected_contractor_id, selected_quote_id')
            .limit(10)
          
          // 5. 내 견적서 확인
          const { data: quotes } = await supabase
            .from('contractor_quotes')
            .select('*')
            .eq('contractor_id', contractor.id)
          
          projectsData = projects
          myQuotes = quotes
        }
      }
      
      // 디버그 정보 정리
      const result = {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        hasContractorData: !!contractorData,
        hasUserData: !!userData,
        contractorStatus: contractorData?.status,
        userType: userData?.user_type,
        contractorData,
        userData,
        projects: projectsData?.map(p => ({
          id: p.id,
          status: p.status,
          selected_contractor_id: p.selected_contractor_id,
          selected_quote_id: p.selected_quote_id,
          is_selected: contractorData && p.selected_contractor_id === contractorData.id ? '✅ 선정됨' : 
                      p.selected_contractor_id ? '❌ 미선정' : '⏳ 대기중'
        })),
        myQuotes,
        summary: {
          total_projects: projectsData?.length || 0,
          selected_for_me: projectsData?.filter(p => contractorData && p.selected_contractor_id === contractorData.id).length || 0,
          selected_for_others: projectsData?.filter(p => p.selected_contractor_id && contractorData && p.selected_contractor_id !== contractorData.id).length || 0
        }
      }
      
      setDebugInfo(result)
      setLoading(false)
    }
    
    loadData()
  }, [router])
  
  if (loading) {
    return <div className="p-8">Loading...</div>
  }
  
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Contractor Debug Page</h1>
      
      {/* 전체 디버그 정보 */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Debug Info</h2>
        <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
      
      {/* 세션 상태 */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Session Status</h2>
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="font-medium mr-2">Has Session:</span>
            <span className={`px-2 py-1 text-xs rounded ${debugInfo.hasSession ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {debugInfo.hasSession ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-2">User Type:</span>
            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
              {debugInfo.userType || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-2">Has Contractor Data:</span>
            <span className={`px-2 py-1 text-xs rounded ${debugInfo.hasContractorData ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {debugInfo.hasContractorData ? '✅ Yes' : '❌ No'}
            </span>
          </div>
        </div>
      </div>
      
      {/* 프로젝트 상태 */}
      {debugInfo.projects && debugInfo.projects.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="text-lg font-semibold mb-2">Projects Status</h2>
          <div className="space-y-2">
            {debugInfo.projects.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-2 border rounded">
                <span className="text-xs font-mono">{p.id.slice(0, 8)}...</span>
                <span className={`px-2 py-1 text-xs rounded ${
                  p.is_selected === '✅ 선정됨' ? 'bg-green-100 text-green-700' :
                  p.is_selected === '❌ 미선정' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {p.is_selected}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 액션 버튼들 */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Actions</h2>
        <div className="space-x-4">
          <button 
            onClick={async () => {
              const supabase = createBrowserClient()
              await supabase.auth.signOut()
              router.push('/contractor-login')
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            로그아웃
          </button>
          <a 
            href="/contractor-login" 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
          >
            로그인 페이지로
          </a>
          {debugInfo.hasContractorData && (
            <button 
              onClick={() => router.push('/contractor')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              대시보드로
            </button>
          )}
          <button 
            onClick={() => {
              localStorage.clear()
              sessionStorage.clear()
              location.reload()
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            캐시 정리 & 새로고침
          </button>
        </div>
      </div>
    </div>
  )
}
