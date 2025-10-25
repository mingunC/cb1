'use client'

import { useState, useEffect } from 'react'
import HeroSection from '@/components/HeroSection'
import ProcessSection from '@/components/ProcessSection'
import ProsSection from '@/components/ProsSection'
import PortfolioSection from '@/components/PortfolioSection'
import EventsSection from '@/components/EventsSection'
import CtaSection from '@/components/CtaSection'
import { createBrowserClient } from '@/lib/supabase/clients'

export default function HomePage() {
  const [isContractor, setIsContractor] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // contractors 테이블에서 확인 (Header와 동일한 로직)
          const { data: contractorData } = await supabase
            .from('contractors')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle()
          
          setIsContractor(!!contractorData)
        }
      } catch (error) {
        console.error('Error checking user role:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserRole()
  }, [])

  return (
    <div className="min-h-screen">
      <HeroSection isContractor={isContractor} />
      <ProcessSection />
      <ProsSection />
      <PortfolioSection />
      <EventsSection />
      <CtaSection />
    </div>
  )
}
