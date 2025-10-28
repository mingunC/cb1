'use client'

import Link from 'next/link'
import { ArrowRight, Award, Clock, Gift } from 'lucide-react'
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
    <section className="py-24 bg-gradient-to-b from-emerald-950 to-emerald-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main Title */}
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to Transform Your Space?
          </h2>
          <div className="w-24 h-1 bg-amber-600 mx-auto mb-8"></div>
          
          <p className="text-xl text-white/90 mb-16 max-w-3xl mx-auto leading-relaxed">
            Get started with your renovation journey today
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link
              href="/quote-request"
              onClick={handleQuoteRequest}
              className={`border-2 border-amber-600 bg-amber-600 text-white hover:bg-amber-700 hover:border-amber-700 px-10 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center group shadow-lg shadow-amber-600/30 ${
                isContractor 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              Get Your Free Guide
              <ArrowRight className="ml-3 h-5 w-5" />
            </Link>
            <Link
              href="/pros"
              className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-emerald-950 px-10 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center shadow-lg"
            >
              Browse Professionals
            </Link>
          </div>

          {/* Bottom Features */}
          <div className="pt-12 border-t border-amber-600/30">
            <div className="flex flex-wrap justify-center items-center gap-12 text-white">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Award className="h-8 w-8 text-amber-600" />
                </div>
                <div className="text-4xl font-bold text-amber-600 mb-2">100%</div>
                <div className="text-sm text-white/80 uppercase tracking-wide">Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
                <div className="text-4xl font-bold text-amber-600 mb-2">24/7</div>
                <div className="text-sm text-white/80 uppercase tracking-wide">Support</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Gift className="h-8 w-8 text-amber-600" />
                </div>
                <div className="text-4xl font-bold text-amber-600 mb-2">Free</div>
                <div className="text-sm text-white/80 uppercase tracking-wide">Consultation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
