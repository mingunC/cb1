'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import QuoteRequestForm from '@/components/QuoteRequestForm'

export default function QuoteRequestPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session || !session.user) {
          console.log('No session found, redirecting to login')
          setIsLoading(false)  // ⚡ Immediately release loading
          router.push('/login')
          return
        }
        
        console.log('Session found for user:', session.user.email)
        setIsAuthenticated(true)
        setIsLoading(false)  // ⚡ Immediately release loading
      } catch (error) {
        console.error('Auth check error:', error)
        setIsLoading(false)  // ⚡ Release loading even on error
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-gray-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Unauthenticated (redirecting)
  if (!isAuthenticated) {
    return null
  }

  // Show form only when authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-gray-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Request a Free Quote
          </h1>
          <div className="w-20 h-1 bg-amber-600 mx-auto mb-4"></div>
        </div>

        {/* Quote request form */}
        <QuoteRequestForm />
      </div>
    </div>
  )
}
