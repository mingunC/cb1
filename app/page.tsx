import HeroSection from '@/components/HeroSection'
import WhyChooseUsSection from '@/components/WhyChooseUsSection'
import ServiceProcessSection from '@/components/ServiceProcessSection'
import ProcessSection from '@/components/ProcessSection'
import PortfolioSection from '@/components/PortfolioSection'
import SocialMediaSection from '@/components/SocialMediaSection'
import CtaSection from '@/components/CtaSection'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <WhyChooseUsSection />
      <ServiceProcessSection />
      <ProcessSection />
      <PortfolioSection />
      <SocialMediaSection />
      <CtaSection />
    </div>
  )
}
