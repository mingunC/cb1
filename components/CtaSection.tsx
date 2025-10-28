'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'

export default function CtaSection() {
  const [isContractor, setIsContractor] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('user_type')
            .eq('id', user.id)
            .maybeSingle()
          
          setIsContractor(userData?.user_type === 'contractor')
        }
      } catch (error) {
        console.error('Error checking user role:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserRole()
  }, [])

  const handleQuoteRequest = (e: React.MouseEvent) => {
    if (isContractor) {
      e.preventDefault()
      alert('Contractors cannot request quotes.')
    }
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 relative overflow-hidden">
      {/* Radial gradient background */}
      <div className="absolute inset-0 bg-gradient-radial from-emerald-900/50 via-emerald-950 to-emerald-950"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Top Icon - Golden leaves/floral */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="h-12 w-12 sm:h-14 sm:w-14 bg-emerald-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>

          {/* Main Title */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-gray-200 mb-4 sm:mb-6 tracking-tight">
            Ready to Transform{' '}
            <span className="text-amber-400">Your Space?</span>
          </h2>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Start right now. Professionals will transform your vision into reality.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16">
            <Link
              href="/quote-request"
              onClick={handleQuoteRequest}
              className={`inline-flex items-center justify-center bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-base transition-all duration-200 ${
                isContractor 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              Get Your Free Quote
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/pros"
              className="inline-flex items-center justify-center border-2 border-gray-300 text-gray-200 bg-transparent hover:bg-white/10 px-8 py-3 rounded-lg font-semibold text-base transition-all duration-200"
            >
              Browse Professionals
            </Link>
          </div>

          {/* Horizontal Divider */}
          <div className="mx-auto w-3/4 max-w-2xl h-px bg-gray-600 mb-12"></div>

          {/* Bottom Stats */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12 lg:gap-16">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-gray-300 mb-2">100%</div>
              <div className="text-sm text-gray-400">Verified Pros</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-gray-300 mb-2">24/7</div>
              <div className="text-sm text-gray-400">Support</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-gray-300 mb-2">Free</div>
              <div className="text-sm text-gray-400">Consultation</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}