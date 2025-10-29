'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'

export default function SessionDebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [contractorInfo, setContractorInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAll = async () => {
      const supabase = createBrowserClient()
      
      // 1. Session check
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      setSessionInfo({
        session,
        error: sessionError,
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email
      })

      // 2. Contractor check if session exists
      if (session) {
        const { data: contractor, error: contractorError } = await supabase
          .from('contractors')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle()
        
        setContractorInfo({
          data: contractor,
          error: contractorError
        })
      }

      setLoading(false)
    }

    checkAll()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Session Debug Info</h1>
      
      <div className="space-y-6">
        {/* Session Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Session Information</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>

        {/* Contractor Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Contractor Information</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(contractorInfo, null, 2)}
          </pre>
        </div>

        {/* Local Storage */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">LocalStorage Auth Token</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {typeof window !== 'undefined' 
              ? localStorage.getItem('supabase.auth.token') || 'No token found'
              : 'Not in browser'}
          </pre>
        </div>
      </div>
    </div>
  )
}
