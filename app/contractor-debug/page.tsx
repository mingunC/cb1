'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import { useRouter } from 'next/navigation'

export default function TestContractorPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    async function loadData() {
      const supabase = createBrowserClient()
      
      // 1. 세션 확인
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/contractor-login')
        return
      }
      
      // 2. Contractor 정보 가져오기
      const { data: contractor } = await supabase
        .from('contractors')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      
      if (!contractor) {
        setData({ error: 'No contractor found' })
        setLoading(false)
        return
      }
      
      console.log('✅ Contractor found:', {
        id: contractor.id,
        company_name: contractor.company_name,
        user_id: contractor.user_id
      })
      
      // 3. 프로젝트 가져오기
      const { data: projects } = await supabase
        .from('quote_requests')
        .select('*, selected_contractor_id, selected_quote_id')
        .limit(10)
      
      console.log('📋 Projects:', projects)
      
      // 4. 특정 프로젝트 확인
      const targetProjects = [
        '754a95f9-6fe2-45bf-bc0f-d97545ab0455',
        '80c2a74f-ecf7-466f-a9f6-10158e1733f5'
      ]
      
      const projectDetails = projects?.filter(p => targetProjects.includes(p.id))
      console.log('🎯 Target projects:', projectDetails)
      
      // 5. 내 견적서 확인
      const { data: myQuotes } = await supabase
        .from('contractor_quotes')
        .select('*')
        .eq('contractor_id', contractor.id)
      
      console.log('💰 My quotes:', myQuotes)
      
      // 6. 결과 정리
      const result = {
        contractor,
        projects: projects?.map(p => ({
          id: p.id,
          status: p.status,
          selected_contractor_id: p.selected_contractor_id,
          selected_quote_id: p.selected_quote_id,
          is_selected: p.selected_contractor_id === contractor.id ? '✅ 선정됨' : 
                      p.selected_contractor_id ? '❌ 미선정' : '⏳ 대기중'
        })),
        myQuotes,
        summary: {
          total_projects: projects?.length || 0,
          selected_for_me: projects?.filter(p => p.selected_contractor_id === contractor.id).length || 0,
          selected_for_others: projects?.filter(p => p.selected_contractor_id && p.selected_contractor_id !== contractor.id).length || 0
        }
      }
      
      setData(result)
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
      
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Contractor Info</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(data.contractor, null, 2)}
        </pre>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(data.summary, null, 2)}
        </pre>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Projects Status</h2>
        <div className="space-y-2">
          {data.projects?.map((p: any) => (
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
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">My Quotes</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(data.myQuotes, null, 2)}
        </pre>
      </div>
      
      <button 
        onClick={() => router.push('/contractor')}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Back to Dashboard
      </button>
    </div>
  )
}
