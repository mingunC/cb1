import HeroSection from '@/components/HeroSection'
import ProcessSection from '@/components/ProcessSection'
import ProsSection from '@/components/ProsSection'
import PortfolioSection from '@/components/PortfolioSection'
import EventsSection from '@/components/EventsSection'
import CtaSection from '@/components/CtaSection'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ProcessSection />
      <ProsSection />
      <PortfolioSection />
      <EventsSection />
      <CtaSection />
    </div>
  )
}
