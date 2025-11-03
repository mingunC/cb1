import HeroSection from '@/components/HeroSection'
import ProcessSection from '@/components/ProcessSection'
import PortfolioSection from '@/components/PortfolioSection'
import EventsSection from '@/components/EventsSection'
import CtaSection from '@/components/CtaSection'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ProcessSection />
      <PortfolioSection />
      <EventsSection />
      <CtaSection />
    </div>
  )
}
