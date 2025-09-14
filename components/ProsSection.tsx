import { Star, MapPin, Award, CheckCircle } from 'lucide-react'

export default function ProsSection() {
  const pros = [
    {
      id: 1,
      name: '김리노베이션',
      contact: '김대표',
      rating: 4.9,
      reviewCount: 127,
      location: '서울 강남구',
      specialties: ['주방', '욕실', '전체'],
      experience: '15년',
      verified: true,
      featured: true,
      avatar: 'K'
    },
    {
      id: 2,
      name: '퍼펙트홈',
      contact: '박대표',
      rating: 4.8,
      reviewCount: 89,
      location: '서울 서초구',
      specialties: ['욕실', '지하실'],
      experience: '12년',
      verified: true,
      featured: true,
      avatar: 'P'
    },
    {
      id: 3,
      name: '스마트리노',
      contact: '이대표',
      rating: 4.7,
      reviewCount: 156,
      location: '서울 송파구',
      specialties: ['주방', '전체'],
      experience: '18년',
      verified: true,
      featured: false,
      avatar: 'S'
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            검증된 전문 업체들
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            엄격한 심사를 통과한 신뢰할 수 있는 업체들입니다. 
            모든 업체는 보험 가입과 면허 보유를 확인했습니다.
          </p>
        </div>

        {/* 업체 카드들 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {pros.map((pro) => (
            <div key={pro.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              {/* 업체 헤더 */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{pro.avatar}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{pro.name}</h3>
                      <p className="text-sm text-gray-600">{pro.contact}</p>
                    </div>
                  </div>
                  
                  {/* 인증 배지 */}
                  {pro.verified && (
                    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      <CheckCircle className="h-3 w-3" />
                      <span className="text-xs font-medium">인증</span>
                    </div>
                  )}
                </div>

                {/* 평점과 리뷰 */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${
                          i < Math.floor(pro.rating) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{pro.rating}</span>
                  <span className="text-sm text-gray-500">({pro.reviewCount} 리뷰)</span>
                </div>

                {/* 위치 */}
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  {pro.location}
                </div>
              </div>

              {/* 업체 정보 */}
              <div className="p-6">
                {/* 경력 */}
                <div className="flex items-center mb-4">
                  <Award className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">{pro.experience} 경력</span>
                </div>

                {/* 전문 분야 */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">전문 분야</h4>
                  <div className="flex flex-wrap gap-2">
                    {pro.specialties.map((specialty, index) => (
                      <span 
                        key={index}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA 버튼 */}
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200">
                  프로필 보기
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 더 보기 버튼 */}
        <div className="text-center">
          <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-xl text-lg font-semibold transition-colors duration-200">
            모든 업체 보기
          </button>
        </div>
      </div>
    </section>
  )
}
