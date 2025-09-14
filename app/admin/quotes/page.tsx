'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, Search, Filter, Calendar } from 'lucide-react'

interface QuoteRequest {
  id: string
  customer_id: string
  space_type: string
  project_types: string[]
  budget: string
  timeline: string
  visit_date: string
  visit_dates?: string[] // 방문 희망 날짜 배열 추가
  full_address: string
  postal_code: string
  description: string
  photos: any[]
  status: 'pending' | 'approved' | 'in-progress' | 'site-visit-pending' | 'site-visit-completed' | 'bidding' | 'quote-submitted' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [filteredQuotes, setFilteredQuotes] = useState<QuoteRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAdminAndFetchQuotes()
  }, [])

  useEffect(() => {
    filterQuotes()
  }, [quotes, filter, searchTerm])

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

      console.log('Fetched quotes:', data)
      console.log('Quote statuses:', data?.map(q => ({ id: q.id, status: q.status })))
      setQuotes(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterQuotes = () => {
    console.log('Filtering quotes. Current quotes:', quotes)
    console.log('Current filter:', filter)
    console.log('Current searchTerm:', searchTerm)
    
    let filtered = [...quotes]

    // 상태 필터
    if (filter !== 'all') {
      filtered = filtered.filter(quote => quote.status === filter)
    }

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(quote => {
        const searchLower = searchTerm.toLowerCase()
        return (
          quote.customer_id?.toLowerCase().includes(searchLower) ||
          quote.full_address?.toLowerCase().includes(searchLower) ||
          quote.space_type?.toLowerCase().includes(searchLower) ||
          quote.budget?.toLowerCase().includes(searchLower) ||
          quote.project_types?.some(type => type.toLowerCase().includes(searchLower))
        )
      })
    }

    console.log('Filtered results:', filtered)
    setFilteredQuotes(filtered)
  }

  const updateQuoteStatus = async (quoteId: string, newStatus: string) => {
    try {
      const supabase = createBrowserClient()
      
      console.log('Updating quote status to:', newStatus)
      
      const { data, error } = await supabase
        .from('quote_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating quote:', error)
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

      alert(`상태가 "${newStatus}"으로 업데이트되었습니다.`)
    } catch (error) {
      console.error('Error:', error)
      alert('오류가 발생했습니다.')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: '대기중' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '승인됨' },
      'in-progress': { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: '진행중' },
      'site-visit-pending': { color: 'bg-blue-100 text-blue-800', icon: Calendar, text: '현장방문대기' },
      'site-visit-completed': { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, text: '현장방문완료' },
      bidding: { color: 'bg-orange-100 text-orange-800', icon: Clock, text: '입찰중' },
      'quote-submitted': { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle, text: '견적제출완료' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '완료됨' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: '취소됨' }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 값 변환 맵 (snake_case로 통일)
  const spaceTypeMap: { [key: string]: string } = {
    'detached_house': '단독주택',
    'condo': '콘도',
    'town_house': '타운하우스',
    'commercial': '상업공간'
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
    'under_50k': '5만불 이하',
    '50k_100k': '5-10만불',
    'over_100k': '10만불 이상'
  }

  const timelineMap: { [key: string]: string } = {
    'immediate': '즉시',
    '1_month': '1개월 내',
    '3_months': '3개월 내',
    'planning': '계획 단계'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">견적 요청 불러오는 중...</p>
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
              <h1 className="text-xl font-semibold text-gray-900">견적 요청 관리</h1>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="주소, 공간 유형, 예산 검색..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* 상태 필터 */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체 ({quotes.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                대기중 ({quotes.filter(q => q.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'approved' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                승인됨 ({quotes.filter(q => q.status === 'approved').length})
              </button>
              <button
                onClick={() => setFilter('site-visit-pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'site-visit-pending' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                현장방문대기 ({quotes.filter(q => q.status === 'site-visit-pending').length})
              </button>
            </div>
          </div>
        </div>

        {/* 견적 목록 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    고객 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    공간/서비스
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주소
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예산/일정
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuotes.length > 0 ? (
                  filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50">
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
                          <div>{quote.full_address}</div>
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
                        {quote.visit_dates && quote.visit_dates.length > 0 ? (
                          <div className="text-xs text-blue-600">
                            방문: {quote.visit_dates.length}개 날짜
                          </div>
                        ) : quote.visit_date ? (
                          <div className="text-xs text-blue-600">
                            방문: {new Date(quote.visit_date).toLocaleDateString('ko-KR')}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setSelectedQuote(quote)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                          >
                            상세
                          </button>
                          {quote.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  if (confirm('이 견적을 승인하시겠습니까?')) {
                                    updateQuoteStatus(quote.id, 'approved')
                                  }
                                }}
                                className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                              >
                                승인
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('이 견적을 취소하시겠습니까?')) {
                                    updateQuoteStatus(quote.id, 'cancelled')
                                  }
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                              >
                                취소
                              </button>
                            </>
                          )}
                          {quote.status === 'approved' && (
                            <button
                              onClick={() => {
                                if (confirm('현장방문 대기 상태로 변경하시겠습니까?')) {
                                  updateQuoteStatus(quote.id, 'site-visit-pending')
                                }
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                            >
                              현장방문대기
                            </button>
                          )}
                          {quote.status === 'site-visit-pending' && (
                            <button
                              onClick={() => {
                                if (confirm('현장방문 완료 처리하시겠습니까?')) {
                                  updateQuoteStatus(quote.id, 'site-visit-completed')
                                }
                              }}
                              className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs"
                            >
                              현장방문완료
                            </button>
                          )}
                          {quote.status === 'site-visit-completed' && (
                            <button
                              onClick={() => {
                                if (confirm('입찰 상태로 변경하시겠습니까?')) {
                                  updateQuoteStatus(quote.id, 'bidding')
                                }
                              }}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs"
                            >
                              입찰시작
                            </button>
                          )}
                          {quote.status === 'bidding' && (
                            <button
                              onClick={() => {
                                if (confirm('견적제출 완료 처리하시겠습니까?')) {
                                  updateQuoteStatus(quote.id, 'quote-submitted')
                                }
                              }}
                              className="bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded text-xs"
                            >
                              견적제출완료
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      견적 요청이 없습니다.
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">견적 요청 상세</h2>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">고객 정보</h3>
                  <div className="mt-2 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm"><span className="font-medium">고객 ID:</span> {selectedQuote.customer_id}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">프로젝트 정보</h3>
                  <div className="mt-2 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm"><span className="font-medium">공간 유형:</span> {spaceTypeMap[selectedQuote.space_type] || selectedQuote.space_type}</p>
                    <p className="text-sm"><span className="font-medium">서비스 유형:</span> {selectedQuote.project_types?.map(type => projectTypeMap[type] || type).join(', ')}</p>
                    <p className="text-sm"><span className="font-medium">예산:</span> {budgetMap[selectedQuote.budget] || selectedQuote.budget}</p>
                    <p className="text-sm"><span className="font-medium">일정:</span> {timelineMap[selectedQuote.timeline] || selectedQuote.timeline}</p>
                    <div className="text-sm">
                      <span className="font-medium">방문 희망일:</span>
                      {selectedQuote.visit_dates && selectedQuote.visit_dates.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {selectedQuote.visit_dates.map((date, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>{new Date(date).toLocaleDateString('ko-KR')}</span>
                            </div>
                          ))}
                        </div>
                      ) : selectedQuote.visit_date ? (
                        <span className="ml-1">{new Date(selectedQuote.visit_date).toLocaleDateString('ko-KR')}</span>
                      ) : (
                        <span className="ml-1">미정</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">위치 정보</h3>
                  <div className="mt-2 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm"><span className="font-medium">주소:</span> {selectedQuote.full_address}</p>
                    <p className="text-sm"><span className="font-medium">우편번호:</span> {selectedQuote.postal_code}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">상세 설명</h3>
                  <div className="mt-2 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedQuote.description || '없음'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">현재 상태</h3>
                  <div className="mt-2 flex items-center space-x-2">
                    {getStatusBadge(selectedQuote.status)}
                    <span className="text-xs text-gray-500">
                      (마지막 업데이트: {formatDate(selectedQuote.updated_at || selectedQuote.created_at)})
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  {selectedQuote.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateQuoteStatus(selectedQuote.id, 'approved')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        승인하기
                      </button>
                      <button
                        onClick={() => updateQuoteStatus(selectedQuote.id, 'cancelled')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        취소 처리
                      </button>
                    </>
                  )}
                  {selectedQuote.status === 'approved' && (
                    <button
                      onClick={() => updateQuoteStatus(selectedQuote.id, 'site-visit-pending')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      현장방문 대기로 변경
                    </button>
                  )}
                  {selectedQuote.status === 'site-visit-pending' && (
                    <button
                      onClick={() => updateQuoteStatus(selectedQuote.id, 'site-visit-completed')}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      현장방문 완료 처리
                    </button>
                  )}
                  {selectedQuote.status === 'site-visit-completed' && (
                    <button
                      onClick={() => updateQuoteStatus(selectedQuote.id, 'quote-submitted')}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      견적제출 완료 처리
                    </button>
                  )}
                  {(selectedQuote.status === 'cancelled' || selectedQuote.status === 'quote-submitted' || selectedQuote.status === 'completed') && (
                    <div className="flex-1 text-center py-2 text-gray-500">
                      {selectedQuote.status === 'cancelled' ? '이 견적은 취소되었습니다.' : 
                       selectedQuote.status === 'quote-submitted' ? '견적이 제출되었습니다.' : 
                       '이 견적은 완료되었습니다.'}
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium transition-colors"
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