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
  const authCheckRef = useRef(false) // Prevent duplicate execution

  useEffect(() => {
    // Prevent duplicate execution if already checking
    if (authCheckRef.current) return
    authCheckRef.current = true

    const checkAuth = async () => {
      console.log('🚀 Contractor page auth check starting...')
      
      try {
        const supabase = createBrowserClient()
        
        // Session check - timeout setting
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        )
        
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any
        
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
        
        // Verify contractor information - timeout setting
        const contractorPromise = supabase
          .from('contractors')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          
        const contractorTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Contractor lookup timeout')), 5000)
        )
        
        const { data: contractor, error: contractorError } = await Promise.race([
          contractorPromise,
          contractorTimeoutPromise
        ]) as any
        
        console.log('🏢 Contractor lookup:', {
          found: !!contractor,
          data: contractor,
          status: contractor?.status,
          error: contractorError
        })
        
        if (!contractor) {
          console.log('❌ Not a contractor, checking user type...')
          
          // Check user_type from users table
          const { data: userData } = await supabase
            .from('users')
            .select('user_type')
            .eq('id', session.user.id)
            .maybeSingle()
          
          if (userData?.user_type === 'contractor') {
            // User is registered as contractor in users table
            // but no data in contractors table
            console.log('⚠️ User is marked as contractor but no contractor data found')
            setIsLoading(false)
            router.push('/contractor-signup?error=missing_contractor_data')
          } else {
            // Regular user case
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
        
        setContractorData(contractor)
        setIsAuthenticated(true)
        setIsLoading(false)
        
      } catch (error) {
        console.error('🔥 Auth check error:', error)
        setIsLoading(false)
        
        // Provide retry option for timeout errors
        if (error instanceof Error && error.message.includes('timeout')) {
          const retry = confirm('Authentication check is delayed. Would you like to try again?')
          if (retry) {
            window.location.reload()
          } else {
            router.push('/contractor-login')
          }
        } else {
          router.push('/contractor-login')
        }
      }
    }
    
    checkAuth()
    
    // Cleanup function
    return () => {
      authCheckRef.current = false
    }
  }, [router])

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
          <p className="mt-2 text-sm text-gray-500">If it takes too long, please refresh the page.</p>
        </div>
      </div>
    )
  }
  
  // Not authenticated
  if (!isAuthenticated || !contractorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }
  
  // Authenticated - use new dashboard component
  return <IntegratedContractorDashboard initialContractorData={contractorData} />
}
