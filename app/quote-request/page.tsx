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
    let mounted = true
    
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (!session || !session.user) {
          console.log('No session found, redirecting to login')
          router.push('/login')
          return
        }
        
        console.log('Session found for user:', session.user.email)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Auth check error:', error)
        if (mounted) {
          router.push('/login')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()
    
    return () => {
      mounted = false
    }
  }, [router])

  // 로딩 중
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

  // 인증되지 않은 경우 (리다이렉트 중)
  if (!isAuthenticated) {
    return null
  }

  // 인증된 경우에만 폼 표시
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-gray-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 페이지 헤더 */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Request a Free Quote
          </h1>
          <div className="w-20 h-1 bg-amber-600 mx-auto mb-4"></div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Complete in 6 simple steps.
          </p>
        </div>

        {/* 견적 요청 폼 */}
        <QuoteRequestForm />
      </div>
    </div>
  )
}
