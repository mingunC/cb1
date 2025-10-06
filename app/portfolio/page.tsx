'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, MapPin, DollarSign, Calendar, Heart, Eye, ChevronLeft, ChevronRight, X, Building, Home, Store } from 'lucide-react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/clients'

interface Portfolio {
  id: string
  contractor_id: string
  title: string
  description: string
  images: string[]
  likes_count: number
  views_count: number
  created_at: string
  category?: string
  year?: string
  contractor?: {
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
      console.log('🔍 포트폴리오 데이터 로딩 시작...')
      
      const supabase = createBrowserClient()
      
      // portfolios 테이블에서 데이터 가져오기
      const { data, error } = await supabase
        .from('portfolios')
        .select(`
          *,
          contractor:contractors(
            id,
            company_name,
            company_logo
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ 포트폴리오 로드 에러:', error)
        throw error
      }
      
      console.log('✅ 포트폴리오 데이터 로드 성공:', data?.length, '개')
      console.log('📊 원본 데이터:', data)
      
      // 데이터 변환
      const transformedData: Portfolio[] = (data || []).map(p => {
        // images 배열 처리
        let imageArray: string[] = []
        if (Array.isArray(p.images)) {
          imageArray = p.images
        } else if (typeof p.images === 'string') {
          imageArray = [p.images]
        }
        
        console.log(`Portfolio "${p.title}" images:`, imageArray)
        
        return {
          id: p.id,
          contractor_id: p.contractor_id,
          title: p.title || '제목 없음',
          description: p.description || '',
          images: imageArray,
          category: p.category || '기타',
          year: p.year || new Date().getFullYear().toString(),
          likes_count: 0,
          views_count: 0,
          created_at: p.created_at,
          contractor: p.contractor ? {
            id: p.contractor.id,
            company_name: p.contractor.company_name || '업체명 없음',
            logo_url: p.contractor.company_logo
          } : undefined
        }
      })

      setPortfolios(transformedData)
      setFilteredPortfolios(transformedData)
      
      if (transformedData.length === 0) {
        console.log('⚠️ 포트폴리오가 비어있습니다. 업체가 포트폴리오를 업로드해야 합니다.')
      }
    } catch (error) {
      console.error('❌ Error fetching portfolios:', error)
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
        p.contractor?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 카테고리 필터
    if (filters.spaceType !== 'all') {
      filtered = filtered.filter(p => p.category === filters.spaceType)
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'popular':
          return b.likes_count - a.likes_count
        case 'latest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredPortfolios(filtered)
  }, [searchTerm, filters, portfolios])

  // 이미지 갤러리 네비게이션
  const nextImage = () => {
    if (selectedPortfolio && selectedPortfolio.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === selectedPortfolio.images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (selectedPortfolio && selectedPortfolio.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedPortfolio.images.length - 1 : prev - 1
      )
    }
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
                  placeholder="업체명, 프로젝트명으로 검색..."
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <select
                  value={filters.spaceType}
                  onChange={(e) => setFilters(prev => ({ ...prev, spaceType: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">모든 카테고리</option>
                  <option value="주거공간">주거공간</option>
                  <option value="상업공간">상업공간</option>
                </select>

                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="latest">최신순</option>
                  <option value="popular">인기순</option>
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
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">포트폴리오가 없습니다</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? '검색 결과가 없습니다.' : '업체들이 포트폴리오를 업로드하면 여기에 표시됩니다.'}
            </p>
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
                <div className="relative h-64 overflow-hidden rounded-t-lg bg-gray-100">
                  {portfolio.images && portfolio.images.length > 0 ? (
                    <img
                      src={portfolio.images[0]}
                      alt={portfolio.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Home className="h-16 w-16" />
                    </div>
                  )}
                  
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
                  {portfolio.images && portfolio.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded-full">
                      +{portfolio.images.length - 1} 더보기
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{portfolio.title}</h3>
                  
                  {portfolio.contractor && (
                    <div className="flex items-center gap-2 mb-2">
                      {portfolio.contractor.logo_url ? (
                        <img
                          src={portfolio.contractor.logo_url}
                          alt={portfolio.contractor.company_name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                          <Building className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                      <span className="text-sm text-gray-600">{portfolio.contractor.company_name}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    {portfolio.category && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {portfolio.category}
                      </span>
                    )}
                    {portfolio.year && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {portfolio.year}
                      </span>
                    )}
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
                      {new Date(portfolio.created_at).toLocaleDateString('ko-KR')}
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
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold">{selectedPortfolio.title}</h2>
              <button
                onClick={() => setSelectedPortfolio(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 이미지 갤러리 */}
            {selectedPortfolio.images && selectedPortfolio.images.length > 0 && (
              <div className="relative bg-black">
                <img
                  src={selectedPortfolio.images[currentImageIndex]}
                  alt={`${selectedPortfolio.title} ${currentImageIndex + 1}`}
                  className="w-full h-[500px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x500?text=No+Image'
                  }}
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

                    {/* 이미지 카운터 */}
                    <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
                      {currentImageIndex + 1} / {selectedPortfolio.images.length}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 상세 정보 */}
            <div className="p-6">
              {/* 업체 정보 */}
              {selectedPortfolio.contractor && (
                <div className="flex items-center justify-between mb-6 pb-6 border-b">
                  <div className="flex items-center gap-3">
                    {selectedPortfolio.contractor.logo_url ? (
                      <img
                        src={selectedPortfolio.contractor.logo_url}
                        alt={selectedPortfolio.contractor.company_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <Building className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{selectedPortfolio.contractor.company_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {selectedPortfolio.contractor.rating && (
                          <span>⭐ {selectedPortfolio.contractor.rating}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/pros`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    업체 보기
                  </Link>
                </div>
              )}

              {/* 프로젝트 정보 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedPortfolio.category && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">카테고리</p>
                    <p className="font-medium">{selectedPortfolio.category}</p>
                  </div>
                )}
                {selectedPortfolio.year && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">완료 연도</p>
                    <p className="font-medium">{selectedPortfolio.year}</p>
                  </div>
                )}
              </div>

              {/* 설명 */}
              {selectedPortfolio.description && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">프로젝트 설명</h4>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedPortfolio.description}</p>
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
                <Link
                  href="/quote-request"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center"
                >
                  견적 문의하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
