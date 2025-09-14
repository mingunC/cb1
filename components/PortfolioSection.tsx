import { Eye, Heart, Calendar } from 'lucide-react'

export default function PortfolioSection() {
  const portfolios = [
    {
      id: 1,
      title: '모던 주방 리노베이션',
      description: '화이트와 우드톤이 조화를 이룬 모던한 주방 공간',
      type: '주방',
      budget: '80만원',
      duration: '3주',
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
      likes: 24,
      views: 156,
      contractor: '김리노베이션',
      featured: true
    },
    {
      id: 2,
      title: '럭셔리 욕실 리뉴얼',
      description: '대리석과 골드 액센트가 돋보이는 고급스러운 욕실',
      type: '욕실',
      budget: '120만원',
      duration: '2주',
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
      likes: 18,
      views: 89,
      contractor: '퍼펙트홈',
      featured: true
    },
    {
      id: 3,
      title: '미니멀 전체 리노베이션',
      description: '깔끔하고 실용적인 미니멀 디자인으로 완전히 새로워진 공간',
      type: '전체',
      budget: '200만원',
      duration: '6주',
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
      likes: 32,
      views: 234,
      contractor: '스마트리노',
      featured: false
    },
    {
      id: 4,
      title: '인더스트리얼 지하실',
      description: '노출된 벽돌과 철재로 만든 인더스트리얼 스타일의 멀티룸',
      type: '지하실',
      budget: '150만원',
      duration: '4주',
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
      likes: 15,
      views: 67,
      contractor: '김리노베이션',
      featured: false
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            완성된 프로젝트 갤러리
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            실제 고객들의 만족스러운 리노베이션 결과물을 확인해보세요. 
            다양한 스타일과 예산대의 프로젝트를 만나보실 수 있습니다.
          </p>
        </div>

        {/* 필터 탭 */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 rounded-xl p-1">
            <button className="px-6 py-2 bg-white text-gray-900 rounded-lg shadow-sm font-medium">
              전체
            </button>
            <button className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium">
              주방
            </button>
            <button className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium">
              욕실
            </button>
            <button className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium">
              전체
            </button>
            <button className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium">
              지하실
            </button>
          </div>
        </div>

        {/* 포트폴리오 그리드 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
              {/* 이미지 */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                  <span className="text-4xl font-bold text-blue-600">{portfolio.type}</span>
                </div>
                
                {/* 오버레이 */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-4">
                    <button className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors">
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 예산 배지 */}
                <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-gray-900">{portfolio.budget}</span>
                </div>

                {/* 기간 배지 */}
                <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-gray-900">{portfolio.duration}</span>
                </div>
              </div>

              {/* 콘텐츠 */}
              <div className="p-6">
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 mb-1">{portfolio.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{portfolio.description}</p>
                </div>

                {/* 업체 정보 */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{portfolio.contractor}</span>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <Heart className="h-3 w-3 mr-1" />
                      {portfolio.likes}
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {portfolio.views}
                    </div>
                  </div>
                </div>

                {/* 상세보기 버튼 */}
                <button className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200">
                  상세보기
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 더 보기 버튼 */}
        <div className="text-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-colors duration-200">
            더 많은 프로젝트 보기
          </button>
        </div>
      </div>
    </section>
  )
}
