'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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
      {/* Hero Section - Mobile Optimized */}
      <section className="relative h-[500px] sm:h-[600px] lg:h-[700px] overflow-hidden">
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
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 h-full flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-0">
          <div className="w-full">
            {/* Main Layout: Stacked on Mobile, Side by Side on Desktop */}
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start mb-8 lg:mb-12">
              {/* Main Title */}
              <div className="max-w-2xl">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-tight mb-4 lg:mb-6">
                  Trusted Renovation Experts Across Canada
                </h1>
              </div>

              {/* Info Box */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 sm:p-8 shadow-lg">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 lg:mb-6">
                  Canada Beaver simplifies the complex process of furnishing all-inclusive, boutique & high-end hotels, and luxury residences in Canada.
                </p>
                <Link
                  href="/quote-request"
                  onClick={handleQuoteRequest}
                  className={`inline-flex items-center gap-3 px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 w-full sm:w-auto justify-center ${
                    isContractor 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-50 shadow-md'
                  }`}
                >
                  Start Your Furnishing Journey
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </div>
            </div>

            {/* Statistics Boxes - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-4 sm:px-8 sm:py-6 shadow-lg">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">0</div>
                <div className="text-xs sm:text-sm text-gray-600 uppercase tracking-wide">Free Quote</div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-4 sm:px-8 sm:py-6 shadow-lg">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">15+</div>
                <div className="text-xs sm:text-sm text-gray-600 uppercase tracking-wide">Years of Excellence</div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-4 sm:px-8 sm:py-6 shadow-lg">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">98%</div>
                <div className="text-xs sm:text-sm text-gray-600 uppercase tracking-wide">Client Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
