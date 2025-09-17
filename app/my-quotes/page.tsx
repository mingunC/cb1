'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { getQuoteRequests } from '@/lib/supabase/quotes'
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, Calendar, MapPin, DollarSign, Download, FileText, Building, User } from 'lucide-react'
import { toast } from 'react-hot-toast'

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
  contractor_quotes?: ContractorQuote[]
  site_visit_applications?: SiteVisitApplication[]
}

interface SiteVisitApplication {
  id: string
  contractor_id: string
  status: 'pending' | 'approved' | 'cancelled'
  notes?: string
  applied_at: string
  created_at: string
  updated_at: string
  contractor?: {
    id: string
    company_name: string
    contact_name: string
    phone: string
    email: string
  }
}

interface ContractorQuote {
  id: string
  project_id: string
  contractor_id: string
  quote_request_id?: string
  bid_amount: number
  bid_description: string
  pdf_url: string
  valid_until: string
  status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'selected' | 'expired'
  created_at: string
  contractor_name?: string
  contractor_company?: string
  price?: number
  description?: string
  contractor?: {
    id: string
    company_name: string
    contact_name: string
    phone: string
    email: string
  }
}

export default function MyQuotesPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [contractorQuotes, setContractorQuotes] = useState<ContractorQuote[]>([])
  const [quotesTableData, setQuotesTableData] = useState<any[]>([])
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null)
  const [selectedContractor, setSelectedContractor] = useState<{contractorId: string, projectId: string} | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  // 탭 상태 제거 - 단일 통합 뷰로 변경
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
      
      const supabase = createBrowserClient()
      
      // quote_requests를 조회하는 부분을 찾아서
      const { data: quotesData, error: quotesError } = await supabase
        .from('quote_requests')
        .select(`
          *,
          contractor_quotes!contractor_quotes_project_id_fkey (
            id,
            contractor_id,
            project_id,
            quote_request_id,
            price,
            description,
            pdf_url,
            pdf_filename,
            status,
            created_at,
            updated_at
          ),
          site_visit_applications (
            id,
            contractor_id,
            status,
            notes,
            applied_at,
            created_at,
            updated_at
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      
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

      // contractor 정보를 함께 가져오기 위해 추가
      if (quotesData && quotesData.length > 0) {
        for (const quote of quotesData) {
          // 견적서 제출 업체들의 contractor 정보 가져오기
          if (quote.contractor_quotes && quote.contractor_quotes.length > 0) {
            const contractorIds = quote.contractor_quotes.map((cq: any) => cq.contractor_id)
            
            const { data: contractorsData } = await supabase
              .from('contractors')
              .select('id, company_name, contact_name, phone, email')
              .in('id', contractorIds)
            
            // contractor 정보 매핑
            quote.contractor_quotes = quote.contractor_quotes.map((cq: any) => ({
              ...cq,
              contractor: contractorsData?.find(c => c.id === cq.contractor_id)
            }))
          }

          // 현장방문 신청 업체들의 contractor 정보 가져오기
          if (quote.site_visit_applications && quote.site_visit_applications.length > 0) {
            const siteVisitContractorIds = quote.site_visit_applications.map((sva: any) => sva.contractor_id)
            
            const { data: siteVisitContractorsData } = await supabase
              .from('contractors')
              .select('id, company_name, contact_name, phone, email')
              .in('id', siteVisitContractorIds)
            
            // contractor 정보 매핑
            quote.site_visit_applications = quote.site_visit_applications.map((sva: any) => ({
              ...sva,
              contractor: siteVisitContractorsData?.find(c => c.id === sva.contractor_id)
            }))
          }
        }
      }
      
      setQuotes(quotesData || [])

      // 견적서가 제출된 프로젝트들의 업체 견적서 조회
      const projectIds = quotesData?.filter(q => q.status === 'quote-submitted').map(q => q.id) || []
      console.log('Project IDs for contractor quotes:', projectIds)
      
      if (projectIds.length > 0) {
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


        let allContractorQuotes: ContractorQuote[] = []

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

  // 탭 변경 함수 제거 - 통합 뷰로 변경

  // 업체 선택 핸들러
  const handleContractorSelect = (contractorId: string, quoteRequestId: string) => {
    console.log('Selecting contractor:', { contractorId, quoteRequestId });
    
    if (!quoteRequestId) {
      console.error('Quote Request ID is missing');
      toast.error('견적 요청 정보가 없습니다');
      return;
    }
    
    setSelectedContractor({
      contractorId,
      projectId: quoteRequestId  // quote_request_id를 projectId로 사용
    });
    setIsModalOpen(true);
  };

  // 실제 업체 선택 처리 함수 (기존 로직 유지)
  const handleSelectContractor = async (contractorQuoteId: string, projectId: string, contractorId: string) => {
    try {
      const supabase = createBrowserClient()
      
      if (!confirm('이 업체를 선택하시겠습니까? 선택 후에는 변경할 수 없습니다.')) {
        return
      }
      
      // 1. 선택된 업체의 상태를 'accepted'로 변경
      const { error: updateError } = await supabase
        .from('contractor_quotes')
        .update({ status: 'accepted' })
        .eq('id', contractorQuoteId)

      if (updateError) {
        console.error('Error updating contractor quote status:', updateError)
        alert('업체 선택 중 오류가 발생했습니다.')
        return
      }

      // 2. 같은 프로젝트의 다른 업체들을 'rejected'로 변경
      const { error: rejectError } = await supabase
        .from('contractor_quotes')
        .update({ status: 'rejected' })
        .eq('project_id', projectId)
        .neq('id', contractorQuoteId)

      if (rejectError) {
        console.error('Error rejecting other contractor quotes:', rejectError)
      }

      // 3. 프로젝트 상태를 'completed'로 변경 (중요!)
      const { error: projectError } = await supabase
        .from('quote_requests')
        .update({ 
          status: 'completed',  // 'selected'가 아니라 'completed'
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      if (projectError) {
        console.error('Error updating project status:', projectError)
        alert('프로젝트 상태 업데이트 중 오류가 발생했습니다.')
        return
      }

      // 선택된 업체 정보 가져오기
      const { data: selectedContractor } = await supabase
        .from('contractors')
        .select('company_name, contact_name, phone')
        .eq('id', contractorId)
        .single()

      const contractorInfo = selectedContractor ? 
        `${selectedContractor.company_name} (${selectedContractor.contact_name})` : 
        '선택된 업체'

      const phoneNumber = selectedContractor?.phone || '등록된 전화번호'

      alert(`업체가 성공적으로 선택되었습니다!\n\n${contractorInfo}가 입력해주신 전화번호(${phoneNumber})로 연락드릴 예정입니다.\n\n프로젝트가 완료되었습니다.`)
      
      // 데이터 새로고침
      if (user?.id) {
        await fetchQuotes(user.id)
      }
      
    } catch (error) {
      console.error('Error selecting contractor:', error)
      alert('업체 선택 중 오류가 발생했습니다.')
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

        {/* 통합 견적 관리 뷰 */}
        <div className="space-y-6">
          {quotes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">아직 견적 요청이 없습니다</h3>
              <p className="text-gray-600 mb-4">새로운 견적 요청을 만들어보세요.</p>
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
            quotes.map((quote) => {
              const statusInfo = getStatusColor(quote.status)
              const IconComponent = statusInfo.icon
              const projectQuotes = contractorQuotes.filter(cq => cq.project_id === quote.id)
              
              return (
                <div key={quote.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6">
                    {/* 프로젝트 헤더 */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <IconComponent className="w-3 h-3 mr-1" />
                            {statusInfo.text}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(quote.created_at).toLocaleDateString('ko-KR')}
                          </span>
                          {quote.contractor_quotes && quote.contractor_quotes.length > 0 && (
                            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                              견적서 {quote.contractor_quotes.length}개
                            </span>
                          )}
                        </div>
                        
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">
                          {spaceTypeMap[quote.space_type] || quote.space_type}
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
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

                    {/* 현장방문 신청 섹션 - 입찰중 이전 상태에서만 표시 */}
                    {quote.site_visit_applications && 
                     quote.site_visit_applications.length > 0 && 
                     !['bidding', 'quote-submitted', 'completed'].includes(quote.status) && (
                      <div className="mt-6 mb-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                            현장방문 신청 업체 ({quote.site_visit_applications.length}개)
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {quote.site_visit_applications.map((application) => (
                            <div key={application.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition-colors">
                              <div className="mb-3">
                                <h4 className="font-semibold text-lg text-gray-900">
                                  {application.contractor?.company_name || '업체명 없음'}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  담당자: {application.contractor?.contact_name || '담당자 정보 없음'}
                                </p>
                              </div>
                              
                              <div className="mb-3">
                                <p className="text-sm text-gray-600">
                                  📞 {application.contractor?.phone || '연락처 없음'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  ✉️ {application.contractor?.email || '이메일 없음'}
                                </p>
                              </div>
                              
                              <div className="mb-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  application.status === 'pending' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : application.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {application.status === 'pending' ? '신청 대기중' : 
                                   application.status === 'approved' ? '승인됨' : '취소됨'}
                                </span>
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                신청일: {new Date(application.applied_at).toLocaleDateString('ko-KR')}
                              </div>
                              
                              {application.notes && (
                                <div className="mt-2 p-2 bg-white rounded text-sm text-gray-700">
                                  <strong>메모:</strong> {application.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 견적 제출 예정 업체 섹션 - 입찰중 상태에서 표시 */}
                    {quote.status === 'bidding' && 
                     quote.site_visit_applications && 
                     quote.site_visit_applications.filter(app => app.status === 'approved').length > 0 && (
                      <div className="mt-6 mb-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-orange-600" />
                            견적 제출 예정 업체 ({quote.site_visit_applications.filter(app => app.status === 'approved').length}개)
                          </h3>
                          <p className="text-sm text-gray-600">현장방문을 완료한 업체들이 견적서를 준비 중입니다.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {quote.site_visit_applications
                            .filter(application => application.status === 'approved')
                            .map((application) => (
                            <div key={application.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50 hover:bg-orange-100 transition-colors">
                              <div className="mb-3">
                                <h4 className="font-semibold text-lg text-gray-900">
                                  {application.contractor?.company_name || '업체명 없음'}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  담당자: {application.contractor?.contact_name || '담당자 정보 없음'}
                                </p>
                              </div>
                              
                              <div className="mb-3">
                                <p className="text-sm text-gray-600">
                                  📞 {application.contractor?.phone || '연락처 없음'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  ✉️ {application.contractor?.email || '이메일 없음'}
                                </p>
                              </div>
                              
                              <div className="mb-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  견적서 준비중
                                </span>
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                현장방문 완료: {new Date(application.applied_at).toLocaleDateString('ko-KR')}
                              </div>
                              
                              {application.notes && (
                                <div className="mt-2 p-2 bg-white rounded text-sm text-gray-700">
                                  <strong>메모:</strong> {application.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 받은 견적서 섹션 */}
                    {(quote.contractor_quotes && quote.contractor_quotes.length > 0) || projectQuotes.length > 0 ? (
                      <div className="mt-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            받은 견적서 ({quote.contractor_quotes?.length || projectQuotes.length}개)
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* 새로운 contractor_quotes 데이터 사용 */}
                          {quote.contractor_quotes && quote.contractor_quotes.length > 0 ? (
                            quote.contractor_quotes.map((contractorQuote) => (
                              <div key={contractorQuote.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="mb-3">
                                  <h4 className="font-semibold text-lg text-gray-900">
                                    {contractorQuote.contractor?.company_name || '업체명 없음'}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    담당자: {contractorQuote.contractor?.contact_name || '담당자 정보 없음'}
                                  </p>
                                </div>
                                
                                <div className="mb-3">
                                  <p className="text-2xl font-bold text-blue-600">
                                    ${contractorQuote.price?.toLocaleString() || '0'} CAD
                                  </p>
                                </div>
                                
                                <div className="mb-3">
                                  <p className="text-sm text-gray-700">
                                    {contractorQuote.description || '설명 없음'}
                                  </p>
                                </div>
                                
                                <div className="text-sm text-gray-500 mb-4">
                                  제출일: {new Date(contractorQuote.created_at).toLocaleDateString('ko-KR')}
                                </div>
                                
                                <div className="space-y-2">
                                  {contractorQuote.status === 'accepted' ? (
                                    <div className="space-y-2">
                                      <div className="w-full px-4 py-2 bg-green-100 text-green-800 rounded text-sm font-medium text-center">
                                        ✓ 선택된 업체
                                      </div>
                                      <div className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded text-sm text-center border border-blue-200">
                                        📞 {contractorQuote.contractor?.company_name || '업체'}가 입력해주신 전화번호로 연락드릴 예정입니다
                                      </div>
                                    </div>
                                  ) : contractorQuote.status === 'rejected' ? (
                                    <div className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded text-sm font-medium text-center">
                                      미선택
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        console.log('Button clicked with:', {
                                          contractorId: contractorQuote.contractor_id,
                                          quoteRequestId: quote.id,
                                          quote_request_id: contractorQuote.quote_request_id
                                        });
                                        // project.id 또는 quote.quote_request_id 사용
                                        handleContractorSelect(contractorQuote.contractor_id, quote.id);
                                      }}
                                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      업체 선택하기
                                    </button>
                                  )}
                                  
                                  {contractorQuote.pdf_url && (
                                    <button 
                                      onClick={() => downloadQuote(contractorQuote.id)}
                                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium"
                                    >
                                      견적서 다운로드
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            /* 기존 projectQuotes 데이터 사용 (fallback) */
                            projectQuotes.map((contractorQuote) => (
                              <div key={contractorQuote.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="mb-3">
                                  <h4 className="font-semibold text-lg text-gray-900">
                                    {contractorQuote.contractor_company || contractorQuote.contractor_name || '업체명 없음'}
                                  </h4>
                                </div>
                                
                                <div className="mb-3">
                                  <p className="text-2xl font-bold text-blue-600">
                                    ${contractorQuote.price?.toLocaleString() || '0'} CAD
                                  </p>
                                </div>
                                
                                <div className="mb-3">
                                  <p className="text-sm text-gray-700">
                                    {contractorQuote.description || '설명 없음'}
                                  </p>
                                </div>
                                
                                <div className="text-sm text-gray-500 mb-4">
                                  제출일: {new Date(contractorQuote.created_at).toLocaleDateString('ko-KR')}
                                </div>
                                
                                <div className="space-y-2">
                                  {contractorQuote.status === 'accepted' ? (
                                    <div className="space-y-2">
                                      <div className="w-full px-4 py-2 bg-green-100 text-green-800 rounded text-sm font-medium text-center">
                                        ✓ 선택된 업체
                                      </div>
                                      <div className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded text-sm text-center border border-blue-200">
                                        📞 {contractorQuote.contractor?.company_name || '업체'}가 입력해주신 전화번호로 연락드릴 예정입니다
                                      </div>
                                    </div>
                                  ) : contractorQuote.status === 'rejected' ? (
                                    <div className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded text-sm font-medium text-center">
                                      미선택
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        console.log('Button clicked with:', {
                                          contractorId: contractorQuote.contractor_id,
                                          quoteRequestId: quote.id,
                                          quote_request_id: contractorQuote.quote_request_id
                                        });
                                        // project.id 또는 quote.quote_request_id 사용
                                        handleContractorSelect(contractorQuote.contractor_id, quote.id);
                                      }}
                                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      업체 선택하기
                                    </button>
                                  )}
                                  
                                  {contractorQuote.pdf_url && (
                                    <button 
                                      onClick={() => downloadQuote(contractorQuote.id)}
                                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium"
                                    >
                                      견적서 다운로드
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 p-6 bg-gray-50 rounded-lg text-center">
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">아직 제출된 견적서가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

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
