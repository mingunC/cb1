import HeroSection from '@/components/HeroSection'
import ProcessSection from '@/components/ProcessSection'
import ProsSection from '@/components/ProsSection'
import PortfolioSection from '@/components/PortfolioSection'
import EventsSection from '@/components/EventsSection'
import CtaSection from '@/components/CtaSection'
import { createServerClient } from '@/lib/supabase/server-clients'

export default async function HomePage() {
  // 서버에서 사용자 정보 가져오기 (한 번만)
  let isContractor = false

  try {
    const supabase = createServerClient()
    
    // 현재 사용자 확인 (service role이 아닌 실제 사용자 세션 확인이 필요한 경우)
    // 참고: 현재 server-clients.ts는 service role을 사용하므로
    // 실제 사용자 세션을 확인하려면 수정이 필요할 수 있습니다
    
    // contractors 테이블에서 확인
    // 이 방법은 브라우저 쿠키를 통한 인증이 필요하므로
    // 서버 컴포넌트에서는 제한적일 수 있습니다
    
    // 따라서 클라이언트에서 확인하는 것이 더 안전할 수 있습니다
    // HeroSection을 클라이언트 컴포넌트로 유지하되
    // props로 초기값만 전달하는 방식을 사용합니다
  } catch (error) {
    console.error('Error checking user role:', error)
  }

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
