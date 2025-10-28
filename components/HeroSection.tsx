'use client'

import Link from 'next/link'
import { ArrowRight, Star, Users, Award, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'
import Image from 'next/image'

export default function HeroSection() {
  const [isContractor, setIsContractor] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // users 테이블에서 user_type 확인
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
    <>
      {/* Hero Section with Background Image */}
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
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Interior Specialists in South Florida
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Professional and reliable interior design professionals to transform your home into a personalized masterpiece
            </p>
            <Link
              href="/quote-request"
              onClick={handleQuoteRequest}
              className={`inline-flex items-center px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 ${
                isContractor 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              REQUEST A QUOTE
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-gray-600">Completed Projects</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">5.0 Stars</div>
              <div className="text-gray-600">Customer Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">20 Years</div>
              <div className="text-gray-600">Of Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">10K+ Customer</div>
              <div className="text-gray-600">Satisfied Clients</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Projects Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Most Popular Projects in 2025
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Project Card 1 */}
            <div className="group cursor-pointer">
              <div className="relative h-80 rounded-2xl overflow-hidden mb-4 shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200"></div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white rounded-lg px-4 py-3">
                    <h3 className="font-semibold text-gray-900">Living Room</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Card 2 */}
            <div className="group cursor-pointer">
              <div className="relative h-80 rounded-2xl overflow-hidden mb-4 shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-200"></div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white rounded-lg px-4 py-3">
                    <h3 className="font-semibold text-gray-900">Bed Room</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Card 3 */}
            <div className="group cursor-pointer">
              <div className="relative h-80 rounded-2xl overflow-hidden mb-4 shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-200"></div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white rounded-lg px-4 py-3">
                    <h3 className="font-semibold text-gray-900">Kitchen</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:border-gray-400 transition-colors">
              View All
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
