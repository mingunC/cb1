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
      alert('업체는 견적 요청을 할 수 없습니다.')
    }
  }

  return (
    <section className="py-24 bg-gradient-to-b from-emerald-900 to-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🏠</span>
            </div>
          </div>

          {/* Main Title */}
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to Transform<br/>Your Space?
          </h2>
          <div className="w-20 h-1 bg-amber-500 mx-auto mb-8"></div>
          
          <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto">
            Start your renovation journey today with trusted professionals
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/quote-request"
              onClick={handleQuoteRequest}
              className={`inline-flex items-center border-2 border-amber-500 bg-amber-500 text-white hover:bg-amber-600 hover:border-amber-600 px-10 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg ${
                isContractor 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              Request a Quote
              <ArrowRight className="ml-3 h-5 w-5" />
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center border-2 border-white text-white bg-transparent hover:bg-white hover:text-emerald-950 px-10 py-4 rounded-lg font-semibold transition-all duration-300"
            >
              Explore Events
            </Link>
          </div>

          {/* Bottom Stats */}
          <div className="pt-12 border-t border-white/20">
            <div className="flex flex-wrap justify-center items-center gap-16 text-white">
              <div className="text-center">
                <div className="text-5xl font-bold text-amber-500 mb-2">100%</div>
                <div className="text-sm text-white/80 uppercase tracking-wide">Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-amber-500 mb-2">24/7</div>
                <div className="text-sm text-white/80 uppercase tracking-wide">Support</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-amber-500 mb-2">Free</div>
                <div className="text-sm text-white/80 uppercase tracking-wide">Consultation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
