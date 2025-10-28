'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/clients'

export default function HeroSection() {
  const [isContractor, setIsContractor] = useState(false)
  const [activeTab, setActiveTab] = useState('PAST')

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
    <section className="relative h-[600px] lg:h-[700px] overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950">
        {/* Overlay Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl text-center mx-auto">
          {/* Main Title */}
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-12 leading-tight tracking-tight">
            Across<br/>Canada
          </h1>
          
          {/* Tabs */}
          <div className="flex justify-center gap-4 mb-8">
            {['PAST', 'PRESENT', 'FUTURE'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-white/90 text-gray-900'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
