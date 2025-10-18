'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, Search, Calendar, Home, TrendingUp } from 'lucide-react'

interface QuoteRequest {
  id: string
  customer_id: string
  space_type: string
  project_types: string[]
  budget: string
  timeline: string
  visit_date: string
  visit_dates?: string[]
  full_address: string
  postal_code: string
  description: string
  photos: any[]
  status: 'pending' | 'approved' | 'site-visit-pending' | 'site-visit-completed' | 'bidding' | 'bidding-closed' | 'quote-submitted' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAdminAndFetchQuotes()
  }, [])

  const checkAdminAndFetchQuotes = async () => {
    try {
      const supabase = createBrowserClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user || user.email !== 'cmgg919@gmail.com') {
        router.push('/')
        return
      }

      await fetchQuotes()
    } catch (error) {
      console.error('Error:', error)
      router.push('/')
    }
  }

  const fetchQuotes = async () => {
    try {
      setIsLoading(true)
      const supabase = createBrowserClient()
      
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching quotes:', error)
        return
      }

      setQuotes(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 탭별 필터링 및 검색
  const filteredQuotes = useMemo(() => {
    let filtered = quotes

    // 탭 필터
    if (activeTab !== 'all') {
      filtered = filtered.filter(quote => {
        switch (activeTab) {
          case 'pending':
            return quote.status === 'pending'
          case 'approved':
            return quote.status === 'approved'
          case 'site-visit':
            return quote.status === 'site-visit-pending'
          case 'active':
            return ['site-visit-completed', 'bidding', 'bidding-closed', 'quote-submitted'].includes(quote.status)
          case 'completed':
            return quote.status === 'completed'
          default:
            return true
        }
      })
    }

    // 검색 필터
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(quote =>
        quote.customer_id?.toLowerCase().includes(search) ||
        quote.full_address?.toLowerCase().includes(search) ||
        quote.space_type?.toLowerCase().includes(search)
      )
    }

    return filtered
  }, [quotes, activeTab, searchTerm])

  const updateQuoteStatus = async (quoteId: string, newStatus: string) => {
    try {
      const supabase = createBrowserClient()
      
      const { error } = await supabase
        .from('quote_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId)
      
      if (error) {
        alert('상태 업데이트 실패: ' + error.message)
        return
      }

      // 로컬 상태 업데이트
      setQuotes(quotes.map(quote => 
        quote.id === quoteId 
          ? { ...quote, status: newStatus as any, updated_at: new Date().toISOString() }
          : quote
      ))

      if (selectedQuote && selectedQuote.id === quoteId) {
        setSelectedQuote({
          ...selectedQuote,
          status: newStatus as any,
          updated_at: new Date().toISOString()
        })
      }

      alert('상태가 업데이트되었습니다.')
    } catch (error) {
      console.error('Error:', error)
      alert('오류가 발생했습니다.')
    }
  }

  // ✅ 현장방문 완료 → 자동으로 입찰 시작
  const handleSiteVisitCompleted = async (quoteId: string) => {
    try {
      const supabase = createBrowserClient()
      
      // 현장방문 완료 → 자동으로 입찰 시작
      const { error } = await supabase
        .from('quote_requests')
        .update({ 
          status: 'bidding',  // 자동으로 입찰 시작
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId)
      
      if (error) {
        alert('상태 업데이트 실패: ' + error.message)
        return
      }

      // 로컬 상태 업데이트
      setQuotes(quotes.map(quote => 
        quote.id === quoteId 
          ? { ...quote, status: 'bidding' as any, updated_at: new Date().toISOString() }
          : quote
      ))

      if (selectedQuote && selectedQuote.id === quoteId) {
        setSelectedQuote({
          ...selectedQuote,
          status: 'bidding' as any,
          updated_at: new Date().toISOString()
        })
      }

      alert('현장방문이 완료되고 자동으로 입찰이 시작되었습니다.')
    } catch (error) {
      console.error('Error:', error)
      alert('오류가 발생했습니다.')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: '대기중' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '승인됨' },
      'site-visit-pending': { color: 'bg-blue-100 text-blue-800', icon: Home, text: '현장방문대기' },
      'site-visit-completed': { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, text: '현장방문완료' },
      bidding: { color: 'bg-orange-100 text-orange-800', icon: TrendingUp, text: '입찰중' },
      'bidding-closed': { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle, text: '입찰종료' },
      'quote-submitted': { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle, text: '견적제출완료' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '완료' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: '취소' }
    }
    
    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    )
  }

  // 맵핑
  const spaceTypeMap: { [key: string]: string } = {
    'detached_house': '단독주택',
    'condo': '콘도',
    'town_house': '타운하우스',
    'commercial': '상업'
  }

  const projectTypeMap: { [key: string]: string } = {
    'bathroom': '욕실',
    'kitchen': '주방',
    'flooring': '바닥',
    'painting': '페인팅',
    'basement': '지하실',
    'full_renovation': '전체 리노베이션'
  }

  const budgetMap: { [key: string]: string } = {
    'under_50k': '$50,000 미만',
    '50k_to_100k': '$50,000 - $100,000',
    'over_100k': '$100,000 이상'
  }

  const timelineMap: { [key: string]: string } = {
    'immediate': '즉시',
    'within_1_month': '1개월 내',
    'within_3_months': '3개월 내',
    'flexible': '유연함'
  }

  const tabs = [
    { id: 'all', label: '전체', count: quotes.length },
    { id: 'pending', label: '대기중', count: quotes.filter(q => q.status === 'pending').length },
    { id: 'approved', label: '승인됨', count: quotes.filter(q => q.status === 'approved').length },
    { id: 'site-visit', label: '현장방문대기', count: quotes.filter(q => q.status === 'site-visit-pending').length },
    { id: 'active', label: '입찰중', count: quotes.filter(q => ['site-visit-completed', 'bidding', 'bidding-closed', 'quote-submitted'].includes(q.status)).length },
    { id: 'completed', label: '완료', count: quotes.filter(q => q.status === 'completed').length }
  ]

  // ✅ 개선된 상태별 다음 액션 버튼 렌더링 함수
  const renderActionButton = (quote: QuoteRequest) => {
    switch (quote.status) {
      case 'pending':
        return (
          <button
            onClick={() => {
              if (confirm('견적요청서를 승인하시겠습니까?')) {
                updateQuoteStatus(quote.id, 'approved')
              }
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors whitespace-nowrap"
          >
            승인
          </button>
        )
      
      case 'approved':
        return (
          <button
            onClick={() => {
              if (confirm('현장방문 신청을 승인하시겠습니까?')) {
                updateQuoteStatus(quote.id, 'site-visit-pending')
              }
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors whitespace-nowrap"
          >
            현장방문승인
          </button>
        )
      
      case 'site-visit-pending':
        return (
          <button
            onClick={() => {
              if (confirm('현장방문을 완료하고 입찰을 시작하시겠습니까?')) {
                handleSiteVisitCompleted(quote.id)
              }
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors whitespace-nowrap"
          >
            방문완료+입찰시작
          </button>
        )
      
      case 'bidding':
        return (
          <button
            onClick={() => {
              if (confirm('입찰을 종료하시겠습니까?')) {
                updateQuoteStatus(quote.id, 'bidding-closed')
              }
            }}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded text-sm transition-colors whitespace-nowrap"
          >
            입찰종료
          </button>
        )
      
      case 'bidding-closed':
      case 'quote-submitted':
        return (
          <button
            onClick={() => {
              if (confirm('프로젝트를 완료하시겠습니까?')) {
                updateQuoteStatus(quote.id, 'completed')
              }
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors whitespace-nowrap"
          >
            프로젝트완료
          </button>
        )
      
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                대시보드
              </button>
              <h1 className="text-xl font-bold text-gray-900">견적 요청 관리</h1>
            </div>
            <button
              onClick={() => fetchQuotes()}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              🔄 새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 워크플로우 안내 */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 워크플로우</h3>
          <div className="text-xs text-blue-800 space-y-1">
            <p>1. <strong>대기중 (pending)</strong> → 승인 → 2. <strong>승인됨 (approved)</strong></p>
            <p>2. <strong>승인됨</strong> → 업체가 현장방문 신청 → 3. <strong>현장방문대기 (site-visit-pending)</strong></p>
            <p>3. <strong>현장방문대기</strong> → 방문완료+입찰시작 → 4. <strong>입찰중 (bidding)</strong></p>
            <p>4. <strong>입찰중</strong> → 입찰종료 → 5. <strong>입찰종료 (bidding-closed)</strong></p>
            <p>5. <strong>입찰종료</strong> → 고객이 업체 선택 → 6. <strong>완료 (completed)</strong></p>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="주소, 공간 유형, 예산 검색..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 탭 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객 ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">공간/서비스</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">주소</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">예산/일정</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuotes.length > 0 ? (
                  filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {quote.customer_id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">
                            {spaceTypeMap[quote.space_type] || quote.space_type}
                          </div>
                          <div className="text-xs text-gray-600">
                            {quote.project_types?.map(type => 
                              projectTypeMap[type] || type
                            ).join(', ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="max-w-xs truncate">{quote.full_address}</div>
                          <div className="text-xs text-gray-600">{quote.postal_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {budgetMap[quote.budget] || quote.budget}
                          </div>
                          <div className="text-xs text-gray-600">
                            {timelineMap[quote.timeline] || quote.timeline}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(quote.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(quote.created_at).toLocaleDateString('ko-KR')}
                        </div>
                        {quote.visit_date && (
                          <div className="text-xs text-blue-600">
                            방문: {new Date(quote.visit_date).toLocaleDateString('ko-KR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedQuote(quote)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            상세
                          </button>
                          {renderActionButton(quote)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? '검색 결과가 없습니다.' : '견적 요청이 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">견적 요청 상세</h2>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 고객 정보 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">고객 정보</h3>
                  <p className="text-sm"><span className="font-medium">ID:</span> {selectedQuote.customer_id}</p>
                </div>

                {/* 프로젝트 정보 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">프로젝트 정보</h3>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-medium">공간:</span> {spaceTypeMap[selectedQuote.space_type] || selectedQuote.space_type}</p>
                    <p className="text-sm"><span className="font-medium">서비스:</span> {selectedQuote.project_types?.map(type => projectTypeMap[type] || type).join(', ')}</p>
                    <p className="text-sm"><span className="font-medium">예산:</span> {budgetMap[selectedQuote.budget] || selectedQuote.budget}</p>
                    <p className="text-sm"><span className="font-medium">일정:</span> {timelineMap[selectedQuote.timeline] || selectedQuote.timeline}</p>
                    {selectedQuote.visit_date && (
                      <p className="text-sm"><span className="font-medium">방문일:</span> {new Date(selectedQuote.visit_date).toLocaleDateString('ko-KR')}</p>
                    )}
                  </div>
                </div>

                {/* 위치 정보 */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">위치 정보</h3>
                  <p className="text-sm"><span className="font-medium">주소:</span> {selectedQuote.full_address}</p>
                  <p className="text-sm"><span className="font-medium">우편번호:</span> {selectedQuote.postal_code}</p>
                </div>

                {/* 상세 설명 */}
                {selectedQuote.description && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">요청사항</h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedQuote.description}</p>
                  </div>
                )}

                {/* 현재 상태 */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">현재 상태</h3>
                  {getStatusBadge(selectedQuote.status)}
                </div>

                {/* ✅ 개선된 액션 버튼 - 상태별로 다음 단계 버튼 표시 */}
                <div className="flex gap-2 pt-4">
                  {selectedQuote.status === 'pending' && (
                    <button
                      onClick={() => {
                        updateQuoteStatus(selectedQuote.id, 'approved')
                        setSelectedQuote(null)
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      승인
                    </button>
                  )}
                  {selectedQuote.status === 'approved' && (
                    <button
                      onClick={() => {
                        updateQuoteStatus(selectedQuote.id, 'site-visit-pending')
                        setSelectedQuote(null)
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      현장방문 승인
                    </button>
                  )}
                  {selectedQuote.status === 'site-visit-pending' && (
                    <button
                      onClick={() => {
                        handleSiteVisitCompleted(selectedQuote.id)
                        setSelectedQuote(null)
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      현장방문 완료 + 입찰 시작
                    </button>
                  )}
                  {selectedQuote.status === 'bidding' && (
                    <button
                      onClick={() => {
                        updateQuoteStatus(selectedQuote.id, 'bidding-closed')
                        setSelectedQuote(null)
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      입찰 종료
                    </button>
                  )}
                  {(selectedQuote.status === 'bidding-closed' || selectedQuote.status === 'quote-submitted') && (
                    <button
                      onClick={() => {
                        updateQuoteStatus(selectedQuote.id, 'completed')
                        setSelectedQuote(null)
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                      프로젝트 완료
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
