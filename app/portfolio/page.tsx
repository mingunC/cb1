'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Heart, Eye, ChevronLeft, ChevronRight, X, Building, Home, MapPin } from 'lucide-react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/clients'

interface Portfolio {
  id: string
  contractor_id: string
  title: string
  description: string
  images: string[]
  category?: string
  year?: string
  project_address?: string
  created_at: string
  contractor?: {
    id: string
    company_name: string
    logo_url?: string
  }
}

function PortfolioContent() {
  const searchParams = useSearchParams()
  const contractorIdFromUrl = searchParams?.get('contractor')
  
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    fetchPortfolios()
  }, [contractorIdFromUrl])

  const fetchPortfolios = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 포트폴리오 로딩 시작')
      
      const supabase = createBrowserClient()
      
      let query = supabase
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
      
      if (contractorIdFromUrl) {
        query = query.eq('contractor_id', contractorIdFromUrl)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('❌ 에러:', error)
        return
      }
      
      console.log('✅ 로드된 포트폴리오:', data?.length, '개')
      
      const transformed: Portfolio[] = (data || []).map(p => ({
        id: p.id,
        contractor_id: p.contractor_id,
        title: p.title || '제목 없음',
        description: p.description || '',
        images: Array.isArray(p.images) ? p.images : typeof p.images === 'string' ? [p.images] : [],
        category: p.category,
        year: p.year,
        project_address: p.project_address,
        created_at: p.created_at,
        contractor: p.contractor ? {
          id: p.contractor.id,
          company_name: p.contractor.company_name || '업체명 없음',
          logo_url: p.contractor.company_logo
        } : undefined
      }))

      setPortfolios(transformed)
    } catch (error) {
      console.error('❌ 치명적 에러:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPortfolios = portfolios.filter(p => 
    !searchTerm || 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contractor?.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">인테리어 포트폴리오</h1>
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="업체명, 프로젝트명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        ) : filteredPortfolios.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">포트폴리오가 없습니다</h3>
            <p className="text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : '포트폴리오가 아직 없습니다.'}
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
                <div className="relative h-64 overflow-hidden rounded-t-lg bg-gray-100">
                  {portfolio.images && portfolio.images.length > 0 ? (
                    <img
                      src={portfolio.images[0]}
                      alt={portfolio.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Home className="h-16 w-16" />
                    </div>
                  )}

                  {portfolio.images && portfolio.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded-full">
                      +{portfolio.images.length - 1} 더보기
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{portfolio.title}</h3>
                  
                  {portfolio.contractor && (
                    <div className="flex items-center gap-2 mb-2">
                      {portfolio.contractor.logo_url ? (
                        <img
                          src={portfolio.contractor.logo_url}
                          alt={portfolio.contractor.company_name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <Building className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                      <span className="text-sm text-gray-600">{portfolio.contractor.company_name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    {portfolio.category && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {portfolio.category}
                      </span>
                    )}
                    {portfolio.year && (
                      <span className="text-xs text-gray-500">
                        {portfolio.year}
                      </span>
                    )}
                  </div>

                  {portfolio.project_address && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="line-clamp-1">{portfolio.project_address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPortfolio && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPortfolio(null)}>
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold">{selectedPortfolio.title}</h2>
              <button onClick={() => setSelectedPortfolio(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedPortfolio.images && selectedPortfolio.images.length > 0 && (
              <div className="relative bg-black">
                <img
                  src={selectedPortfolio.images[currentImageIndex]}
                  alt={`${selectedPortfolio.title} ${currentImageIndex + 1}`}
                  className="w-full h-[500px] object-contain"
                />
                
                {selectedPortfolio.images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    
                    <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
                      {currentImageIndex + 1} / {selectedPortfolio.images.length}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="p-6">
              {selectedPortfolio.contractor && (
                <div className="flex items-center justify-between mb-6 pb-6 border-b">
                  <div className="flex items-center gap-3">
                    {selectedPortfolio.contractor.logo_url ? (
                      <img src={selectedPortfolio.contractor.logo_url} alt={selectedPortfolio.contractor.company_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <Building className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{selectedPortfolio.contractor.company_name}</h3>
                    </div>
                  </div>
                  <Link href="/pros" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                    업체 보기
                  </Link>
                </div>
              )}

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

              {selectedPortfolio.project_address && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">프로젝트 주소</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <p className="font-medium">{selectedPortfolio.project_address}</p>
                  </div>
                </div>
              )}

              {selectedPortfolio.description && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">프로젝트 설명</h4>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedPortfolio.description}</p>
                </div>
              )}

              <Link href="/quote-request" className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center">
                견적 문의하기
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PortfolioGalleryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">포트폴리오를 불러오는 중...</p>
        </div>
      </div>
    }>
      <PortfolioContent />
    </Suspense>
  )
}
