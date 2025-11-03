import HeroSection from '@/components/HeroSection'
import ProcessSection from '@/components/ProcessSection'
import PortfolioSection from '@/components/PortfolioSection'
import ProsSection from '@/components/ProsSection'
import EventsSection from '@/components/EventsSection'
import CtaSection from '@/components/CtaSection'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ProcessSection />
      <PortfolioSection />
      <ProsSection />
      <EventsSection />
      <CtaSection />
    </div>
  )
}
