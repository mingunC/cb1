'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { getQuoteRequests } from '@/lib/supabase/quotes'
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, Calendar, MapPin, DollarSign, Download, FileText, Building, User } from 'lucide-react'

interface QuoteRequest {
  id: string
  customer_id: string
  space_type: string
  project_types: string[]
  budget: string
  timeline: string
  visit_date: string
  full_address: string
  postal_code: string
  description: string
  photos: string[]
  status: 'pending' | 'approved' | 'rejected' | 'site-visit-pending' | 'site-visit-completed' | 'bidding' | 'quote-submitted' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

interface ContractorQuote {
  id: string
  project_id: string
  contractor_id: string
  bid_amount: number
  bid_description: string
  pdf_url: string
  valid_until: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  contractor_name?: string
  contractor_company?: string
  price?: number
  description?: string
}

export default function MyQuotesPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [contractorQuotes, setContractorQuotes] = useState<ContractorQuote[]>([])
  const [quotesTableData, setQuotesTableData] = useState<any[]>([])
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null)
  const [activeTab, setActiveTab] = useState<'requests' | 'compare'>('requests')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/login')
          return
        }

        // 사용자 타입 확인 (더 유연하게 처리)
        console.log('Checking user type for user ID:', user.id, 'Email:', user.email)
        
        // 먼저 users 테이블에서 확인
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_type, first_name, last_name')
          .eq('id', user.id)
          .maybeSingle()

        console.log('User type check result:', { userData, userError })

        // 사용자가 users 테이블에 없으면 기본적으로 customer로 처리
        let userType = 'customer'
        if (userData && userData.user_type) {
          userType = userData.user_type
        } else if (userError && userError.code === 'PGRST116') {
          // 사용자가 users 테이블에 없는 경우 (RLS 정책으로 인한 오류)
          console.log('User not found in users table, treating as customer')
          userType = 'customer'
        } else if (userError) {
          console.log('Error checking user type:', userError)
          // 오류가 있어도 기본적으로 customer로 처리
          userType = 'customer'
        }

        // contractor인 경우 접근 거부
        if (userType === 'contractor') {
          console.log('Contractor trying to access customer page, redirecting')
          router.push('/contractor')
          return
        }

        console.log('User authorized as:', userType)

        setUser(user)
        setIsAuthorized(true)
        await fetchQuotes(user.id)
        
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const fetchQuotes = async (customerId: string) => {
    try {
      console.log('=== FETCHING QUOTES ===')
      console.log('Customer ID:', customerId)
      
      // 유틸리티 함수 사용하여 견적 요청서 조회 (자동 폴백 포함)
      const { data: quotesData, error: quotesError } = await getQuoteRequests(customerId)
      
      console.log('Quotes query result:', { quotesData, quotesError })
      console.log('Quotes count:', quotesData?.length || 0)

      if (quotesError) {
        console.error('Error fetching quotes:', quotesError)
        setQuotes([])
        return
      }

      console.log('Successfully fetched quotes:', quotesData?.length || 0)
      if (quotesData && quotesData.length > 0) {
        console.log('First quote data:', quotesData[0])
      } else {
        console.log('No quotes found for this customer')
      }
      
      setQuotes(quotesData || [])

      // 견적서가 제출된 프로젝트들의 업체 견적서 조회
      const projectIds = quotesData?.filter(q => q.status === 'quote-submitted').map(q => q.id) || []
      console.log('Project IDs for contractor quotes:', projectIds)
      
      if (projectIds.length > 0) {
        const supabase = createBrowserClient()
        
        // contractor_quotes 테이블에서 조회
        const { data: contractorQuotesData, error: contractorQuotesError } = await supabase
          .from('contractor_quotes')
          .select(`
            id,
            project_id,
            contractor_id,
            price,
            description,
            pdf_url,
            pdf_filename,
            status,
            created_at,
            contractors:contractor_id (
              company_name,
              contact_name
            )
          `)
          .in('project_id', projectIds)

        console.log('Contractor quotes query result:', { contractorQuotesData, contractorQuotesError })
        console.log('Contractor quotes data details:', contractorQuotesData?.map(q => ({
          id: q.id,
          project_id: q.project_id,
          price: q.price,
          description: q.description,
          contractor_name: q.contractors?.company_name || q.contractors?.contact_name,
          status: q.status
        })))


        if (!contractorQuotesError && contractorQuotesData) {
          const formattedQuotes = contractorQuotesData.map(quote => ({
            ...quote,
            contractor_name: quote.contractors?.company_name || quote.contractors?.contact_name || 'Unknown',
            contractor_company: quote.contractors?.company_name || 'Unknown Company',
            price: quote.price,
            description: quote.description
          }))
          setContractorQuotes(formattedQuotes)
        }
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      // 오류가 있어도 빈 배열로 설정하여 페이지가 로드되도록 함
      setQuotes([])
      setContractorQuotes([])
    }
  }

  const fetchCompareQuotes = async (customerId: string) => {
    try {
      const supabase = createBrowserClient()
      
      // 견적서가 제출된 프로젝트만 조회
      const { data: quotesData, error: quotesError } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'quote-submitted')
        .order('created_at', { ascending: false })

      if (quotesError) {
        console.error('Error fetching compare quotes:', quotesError)
        return { quotes: [], contractorQuotes: [] }
      }

      // 견적서가 제출된 프로젝트들의 업체 견적서 조회
      const projectIds = quotesData?.map(q => q.id) || []
      
      if (projectIds.length > 0) {
        // quotes 테이블 조회 추가
        const { data: quotesTableData, error: quotesTableError } = await supabase
          .from('quotes')
          .select('*')
          .in('quote_request_id', projectIds)

        console.log('Quotes table data:', quotesTableData)
        console.log('Quotes table error:', quotesTableError)

        // contractor_quotes 테이블 조회
        const { data: contractorQuotesData, error: contractorQuotesError } = await supabase
          .from('contractor_quotes')
          .select(`
            id,
            project_id,
            contractor_id,
            price,
            description,
            pdf_url,
            pdf_filename,
            status,
            created_at,
            contractors:contractor_id (
              company_name,
              contact_name
            )
          `)
          .in('project_id', projectIds)

        console.log('Contractor quotes raw data:', contractorQuotesData)
        console.log('Contractor quotes error:', contractorQuotesError)


        let allContractorQuotes = []

        if (!contractorQuotesError && contractorQuotesData) {
          const formattedQuotes = contractorQuotesData.map(quote => ({
            ...quote,
            contractor_name: quote.contractors?.company_name || quote.contractors?.contact_name || 'Unknown',
            contractor_company: quote.contractors?.company_name || 'Unknown Company',
            price: quote.price,
            description: quote.description
          }))
          allContractorQuotes = [...allContractorQuotes, ...formattedQuotes]
        }

        console.log('All contractor quotes:', allContractorQuotes)
        return { 
          quotes: quotesData || [], 
          contractorQuotes: allContractorQuotes,
          quotesTableData: quotesTableData || []
        }
      }
      
      return { quotes: quotesData || [], contractorQuotes: [], quotesTableData: [] }
      
    } catch (error) {
      console.error('Error fetching compare data:', error)
      return { quotes: [], contractorQuotes: [], quotesTableData: [] }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: '검토중' }
      case 'approved':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '승인됨' }
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: XCircle, text: '거부됨' }
      case 'site-visit-pending':
        return { color: 'bg-blue-100 text-blue-800', icon: Calendar, text: '현장방문대기' }
      case 'site-visit-completed':
        return { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, text: '현장방문완료' }
      case 'bidding':
        return { color: 'bg-orange-100 text-orange-800', icon: Clock, text: '입찰중' }
      case 'quote-submitted':
        return { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle, text: '견적제출완료' }
      case 'completed':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: '완료' }
      case 'cancelled':
        return { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: '취소' }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Clock, text: '알 수 없음' }
    }
  }

  const formatBudget = (budget: string) => {
    const budgetMap: { [key: string]: string } = {
      'under_50k': '$50,000 미만',
      '50k_to_100k': '$50,000 - $100,000',
      'over_100k': '$100,000 이상'
    }
    return budgetMap[budget] || budget
  }

  const spaceTypeMap: { [key: string]: string } = {
    'detached-house': '단독주택',
    'condo': '콘도',
    'townhouse': '타운하우스',
    'commercial': '상업'
  }

  const projectTypeMap: { [key: string]: string } = {
    'kitchen': '주방',
    'bathroom': '욕실',
    'basement': '지하실',
    'painting': '페인팅',
    'flooring': '바닥',
    'full-renovation': '전체 리노베이션',
    'restaurant': '레스토랑',
    'retail': '소매점',
    'office': '사무실',
    'education': '교육시설',
    'other': '기타'
  }

  const timelineMap: { [key: string]: string } = {
    'asap': '가능한 빨리',
    'within_1_month': '1개월 이내',
    'within_3_months': '3개월 이내',
    'flexible': '유연함'
  }

  const handleTabChange = async (tab: 'requests' | 'compare') => {
    setActiveTab(tab)
    if (tab === 'compare' && user?.id) {
      const compareData = await fetchCompareQuotes(user.id)
      setQuotes(compareData.quotes)
      setContractorQuotes(compareData.contractorQuotes)
      setQuotesTableData(compareData.quotesTableData)
      console.log('Quotes table data received:', compareData.quotesTableData)
    } else if (tab === 'requests' && user?.id) {
      await fetchQuotes(user.id)
    }
  }

  const downloadQuote = async (quoteId: string) => {
    try {
      const supabase = createBrowserClient()
      
      // 먼저 contractor_quotes 테이블에서 PDF 정보 조회
      const { data: quoteData, error: quoteError } = await supabase
        .from('contractor_quotes')
        .select('pdf_url, pdf_filename')
        .eq('id', quoteId)
        .single()

      if (quoteError || !quoteData) {
        console.error('Error fetching quote data:', quoteError)
        alert('견적서 정보를 찾을 수 없습니다.')
        return
      }

      // PDF URL이 없는 경우
      if (!quoteData.pdf_url) {
        alert('견적서 파일이 없습니다.')
        return
      }

      // PDF 파일 다운로드 처리
      console.log('PDF URL:', quoteData.pdf_url)
      console.log('PDF URL starts with http:', quoteData.pdf_url.startsWith('http'))
      
      if (quoteData.pdf_url.startsWith('http')) {
        // 전체 URL인 경우 직접 다운로드
        console.log('Using direct download for full URL')
        const link = document.createElement('a')
        link.href = quoteData.pdf_url
        link.download = quoteData.pdf_filename || `견적서_${quoteId}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // 상대 경로인 경우 Supabase Storage 사용
        console.log('Using Supabase Storage for relative path')
        
        // pdf_url에서 버킷명 제거 (contractor-quotes/ 제거)
        let filePath = quoteData.pdf_url
        if (filePath.startsWith('contractor-quotes/')) {
          filePath = filePath.replace('contractor-quotes/', '')
        }
        
        console.log('File path after removing bucket name:', filePath)
        
        const { data, error } = await supabase.storage
          .from('contractor-quotes')
          .download(filePath)

        if (error) {
          console.error('Error downloading quote:', error)
          alert('견적서 다운로드에 실패했습니다.')
          return
        }

        const url = URL.createObjectURL(data)
        const link = document.createElement('a')
        link.href = url
        link.download = quoteData.pdf_filename || `견적서_${quoteId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('견적서 다운로드에 실패했습니다.')
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

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">접근 권한 없음</h1>
          <p className="text-gray-600 mb-4">고객 계정으로 로그인해주세요.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            로그인하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            뒤로가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">내 견적</h1>
          <p className="mt-2 text-gray-600">견적요청 내역과 업체 견적서를 비교해보세요.</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('requests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                견적요청 내역
              </button>
              <button
                onClick={() => handleTabChange('compare')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'compare'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                비교견적 보기
              </button>
            </nav>
          </div>
        </div>

        {/* 탭 내용 */}
        {activeTab === 'requests' ? (
          /* 견적요청 내역 탭 */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">견적 요청 내역</h2>
            </div>
          
          {quotes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>아직 견적 요청이 없습니다.</p>
              <div className="mt-4 text-sm text-gray-400">
                <p>사용자 ID: {user?.id}</p>
                <p>이메일: {user?.email}</p>
                <p>견적요청 수: {quotes.length}</p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/quote-request')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  견적 요청하기
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {quotes.map((quote) => {
                const statusInfo = getStatusColor(quote.status)
                const IconComponent = statusInfo.icon
                const projectQuotes = contractorQuotes.filter(cq => cq.project_id === quote.id)
                
                return (
                  <div key={quote.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <IconComponent className="w-3 h-3 mr-1" />
                            {statusInfo.text}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(quote.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {spaceTypeMap[quote.space_type] || quote.space_type}
                            </h3>
                            <p className="text-sm text-gray-600 mb-1">
                              <MapPin className="w-4 h-4 inline mr-1" />
                              {quote.full_address}
                            </p>
                            <p className="text-sm text-gray-600">
                              <DollarSign className="w-4 h-4 inline mr-1" />
                              {formatBudget(quote.budget)}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>프로젝트:</strong> {quote.project_types?.map(type => 
                                projectTypeMap[type] || type
                              ).join(', ')}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>일정:</strong> {timelineMap[quote.timeline] || quote.timeline}
                            </p>
                            {quote.visit_date && (
                              <p className="text-sm text-gray-600">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                방문일: {new Date(quote.visit_date).toLocaleDateString('ko-KR')}
                              </p>
                            )}
                          </div>
                        </div>

                        {quote.description && (
                          <p className="text-sm text-gray-600 mb-4">
                            <strong>요청사항:</strong> {quote.description}
                          </p>
                        )}

                        {/* 업체 견적서 목록 */}
                        {projectQuotes.length > 0 && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-blue-900">
                                받은 견적서 ({projectQuotes.length}개)
                              </h4>
                            </div>
                            <div className="space-y-2">
                              {projectQuotes.map((contractorQuote) => {
                                console.log('Rendering contractor quote:', {
                                  id: contractorQuote.id,
                                  price: contractorQuote.price,
                                  description: contractorQuote.description,
                                  contractor_name: contractorQuote.contractor_name
                                })
                                return (
                                  <div key={contractorQuote.id} className="flex items-center justify-between bg-white p-3 rounded border">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {contractorQuote.contractor_name}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        ${contractorQuote.price ? contractorQuote.price.toLocaleString() : '견적금액 없음'}
                                      </p>
                                      {contractorQuote.description && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {contractorQuote.description}
                                        </p>
                                      )}
                                    </div>
                                    {contractorQuote.pdf_url ? (
                                      <button
                                        onClick={() => downloadQuote(contractorQuote.id)}
                                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                      >
                                        <Download className="w-4 h-4 mr-1" />
                                        다운로드
                                      </button>
                                    ) : (
                                      <span className="flex items-center text-gray-400 text-sm">
                                        <FileText className="w-4 h-4 mr-1" />
                                        PDF 없음
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          <Eye className="w-4 h-4 mr-1 inline" />
                          상세보기
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          </div>
        ) : (
          /* 비교견적 보기 탭 */
          <div className="space-y-6">
            {quotes.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">비교할 견적서가 없습니다</h3>
                <p className="text-gray-600 mb-4">업체들이 견적서를 제출하면 여기서 비교할 수 있습니다.</p>
                <button
                  onClick={() => handleTabChange('requests')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  견적요청 내역 보기
                </button>
              </div>
            ) : (
              quotes.map((quote) => {
                const projectQuotes = contractorQuotes.filter(cq => cq.project_id === quote.id)
                
                return (
                  <div key={quote.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6">
                      {/* 프로젝트 제목과 견적서 개수만 표시 */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-semibold text-gray-900">
                            {spaceTypeMap[quote.space_type] || quote.space_type}
                          </h2>
                          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                            견적서 {projectQuotes.length}개
                          </span>
                        </div>
                      </div>

                      {/* 업체 견적서만 표시 */}
                      {projectQuotes.length > 0 ? (
                        <div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projectQuotes.map((contractorQuote) => {
                              const statusInfo = getStatusColor(contractorQuote.status)
                              const IconComponent = statusInfo.icon
                              
                              return (
                                <div key={contractorQuote.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      <Building className="h-5 w-5 text-gray-400" />
                                      <h4 className="font-medium text-gray-900">{contractorQuote.contractor_company}</h4>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                      <IconComponent className="w-3 h-3 mr-1" />
                                      {statusInfo.text}
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-2 mb-4">
                                    <div className="flex items-center space-x-2">
                                      <DollarSign className="h-4 w-4 text-green-600" />
                                      <span className="text-lg font-semibold text-gray-900">
                                        ${contractorQuote.price ? contractorQuote.price.toLocaleString() : '견적금액 없음'}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm text-gray-600">
                                        {new Date(contractorQuote.created_at).toLocaleDateString('ko-KR')}
                                      </span>
                                    </div>
                                  </div>

                                  {contractorQuote.description && (
                                    <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded">
                                      {contractorQuote.description}
                                    </p>
                                  )}

                                  <div className="flex space-x-2">
                                    {contractorQuote.pdf_url ? (
                                      <button
                                        onClick={() => downloadQuote(contractorQuote.id)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center"
                                      >
                                        <Download className="h-4 w-4 mr-1" />
                                        견적서 다운로드
                                      </button>
                                    ) : (
                                      <div className="flex-1 bg-gray-300 text-gray-500 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center">
                                        <FileText className="h-4 w-4 mr-1" />
                                        PDF 파일 없음
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-8 w-8 mx-auto mb-2" />
                          <p>아직 제출된 견적서가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* 상세 모달 */}
        {selectedQuote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">견적 요청 상세</h3>
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">기본 정보</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><strong>공간 유형:</strong> {spaceTypeMap[selectedQuote.space_type] || selectedQuote.space_type}</p>
                      <p><strong>프로젝트:</strong> {selectedQuote.project_types?.map(type => 
                        projectTypeMap[type] || type
                      ).join(', ')}</p>
                      <p><strong>예산:</strong> {formatBudget(selectedQuote.budget)}</p>
                      <p><strong>일정:</strong> {timelineMap[selectedQuote.timeline] || selectedQuote.timeline}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">위치 정보</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p><strong>주소:</strong> {selectedQuote.full_address}</p>
                      <p><strong>우편번호:</strong> {selectedQuote.postal_code}</p>
                      {selectedQuote.visit_date && (
                        <p><strong>방문 희망일:</strong> {new Date(selectedQuote.visit_date).toLocaleDateString('ko-KR')}</p>
                      )}
                    </div>
                  </div>

                  {selectedQuote.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">요청사항</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p>{selectedQuote.description}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">현재 상태</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {(() => {
                        const statusInfo = getStatusColor(selectedQuote.status)
                        const IconComponent = statusInfo.icon
                        return (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                            <IconComponent className="w-4 h-4 mr-2" />
                            {statusInfo.text}
                          </span>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
