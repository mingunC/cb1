import Link from 'next/link'
import { ArrowRight, Star, Users, Award } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* 왼쪽 콘텐츠 */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                완벽한{' '}
                <span className="text-blue-600">리노베이션</span>
                <br />
                전문가와 함께
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                신뢰할 수 있는 검증된 업체들과 연결되어 
                꿈의 공간을 현실로 만들어보세요. 
                5단계 간편 견적 요청으로 시작하세요.
              </p>
            </div>

            {/* CTA 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/quote-request"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 flex items-center justify-center group"
              >
                무료 견적 요청하기
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/pros"
                className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 flex items-center justify-center"
              >
                업체 둘러보기
              </Link>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">검증된 업체</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">4.8</div>
                <div className="text-sm text-gray-600">평균 평점</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">1000+</div>
                <div className="text-sm text-gray-600">완료 프로젝트</div>
              </div>
            </div>
          </div>

          {/* 오른쪽 이미지/일러스트레이션 */}
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl p-8 lg:p-12">
              <div className="space-y-6">
                {/* 프로젝트 카드들 */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">K</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">주방 리노베이션</h3>
                      <p className="text-sm text-gray-600">김○○님의 프로젝트</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">5.0 (12 리뷰)</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">B</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">욕실 리노베이션</h3>
                      <p className="text-sm text-gray-600">박○○님의 프로젝트</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">4.9 (8 리뷰)</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">L</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">전체 리노베이션</h3>
                      <p className="text-sm text-gray-600">이○○님의 프로젝트</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">4.8 (15 리뷰)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
