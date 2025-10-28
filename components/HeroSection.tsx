'use client'

import Link from 'next/link'
import { ArrowRight, Award, Users, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import Image from 'next/image'

export default function HeroSection() {
  const [isContractor, setIsContractor] = useState(false)

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
    <>
      {/* Luxury Hero Section */}
      <section className="relative h-[700px] lg:h-[800px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/luxury-sofa.jpg"
            alt="Luxury Interior"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          {/* Dark Green Overlay with opacity */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/80 via-emerald-900/70 to-emerald-950/90"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 h-full flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            {/* Main Title */}
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight tracking-tight">
              Across Canada
            </h1>
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg px-6 py-5 shadow-2xl border border-amber-600/20 hover:shadow-amber-600/10 transition-all">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-10 w-10 bg-amber-600/10 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-gray-900 leading-none">150+</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-amber-600 uppercase tracking-wide">Premium Partners</div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-lg px-6 py-5 shadow-2xl border border-amber-600/20 hover:shadow-amber-600/10 transition-all">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-10 w-10 bg-amber-600/10 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-gray-900 leading-none">15+</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-amber-600 uppercase tracking-wide">Years of Experience</div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-lg px-6 py-5 shadow-2xl border border-amber-600/20 hover:shadow-amber-600/10 transition-all">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-10 w-10 bg-amber-600/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-gray-900 leading-none">98%</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-amber-600 uppercase tracking-wide">Client Satisfaction</div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-12">
              <Link
                href="/quote-request"
                onClick={handleQuoteRequest}
                className={`inline-flex items-center px-10 py-4 rounded-lg text-lg font-semibold transition-all duration-300 ${
                  isContractor 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/50 hover:shadow-xl hover:shadow-amber-600/50'
                }`}
              >
                Get Your Free Quote
                <ArrowRight className="ml-3 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
