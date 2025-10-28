'use client'

import Link from 'next/link'
import { ArrowRight, Users, Award, CheckCircle } from 'lucide-react'
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
      {/* Hero Section with Dark Green Luxury Room Background */}
      <section className="relative h-[600px] lg:h-[700px] overflow-hidden">
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

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight">
              Trusted Renovation Experts Across Canada
            </h1>
            
            {/* Statistics Boxes */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg">
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">150+</div>
                <div className="text-sm text-gray-600">Partners</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg">
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">15+</div>
                <div className="text-sm text-gray-600">Years</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg">
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">98%</div>
                <div className="text-sm text-gray-600">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
