'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'

export default function ContractorTestPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testAuth = async () => {
      console.log('🔍 Starting contractor test...')
      const supabase = createBrowserClient()
      
      try {
        // 1. 세션 체크
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Session:', session?.user?.email, sessionError)
        
        if (!session) {
          setData({ error: 'No session found' })
          setLoading(false)
          return
        }
        
        // 2. Contractor 테이블 조회
        const { data: contractor, error: contractorError } = await supabase
          .from('contractors')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
        
        console.log('Contractor query result:', contractor, contractorError)
        
        // 3. 모든 contractor 조회 (디버그용)
        const { data: allContractors, error: allError } = await supabase
          .from('contractors')
          .select('id, user_id, company_name, status')
          .limit(10)
        
        console.log('All contractors:', allContractors, allError)
        
        setData({
          session: {
            userId: session.user.id,
            email: session.user.email
          },
          contractor,
          contractorError: contractorError?.message,
          allContractors,
          allError: allError?.message
        })
        
      } catch (error) {
        console.error('Test error:', error)
        setData({ error: String(error) })
      } finally {
        setLoading(false)
      }
    }
    
    testAuth()
  }, [])
  
  if (loading) {
    return <div className="p-8">Loading test data...</div>
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Contractor Test Page</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <pre className="text-xs overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
      
      <div className="mt-4 space-x-2">
        <button 
          onClick={() => window.location.href = '/contractor'}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go to Contractor Page
        </button>
        
        <button 
          onClick={() => window.location.href = '/contractor-login'}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Go to Login
        </button>
        
        <button 
          onClick={async () => {
            const supabase = createBrowserClient()
            await supabase.auth.signOut()
            window.location.reload()
          }}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
