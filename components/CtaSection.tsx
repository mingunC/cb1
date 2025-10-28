'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'
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
    <section className="py-20 bg-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* 메인 메시지 */}
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Space?
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto">
            Get started with your renovation journey today
          </p>

          {/* CTA 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/quote-request"
              onClick={handleQuoteRequest}
              className={`border-2 border-white text-white bg-transparent hover:bg-white hover:text-emerald-950 px-8 py-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center group ${
                isContractor 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              Get Your Free Quote
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pros"
              className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-emerald-950 px-8 py-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center"
            >
              Browse Professionals
            </Link>
          </div>

          {/* Bottom Features */}
          <div className="pt-8 border-t border-amber-600/30">
            <div className="flex justify-center items-center space-x-12 text-white">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 mb-1">100%</div>
                <div className="text-sm text-white/80">Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 mb-1">24/7</div>
                <div className="text-sm text-white/80">Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 mb-1">Free</div>
                <div className="text-sm text-white/80">Consultation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
