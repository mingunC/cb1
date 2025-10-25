'use client'

import HeroSection from '@/components/HeroSection'
import ProcessSection from '@/components/ProcessSection'
import ProsSection from '@/components/ProsSection'
import PortfolioSection from '@/components/PortfolioSection'
import EventsSection from '@/components/EventsSection'
import CtaSection from '@/components/CtaSection'
import { useUser } from '@/contexts/UserContext'

export default function HomePage() {
  const { isContractor } = useUser()

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
