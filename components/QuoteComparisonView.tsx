'use client'

import { useState, useCallback, useMemo } from 'react'
import { 
  Building2, 
  DollarSign, 
  Calendar, 
  FileText, 
  Star, 
  Check, 
  X, 
  ChevronDown,
  Download,
  Phone,
  Mail,
  MapPin,
  Clock,
  Award,
  TrendingUp,
  Eye,
  Users,
  Calendar as CalendarIcon,
  Shield
} from 'lucide-react'

// 타입 정의
interface Quote {
  id: string
  contractorId: string
  companyName: string
  price: number
  submittedAt: string
  description: string
  timeline: string
  rating: number
  completedProjects: number
  yearsExperience: number
  specialties: string[]
  pdfUrl?: string
  contactPhone: string
  contactEmail: string
  isRecommended?: boolean
  pros: string[]
  warranty: string
}

type SortBy = 'price' | 'rating' | 'date'
type ViewMode = 'grid' | 'table'

export default function QuoteComparisonView() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('price')
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState<string | null>(null)

  // 샘플 데이터 (실제로는 props나 API로 받아옴)
  const quotes: Quote[] = [
    {
      id: '1',
      contractorId: 'c1',
      companyName: 'Farm Boys Renovation',
      price: 85000,
      submittedAt: '2025-09-16',
      description: '주방 전체 리모델링 및 맞춤 캐비닛 설치',
      timeline: '6-8주',
      rating: 4.8,
      completedProjects: 127,
      yearsExperience: 12,
      specialties: ['주방', '욕실', '지하실'],
      contactPhone: '416-555-0100',
      contactEmail: 'info@farmboys.ca',
      isRecommended: true,
      pros: ['고급 자재 사용', '10년 품질 보증', '빠른 작업 진행'],
      warranty: '10년 품질 보증'
    },
    {
      id: '2',
      contractorId: 'c2',
      companyName: 'Maple Contractors',
      price: 78000,
      submittedAt: '2025-09-15',
      description: '주방 리노베이션 기본 패키지',
      timeline: '4-6주',
      rating: 4.5,
      completedProjects: 89,
      yearsExperience: 8,
      specialties: ['주방', '바닥재'],
      contactPhone: '416-555-0200',
      contactEmail: 'quote@maple.ca',
      pros: ['경쟁력 있는 가격', '빠른 시공', '깔끔한 마감'],
      warranty: '5년 품질 보증'
    },
    {
      id: '3',
      contractorId: 'c3',
      companyName: 'Premium Builds',
      price: 95000,
      submittedAt: '2025-09-14',
      description: '프리미엄 주방 풀 리노베이션',
      timeline: '8-10주',
      rating: 4.9,
      completedProjects: 203,
      yearsExperience: 15,
      specialties: ['고급 주택', '주방', '전체 리노베이션'],
      contactPhone: '416-555-0300',
      contactEmail: 'luxury@premium.ca',
      pros: ['최고급 자재', '디자이너 협업', '완벽한 A/S'],
      warranty: '15년 품질 보증'
    }
  ]

  // 정렬 함수 (메모이제이션)
  const sortedQuotes = useMemo(() => {
    return [...quotes].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price
        case 'rating':
          return b.rating - a.rating
        case 'date':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        default:
          return 0
      }
    })
  }, [quotes, sortBy])

  // 견적서 선택 핸들러
  const handleSelectQuote = useCallback((id: string) => {
    setSelectedQuotes(prev => 
      prev.includes(id) 
        ? prev.filter(qId => qId !== id)
        : [...prev, id]
    )
  }, [])

  // 전체 선택/해제
  const handleSelectAll = useCallback(() => {
    if (selectedQuotes.length === sortedQuotes.length) {
      setSelectedQuotes([])
    } else {
      setSelectedQuotes(sortedQuotes.map(quote => quote.id))
    }
  }, [selectedQuotes.length, sortedQuotes])

  // 상세 보기 핸들러
  const handleShowDetails = useCallback((id: string) => {
    setShowDetails(prev => prev === id ? null : id)
  }, [])

  // 연락하기 핸들러
  const handleContact = useCallback((quote: Quote) => {
    // 실제로는 연락 모달이나 페이지로 이동
    console.log('Contacting:', quote.companyName)
  }, [])

  // PDF 다운로드 핸들러
  const handleDownloadPDF = useCallback((quote: Quote) => {
    if (quote.pdfUrl) {
      // 실제로는 PDF 다운로드 로직
      console.log('Downloading PDF for:', quote.companyName)
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">받은 견적서 비교</h2>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              총 {quotes.length}개의 견적서
            </span>
            {selectedQuotes.length > 0 && (
              <span className="text-sm text-blue-600 font-medium">
                {selectedQuotes.length}개 선택됨
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* 정렬 옵션 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="price">가격 낮은 순</option>
              <option value="rating">평점 높은 순</option>
              <option value="date">최신 순</option>
            </select>
            
            {/* 보기 모드 전환 */}
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                카드 보기
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                표 보기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 견적서 비교 - 그리드 뷰 */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedQuotes.map((quote) => (
            <div 
              key={quote.id}
              className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 ${
                selectedQuotes.includes(quote.id) 
                  ? 'border-blue-500 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* 추천 배지 */}
              {quote.isRecommended && (
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-t-md">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Award className="h-4 w-4" />
                    추천 업체
                  </div>
                </div>
              )}
              
              <div className="p-6">
                {/* 업체 정보 */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {quote.companyName}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">
                          {quote.rating}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {quote.completedProjects}개 프로젝트
                      </span>
                    </div>
                  </div>
                  
                  <input
                    type="checkbox"
                    checked={selectedQuotes.includes(quote.id)}
                    onChange={() => handleSelectQuote(quote.id)}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                {/* 견적 금액 */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">견적 금액</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ${quote.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 주요 정보 */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">예상 기간: {quote.timeline}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{quote.warranty}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">경력 {quote.yearsExperience}년</span>
                  </div>
                </div>

                {/* 장점 */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">주요 장점</p>
                  <div className="space-y-1">
                    {quote.pros.map((pro, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-600">{pro}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShowDetails(quote.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    상세 보기
                  </button>
                  <button 
                    onClick={() => handleContact(quote)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    연락하기
                  </button>
                </div>

                {/* PDF 다운로드 버튼 */}
                {quote.pdfUrl && (
                  <button
                    onClick={() => handleDownloadPDF(quote)}
                    className="w-full mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    PDF 다운로드
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 견적서 비교 - 테이블 뷰 */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedQuotes.length === sortedQuotes.length && sortedQuotes.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    업체명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    견적 금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    평점
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예상 기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    보증 기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedQuotes.includes(quote.id)}
                        onChange={() => handleSelectQuote(quote.id)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {quote.companyName}
                        </div>
                        {quote.isRecommended && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            추천
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        ${quote.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-900">{quote.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {quote.timeline}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {quote.warranty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleShowDetails(quote.id)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          상세 보기
                        </button>
                        <button 
                          onClick={() => handleContact(quote)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          연락하기
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 선택된 견적서 비교 바 */}
      {selectedQuotes.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {selectedQuotes.length}개 견적서 선택됨
            </span>
            <div className="flex gap-3">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors">
                PDF로 내보내기
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors">
                선택한 견적서 상세 비교
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 보기 모달 (간단한 예시) */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">견적서 상세 정보</h3>
                <button
                  onClick={() => setShowDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              {/* 상세 정보 내용 */}
              <p className="text-gray-600">상세 정보가 여기에 표시됩니다.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
