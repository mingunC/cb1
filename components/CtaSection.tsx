import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'

export default function CtaSection() {
  const benefits = [
    '무료 견적 요청',
    '검증된 전문 업체',
    '투명한 가격 정보',
    '품질 보장 서비스'
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* 메인 메시지 */}
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            복잡한 리노베이션 과정을 간단하게 만들어드립니다. 
            전문 업체들이 직접 연락드려 맞춤형 견적을 제공합니다.
          </p>

          {/* 혜택 리스트 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center justify-center text-white">
                <CheckCircle className="h-5 w-5 mr-2 text-green-300" />
                <span className="text-sm lg:text-base">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote-request"
              className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 flex items-center justify-center group"
            >
              무료 견적 요청하기
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pros"
              className="border-2 border-white hover:bg-white hover:text-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 flex items-center justify-center"
            >
              업체 둘러보기
            </Link>
          </div>

          {/* 신뢰 지표 */}
          <div className="mt-16 pt-8 border-t border-blue-500">
            <p className="text-blue-200 text-sm mb-4">신뢰받는 플랫폼</p>
            <div className="flex justify-center items-center space-x-8 text-blue-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-sm">검증된 업체</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">1000+</div>
                <div className="text-sm">완료 프로젝트</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">4.8</div>
                <div className="text-sm">평균 평점</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
