'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, MapPin, DollarSign, Calendar, Heart, Eye, ChevronLeft, ChevronRight, X, Building, Home, Store, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Portfolio {
  id: string
  contractor_id: string
  title: string
  description: string
  project_type: string
  space_type: string
  location: string
  budget_range: string
  completion_date: string
  duration: string
  size: number
  images: string[]
  before_images?: string[]
  after_images?: string[]
  tags: string[]
  likes_count: number
  views_count: number
  created_at: string
  contractor: {
    id: string
    company_name: string
    logo_url?: string
    rating?: number
    total_projects?: number
  }
}

type FilterState = {
  projectType: string
  spaceType: string
  budgetRange: string
  location: string
  sortBy: 'latest' | 'popular' | 'budget_high' | 'budget_low'
}

export default function PortfolioGalleryPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [filteredPortfolios, setFilteredPortfolios] = useState<Portfolio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    projectType: 'all',
    spaceType: 'all',
    budgetRange: 'all',
    location: 'all',
    sortBy: 'latest'
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [likedPortfolios, setLikedPortfolios] = useState<Set<string>>(new Set())

  // 포트폴리오 데이터 로드
  useEffect(() => {
    fetchPortfolios()
    loadLikedPortfolios()
  }, [])

  const fetchPortfolios = async () => {
    try {
      setIsLoading(true)
      
      // 더미 데이터 사용 (데이터베이스 연결 없이)
      const dummyData: Portfolio[] = [
        {
          id: '1',
          contractor_id: 'c1',
          title: '모던 리빙룸 인테리어',
          description: '심플하고 세련된 모던 스타일의 리빙룸 인테리어입니다. 화이트와 그레이 톤을 기본으로 우드 소재를 포인트로 사용했습니다.',
          project_type: 'renovation',
          space_type: 'living_room',
          location: '서울 강남구',
          budget_range: '3000-5000',
          completion_date: '2024-03-15',
          duration: '45일',
          size: 33,
          images: [
            'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
          ],
          before_images: ['https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800'],
          after_images: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800'],
          tags: ['모던', '미니멀', '화이트인테리어'],
          likes_count: 245,
          views_count: 1520,
          created_at: '2024-03-20',
          contractor: {
            id: 'c1',
            company_name: '디자인하우스',
            logo_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center',
            rating: 4.8,
            total_projects: 127
          }
        },
        {
          id: '2',
          contractor_id: 'c2',
          title: '북유럽 스타일 원룸 인테리어',
          description: '작은 공간을 효율적으로 활용한 북유럽 스타일 원룸입니다. 따뜻한 우드톤과 파스텔 컬러로 아늑한 분위기를 연출했습니다.',
          project_type: 'full_interior',
          space_type: 'studio',
          location: '서울 마포구',
          budget_range: '1500-3000',
          completion_date: '2024-02-28',
          duration: '30일',
          size: 20,
          images: [
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
            'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800',
            'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800'
          ],
          tags: ['북유럽', '원룸', '공간활용'],
          likes_count: 189,
          views_count: 982,
          created_at: '2024-03-18',
          contractor: {
            id: 'c2',
            company_name: '노르딕 인테리어',
            rating: 4.6,
            total_projects: 89
          }
        },
        {
          id: '3',
          contractor_id: 'c3',
          title: '럭셔리 마스터 베드룸',
          description: '호텔같은 분위기의 럭셔리한 마스터 베드룸입니다. 고급 자재와 조명으로 품격있는 공간을 완성했습니다.',
          project_type: 'renovation',
          space_type: 'bedroom',
          location: '서울 서초구',
          budget_range: '5000-10000',
          completion_date: '2024-04-01',
          duration: '60일',
          size: 45,
          images: [
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
            'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800'
          ],
          tags: ['럭셔리', '마스터베드룸', '호텔스타일'],
          likes_count: 312,
          views_count: 2103,
          created_at: '2024-04-05',
          contractor: {
            id: 'c3',
            company_name: '프리미엄 디자인',
            rating: 4.9,
            total_projects: 156
          }
        },
        {
          id: '4',
          contractor_id: 'c4',
          title: '미니멀 주방 리모델링',
          description: '깔끔하고 실용적인 미니멀 주방입니다. 수납공간을 극대화하고 동선을 효율적으로 설계했습니다.',
          project_type: 'renovation',
          space_type: 'kitchen',
          location: '경기 성남시',
          budget_range: '2000-3000',
          completion_date: '2024-03-10',
          duration: '21일',
          size: 15,
          images: [
            'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
            'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800'
          ],
          tags: ['미니멀', '주방', '수납'],
          likes_count: 167,
          views_count: 890,
          created_at: '2024-03-12',
          contractor: {
            id: 'c4',
            company_name: '키친마스터',
            rating: 4.7,
            total_projects: 98
          }
        },
        {
          id: '5',
          contractor_id: 'c5',
          title: '빈티지 카페 인테리어',
          description: '레트로 감성의 빈티지 카페 인테리어입니다. 앤틱 가구와 조명으로 따뜻한 분위기를 연출했습니다.',
          project_type: 'full_interior',
          space_type: 'commercial',
          location: '서울 연남동',
          budget_range: '5000-10000',
          completion_date: '2024-02-15',
          duration: '50일',
          size: 50,
          images: [
            'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
            'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800',
            'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800'
          ],
          tags: ['빈티지', '카페', '상업공간'],
          likes_count: 423,
          views_count: 3210,
          created_at: '2024-02-20',
          contractor: {
            id: 'c5',
            company_name: '스페이스 크리에이터',
            rating: 4.9,
            total_projects: 178
          }
        },
        {
          id: '6',
          contractor_id: 'c6',
          title: '모던 오피스 인테리어',
          description: '업무 효율을 높이는 모던한 오피스 공간입니다. 개방형 구조와 회의실, 휴게공간을 균형있게 배치했습니다.',
          project_type: 'full_interior',
          space_type: 'office',
          location: '서울 강남구',
          budget_range: '10000-99999',
          completion_date: '2024-01-30',
          duration: '75일',
          size: 100,
          images: [
            'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800',
            'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800'
          ],
          tags: ['오피스', '모던', '업무공간'],
          likes_count: 289,
          views_count: 1987,
          created_at: '2024-02-05',
          contractor: {
            id: 'c6',
            company_name: '오피스플랜',
            rating: 4.8,
            total_projects: 145
          }
        }
      ]

      setPortfolios(dummyData)
      setFilteredPortfolios(dummyData)
    } catch (error) {
      console.error('Error fetching portfolios:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 좋아요한 포트폴리오 로드
  const loadLikedPortfolios = () => {
    const saved = localStorage.getItem('liked_portfolios')
    if (saved) {
      setLikedPortfolios(new Set(JSON.parse(saved)))
    }
  }

  // 좋아요 토글
  const toggleLike = (portfolioId: string) => {
    const newLiked = new Set(likedPortfolios)
    if (newLiked.has(portfolioId)) {
      newLiked.delete(portfolioId)
    } else {
      newLiked.add(portfolioId)
    }
    setLikedPortfolios(newLiked)
    localStorage.setItem('liked_portfolios', JSON.stringify(Array.from(newLiked)))
  }

  // 필터링 및 검색
  useEffect(() => {
    let filtered = [...portfolios]

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contractor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // 프로젝트 타입 필터
    if (filters.projectType !== 'all') {
      filtered = filtered.filter(p => p.project_type === filters.projectType)
    }

    // 공간 타입 필터
    if (filters.spaceType !== 'all') {
      filtered = filtered.filter(p => p.space_type === filters.spaceType)
    }

    // 예산 범위 필터
    if (filters.budgetRange !== 'all') {
      filtered = filtered.filter(p => p.budget_range === filters.budgetRange)
    }

    // 지역 필터
    if (filters.location !== 'all') {
      filtered = filtered.filter(p => p.location.includes(filters.location))
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'popular':
          return b.likes_count - a.likes_count
        case 'budget_high':
          return parseInt(b.budget_range.split('-')[1]) - parseInt(a.budget_range.split('-')[1])
        case 'budget_low':
          return parseInt(a.budget_range.split('-')[0]) - parseInt(b.budget_range.split('-')[0])
        case 'latest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredPortfolios(filtered)
  }, [searchTerm, filters, portfolios])

  // 이미지 갤러리 네비게이션
  const nextImage = () => {
    if (selectedPortfolio) {
      setCurrentImageIndex((prev) => 
        prev === selectedPortfolio.images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (selectedPortfolio) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedPortfolio.images.length - 1 : prev - 1
      )
    }
  }

  // 공간 타입 한글 변환
  const getSpaceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'living_room': '거실',
      'bedroom': '침실',
      'kitchen': '주방',
      'bathroom': '욕실',
      'studio': '원룸',
      'office': '사무실',
      'commercial': '상업공간'
    }
    return labels[type] || type
  }

  // 예산 범위 포맷
  const formatBudget = (range: string) => {
    const [min, max] = range.split('-').map(Number)
    if (max >= 10000) return '1억원 이상'
    if (min >= 5000) return '5천만원~1억원'
    if (min >= 3000) return '3천만원~5천만원'
    if (min >= 1500) return '1천5백만원~3천만원'
    return '1천5백만원 미만'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">인테리어 포트폴리오</h1>
            
            {/* 검색바 */}
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="스타일, 업체명, 태그로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
              >
                <Filter className="h-5 w-5" />
                필터
              </button>
            </div>
          </div>

          {/* 필터 패널 */}
          {isFilterOpen && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <select
                  value={filters.projectType}
                  onChange={(e) => setFilters(prev => ({ ...prev, projectType: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">모든 프로젝트</option>
                  <option value="full_interior">전체 인테리어</option>
                  <option value="renovation">리모델링</option>
                  <option value="partial">부분 인테리어</option>
                </select>

                <select
                  value={filters.spaceType}
                  onChange={(e) => setFilters(prev => ({ ...prev, spaceType: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">모든 공간</option>
                  <option value="living_room">거실</option>
                  <option value="bedroom">침실</option>
                  <option value="kitchen">주방</option>
                  <option value="bathroom">욕실</option>
                  <option value="studio">원룸</option>
                  <option value="office">사무실</option>
                  <option value="commercial">상업공간</option>
                </select>

                <select
                  value={filters.budgetRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, budgetRange: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">모든 예산</option>
                  <option value="0-1500">1천5백만원 미만</option>
                  <option value="1500-3000">1천5백만원~3천만원</option>
                  <option value="3000-5000">3천만원~5천만원</option>
                  <option value="5000-10000">5천만원~1억원</option>
                  <option value="10000-99999">1억원 이상</option>
                </select>

                <select
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">모든 지역</option>
                  <option value="서울">서울</option>
                  <option value="경기">경기</option>
                  <option value="인천">인천</option>
                  <option value="부산">부산</option>
                  <option value="대구">대구</option>
                  <option value="광주">광주</option>
                  <option value="대전">대전</option>
                </select>

                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="latest">최신순</option>
                  <option value="popular">인기순</option>
                  <option value="budget_high">높은 가격순</option>
                  <option value="budget_low">낮은 가격순</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 포트폴리오 그리드 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredPortfolios.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPortfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedPortfolio(portfolio)
                  setCurrentImageIndex(0)
                }}
              >
                {/* 이미지 */}
                <div className="relative h-64 overflow-hidden rounded-t-lg">
                  <img
                    src={portfolio.images[0]}
                    alt={portfolio.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* 좋아요 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLike(portfolio.id)
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white transition-colors"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        likedPortfolios.has(portfolio.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>

                  {/* 이미지 개수 배지 */}
                  {portfolio.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded-full">
                      +{portfolio.images.length - 1}
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{portfolio.title}</h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={portfolio.contractor.logo_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=20&h=20&fit=crop&crop=center'}
                      alt={portfolio.contractor.company_name}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-sm text-gray-600">{portfolio.contractor.company_name}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Home className="h-3 w-3" />
                      {getSpaceTypeLabel(portfolio.space_type)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {portfolio.location}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <DollarSign className="h-3 w-3" />
                      {formatBudget(portfolio.budget_range)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Heart className="h-4 w-4" />
                        {portfolio.likes_count}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Eye className="h-4 w-4" />
                        {portfolio.views_count}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(portfolio.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상세보기 모달 */}
      {selectedPortfolio && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedPortfolio.title}</h2>
              <button
                onClick={() => setSelectedPortfolio(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 이미지 갤러리 */}
            <div className="relative">
              <img
                src={selectedPortfolio.images[currentImageIndex]}
                alt={`${selectedPortfolio.title} ${currentImageIndex + 1}`}
                className="w-full h-[500px] object-cover"
              />
              
              {selectedPortfolio.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  
                  {/* 이미지 인디케이터 */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {selectedPortfolio.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 상세 정보 */}
            <div className="p-6">
              {/* 업체 정보 */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedPortfolio.contractor.logo_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=48&h=48&fit=crop&crop=center'}
                    alt={selectedPortfolio.contractor.company_name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold">{selectedPortfolio.contractor.company_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {selectedPortfolio.contractor.rating && (
                        <span>⭐ {selectedPortfolio.contractor.rating}</span>
                      )}
                      {selectedPortfolio.contractor.total_projects && (
                        <span>프로젝트 {selectedPortfolio.contractor.total_projects}개</span>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/contractors/${selectedPortfolio.contractor_id}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  업체 상세보기
                </Link>
              </div>

              {/* 프로젝트 정보 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">공간 유형</p>
                  <p className="font-medium">{getSpaceTypeLabel(selectedPortfolio.space_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">예산</p>
                  <p className="font-medium">{formatBudget(selectedPortfolio.budget_range)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">시공 기간</p>
                  <p className="font-medium">{selectedPortfolio.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">면적</p>
                  <p className="font-medium">{selectedPortfolio.size}평</p>
                </div>
              </div>

              {/* 설명 */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">프로젝트 설명</h4>
                <p className="text-gray-600 leading-relaxed">{selectedPortfolio.description}</p>
              </div>

              {/* 태그 */}
              {selectedPortfolio.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">태그</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPortfolio.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Before & After (있을 경우) */}
              {selectedPortfolio.before_images && selectedPortfolio.after_images && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Before & After</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Before</p>
                      <img
                        src={selectedPortfolio.before_images[0]}
                        alt="Before"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">After</p>
                      <img
                        src={selectedPortfolio.after_images[0]}
                        alt="After"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => toggleLike(selectedPortfolio.id)}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    likedPortfolios.has(selectedPortfolio.id)
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`inline h-5 w-5 mr-2 ${
                    likedPortfolios.has(selectedPortfolio.id) ? 'fill-current' : ''
                  }`} />
                  {likedPortfolios.has(selectedPortfolio.id) ? '좋아요 취소' : '좋아요'}
                </button>
                <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                  견적 문의하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}