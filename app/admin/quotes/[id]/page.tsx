'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, CheckCircle, XCircle, Calendar, MapPin, DollarSign, User, Mail, Phone } from 'lucide-react'

interface QuoteRequest {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  space_type: string
  project_type: string
  budget: string
  timeline: string
  postal_code: string
  full_address: string
  visit_date: string
  visit_dates?: string[] // 방문 희망 날짜 배열 추가
  description: string
  status: string
  created_at: string
}

interface SiteVisitApplication {
  id: string
  project_id: string
  contractor_id: string
  applied_at: string
  status: string
  contractor_name?: string
  contractor_email?: string
}

export default function QuoteDetailPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [quote, setQuote] = useState<QuoteRequest | null>(null)
  const [siteVisitApplications, setSiteVisitApplications] = useState<SiteVisitApplication[]>([])
  const router = useRouter()
  const params = useParams()
  const quoteId = params.id as string

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          setIsLoading(false)
          router.push('/login')
          return
        }

        setUser(user)
        
        // cmgg919@gmail.com만 허용
        if (user.email === 'cmgg919@gmail.com') {
          setIsAuthorized(true)
          setIsLoading(false)
        } else {
          setIsAuthorized(false)
          setIsLoading(false)
          setTimeout(() => {
            router.push('/')
          }, 2000)
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        setIsLoading(false)
        router.push('/login')
      }
    }

    checkUser()
  }, [])

  useEffect(() => {
    if (isAuthorized && quoteId) {
      fetchQuote()
      fetchSiteVisitApplications()
    }
  }, [isAuthorized, quoteId])

  const fetchSiteVisitApplications = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('site_visit_applications')
        .select(`
          *,
          contractors:contractor_id (
            company_name,
            email
          )
        `)
        .eq('project_id', quoteId)
        .order('applied_at', { ascending: false })

      if (error) {
        console.error('Error fetching site visit applications:', error)
        return
      }

      const applications = data?.map(app => ({
        ...app,
        contractor_name: app.contractors?.company_name,
        contractor_email: app.contractors?.email
      })) || []

      setSiteVisitApplications(applications)
      console.log('Site visit applications:', applications)
    } catch (error) {
      console.error('Unexpected error fetching site visit applications:', error)
    }
  }

  const fetchQuote = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', quoteId)
        .single()

      if (error) {
        console.error('Error fetching quote:', error)
        return
      }

      setQuote(data)
      console.log('Quote fetched:', data)
      console.log('Quote status:', data?.status)
      console.log('Visit date:', data?.visit_date)
      console.log('Visit dates:', data?.visit_dates)
    } catch (error) {
      console.error('Unexpected error fetching quote:', error)
    }
  }

  const updateQuoteStatus = async (newStatus: string) => {
    try {
      const supabase = createBrowserClient()
      
      // 승인 시 자동으로 site-visit-pending으로 변경
      const finalStatus = newStatus === 'approved' ? 'site-visit-pending' : newStatus
      
      const { error } = await supabase
        .from('quote_requests')
        .update({ status: finalStatus })
        .eq('id', quoteId)

      if (error) {
        console.error('Error updating quote status:', error)
        return
      }

      // 로컬 상태 업데이트
      if (quote) {
        setQuote({ ...quote, status: finalStatus })
      }
      
      console.log(`견적 요청 상태 변경: ${newStatus} → ${finalStatus}`)
    } catch (error) {
      console.error('Unexpected error updating quote status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'site-visit-pending': return 'bg-blue-100 text-blue-800'
      case 'site-visit-completed': return 'bg-purple-100 text-purple-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중'
      case 'approved': return '승인됨'
      case 'site-visit-pending': return '현장방문대기'
      case 'site-visit-completed': return '현장방문완료'
      case 'rejected': return '거부됨'
      default: return '알 수 없음'
    }
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

  const formatBudget = (budget: string) => {
    switch (budget) {
      case 'under_50k': return '$50,000 미만'
      case '50k_100k': return '$50,000 - $100,000'
      case 'over_100k': return '$100,000 이상'
      default: return budget
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">관리자 권한 확인 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">접근 권한 없음</h1>
          <p className="text-gray-600 mb-4">관리자 권한이 필요합니다.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">견적 요청을 찾을 수 없습니다</h1>
          <button
            onClick={() => router.push('/admin/quotes')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            목록으로 돌아가기
          </button>
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
                onClick={() => router.push('/admin/quotes')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                견적 요청 관리
              </button>
              <h1 className="text-xl font-semibold text-gray-900">견적 요청 상세보기</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(quote.status)}`}>
                {getStatusText(quote.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* 고객 정보 */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">고객 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{quote.customer_name}</p>
                  <p className="text-sm text-gray-500">고객명</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{quote.customer_email}</p>
                  <p className="text-sm text-gray-500">이메일</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{quote.customer_phone}</p>
                  <p className="text-sm text-gray-500">전화번호</p>
                </div>
              </div>
            </div>
          </div>

          {/* 프로젝트 정보 */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">공간 타입</p>
                <p className="text-sm text-gray-600">{quote.space_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">프로젝트 타입</p>
                <p className="text-sm text-gray-600">{quote.project_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">예산 범위</p>
                <p className="text-sm text-gray-600">{formatBudget(quote.budget)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">희망 완료 시기</p>
                <p className="text-sm text-gray-600">{quote.timeline}</p>
              </div>
            </div>
          </div>

          {/* 위치 정보 */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">위치 정보</h2>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{quote.full_address}</p>
                <p className="text-sm text-gray-500">우편번호: {quote.postal_code}</p>
              </div>
            </div>
          </div>

          {/* 방문 일정 */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">방문 일정</h2>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="space-y-2">
                {quote.visit_dates && quote.visit_dates.length > 0 ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">희망 방문일</p>
                    <div className="space-y-1">
                      {quote.visit_dates.map((date, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <p className="text-sm text-gray-700">{formatDate(date)}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900">{formatDate(quote.visit_date)}</p>
                    <p className="text-sm text-gray-500">희망 방문일</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 현장방문 신청자 목록 */}
          {quote.status === 'site-visit-pending' && siteVisitApplications.length > 0 && (
            <div className="px-6 py-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">현장방문 신청자</h2>
              <div className="space-y-3">
                {siteVisitApplications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {application.contractor_name || '업체명 없음'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {application.contractor_email}
                        </p>
                        <p className="text-xs text-gray-400">
                          신청일: {formatDate(application.applied_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        application.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : application.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {application.status === 'pending' ? '대기중' : 
                         application.status === 'approved' ? '승인됨' : '거부됨'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="px-6 py-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                요청일: {formatDate(quote.created_at)}
              </div>
              
              {/* 상태에 따른 버튼 표시 */}
              {quote.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => updateQuoteStatus('approved')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    승인
                  </button>
                  <button
                    onClick={() => updateQuoteStatus('rejected')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    거부
                  </button>
                </div>
              )}
              
              {quote.status === 'site-visit-pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => updateQuoteStatus('site-visit-completed')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    현장방문 완료
                  </button>
                </div>
              )}
              
              {/* 현장방문 완료된 상태 표시 */}
              {quote.status === 'site-visit-completed' && (
                <div className="flex items-center gap-2 text-purple-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium text-lg">현장방문 완료</span>
                </div>
              )}
              
              {/* 거부된 상태 표시 */}
              {quote.status === 'rejected' && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium text-lg">거부됨</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
