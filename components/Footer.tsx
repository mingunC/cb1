import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react'

export default function Footer() {
  const footerLinks = {
    company: [
      { name: '회사소개', href: '/about' },
      { name: '채용정보', href: '/careers' },
      { name: '이용약관', href: '/terms' },
      { name: '개인정보처리방침', href: '/privacy' }
    ],
    service: [
      { name: '견적 요청', href: '/quote-request' },
      { name: '업체 찾기', href: '/pros' },
      { name: '포트폴리오', href: '/portfolio' },
      { name: '이벤트', href: '/events' }
    ],
    support: [
      { name: '고객센터', href: '/support' },
      { name: '자주 묻는 질문', href: '/faq' },
      { name: '문의하기', href: '/contact' },
      { name: '사용 가이드', href: '/guide' }
    ]
  }

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'YouTube', icon: Youtube, href: '#' }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="ml-2 text-xl font-bold">Renovation</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm">
              신뢰할 수 있는 전문 업체와 연결되어 완벽한 리노베이션을 경험하세요. 
              간편한 견적 요청으로 시작하는 새로운 공간의 시작.
            </p>
            
            {/* 연락처 정보 */}
            <div className="space-y-3">
              <div className="flex items-center text-gray-400">
                <Mail className="h-4 w-4 mr-3" />
                <span className="text-sm">support@renovation.co.kr</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Phone className="h-4 w-4 mr-3" />
                <span className="text-sm">1588-0000</span>
              </div>
              <div className="flex items-center text-gray-400">
                <MapPin className="h-4 w-4 mr-3" />
                <span className="text-sm">서울시 강남구 테헤란로 123</span>
              </div>
            </div>
          </div>

          {/* 회사 링크 */}
          <div>
            <h3 className="font-semibold text-lg mb-4">회사</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 서비스 링크 */}
          <div>
            <h3 className="font-semibold text-lg mb-4">서비스</h3>
            <ul className="space-y-3">
              {footerLinks.service.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 지원 링크 */}
          <div>
            <h3 className="font-semibold text-lg mb-4">지원</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* 소셜 미디어 */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">소셜 미디어</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-colors duration-200"
                      aria-label={social.name}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 구분선 */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 Renovation Platform. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <span>사업자등록번호: 123-45-67890</span>
              <span>통신판매업신고: 2024-서울강남-1234</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
