'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { getQuoteRequests } from '@/lib/supabase/quotes'
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, Calendar, MapPin, DollarSign, Download, FileText, Building, User, Home } from 'lucide-react'
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
  contractors?: {
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
  bid_amount: number
  bid_description: string
  pdf_url: string
  pdf_filename?: string
  valid_until: string
  status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'selected' | 'expired'
  created_at: string
  contractor_name?: string
  contractor_company?: string
  price?: number
  description?: string
  contractors?: {
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
  const [downloadingQuotes, setDownloadingQuotes] = useState<Set<string>>(new Set())
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
      
      // ✅ site_visit_applications도 함께 가져오기
      const { data: quotesData, error: quotesError } = await supabase
        .from('quote_requests')
        .select(`
          *,
          contractor_quotes!contractor_quotes_project_id_fkey (
            id,
            contractor_id,
            project_id,
            price,
            description,
            pdf_url,
            pdf_filename,
            status,
            created_at,
            updated_at,
            contractors!contractor_quotes_contractor_id_fkey (
              id,
              company_name,
              contact_name,
              phone,
              email
            )
          ),
          site_visit_applications!site_visit_applications_project_id_fkey (
            id,
            contractor_id,
            status,
            notes,
            applied_at,
            created_at,
            updated_at,
            contractors!site_visit_applications_contractor_id_fkey (
              id,
              company_name,
              contact_name,
              phone,
              email
            )
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
        console.log('Project status:', quotesData[0].status)
        console.log('Site visit applications:', quotesData[0].site_visit_applications)
        
        // contractor_quotes 구조 확인
        if (quotesData[0].contractor_quotes && quotesData[0].contractor_quotes.length > 0) {
          console.log('First contractor quote:', quotesData[0].contractor_quotes[0])
          console.log('Contractor data:', quotesData[0].contractor_quotes[0].contractors)
        }
      } else {
        console.log('No quotes found for this customer')
      }

      setQuotes(quotesData || [])
      setContractorQuotes([])
      
    } catch (error) {
      console.error('Error fetching data:', error)
      // 오류가 있어도 빈 배열로 설정하여 페이지가 로드되도록 함
      setQuotes([])
      setContractorQuotes([])
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
    'detached_house': '단독주택',
    'condo': '콘도',
    'townhouse': '타운하우스',
    'town_house': '타운하우스',
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
    'immediate': '즉시',
    'within_1_month': '1개월 이내',
    'within_3_months': '3개월 이내',
    'flexible': '유연함'
  }

  // ✅ 현장방문 단계인지 확인하는 헬퍼 함수
  const isInSiteVisitPhase = (status: string) => {
    return ['pending', 'approved', 'site-visit-pending', 'site-visit-completed'].includes(status)
  }

  // 업체 선택 처리 함수 - API 라우트 사용
  const handleSelectContractor = async (contractorQuoteId: string, projectId: string, contractorId: string) => {
    try {
      if (!confirm('이 업체를 선택하시겠습니까? 선택 후에는 변경할 수 없습니다.')) {
        return
      }

      console.log('Selecting contractor:', { contractorQuoteId, projectId, contractorId })

      // API 호출하여 서버에서 데이터베이스 업데이트
      const response = await fetch('/api/contractor-selection', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          contractorQuoteId, 
          projectId, 
          contractorId 
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('API error:', result)
        alert(result.error || '업체 선택 중 오류가 발생했습니다.')
        return
      }

      console.log('API response:', result)

      // 선택된 업체 정보 가져오기 (로컬 데이터에서)
      const selectedQuote = quotes.find(q => q.id === projectId)
      const selectedContractorQuote = selectedQuote?.contractor_quotes?.find(cq => cq.id === contractorQuoteId)
      const contractorInfo = selectedContractorQuote?.contractors?.company_name || '선택된 업체'
      const contactName = selectedContractorQuote?.contractors?.contact_name || ''
      const phoneNumber = selectedContractorQuote?.contractors?.phone || '등록된 전화번호'

      alert(`업체가 성공적으로 선택되었습니다!\n\n${contractorInfo} ${contactName ? `(${contactName})` : ''}가 입력해주신 전화번호(${phoneNumber})로 연락드릴 예정입니다.\n\n프로젝트가 완료되었습니다.`)
      
      // 데이터 새로고침
      if (user?.id) {
        await fetchQuotes(user.id)
      }
      
    } catch (error) {
      console.error('Error selecting contractor:', error)
      alert('업체 선택 중 오류가 발생했습니다.')
    }
  }

  // ✅ 수정된 견적서 다운로드 함수 - 새로운 클라이언트 인스턴스 사용
  const downloadQuote = async (quoteId: string) => {
    // 중복 클릭 방지
    if (downloadingQuotes.has(quoteId)) {
      console.log('⚠️ 이미 다운로드 중입니다:', quoteId)
      return
    }

    console.log('========================================')
    console.log('🔽 PDF 다운로드 시작')
    console.log('견적서 ID:', quoteId)
    console.log('========================================')
    
    // 다운로드 중 상태 추가
    setDownloadingQuotes(prev => new Set(prev).add(quoteId))
    
    try {
      // ✅ 매번 새로운 Supabase 클라이언트 인스턴스 생성
      const supabase = createBrowserClient()
      
      console.log('📊 1단계: 데이터베이스에서 PDF 정보 조회 중...')
      console.log('쿼리 실행: contractor_quotes 테이블, ID =', quoteId)
      
      // ✅ 타임아웃과 함께 쿼리 실행
      const queryPromise = supabase
        .from('contractor_quotes')
        .select('pdf_url, pdf_filename, contractor_id, project_id')
        .eq('id', quoteId)
        .single()

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('쿼리 타임아웃 (15초)')), 15000)
      )

      const { data: quoteData, error: quoteError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any

      console.log('📋 쿼리 완료!')
      console.log('✅ 조회 결과:', {
        success: !quoteError,
        hasData: !!quoteData,
        pdf_url: quoteData?.pdf_url || 'NULL',
        pdf_filename: quoteData?.pdf_filename || 'NULL',
        contractor_id: quoteData?.contractor_id || 'NULL',
        project_id: quoteData?.project_id || 'NULL',
        errorCode: quoteError?.code || 'NONE',
        errorMessage: quoteError?.message || 'NONE'
      })

      if (quoteError) {
        console.error('❌ 데이터베이스 쿼리 오류:', quoteError)
        toast.error(`데이터베이스 오류: ${quoteError.message}`)
        return
      }

      if (!quoteData) {
        console.error('❌ 견적서 데이터가 존재하지 않습니다')
        toast.error('견적서 정보를 찾을 수 없습니다.')
        return
      }

      if (!quoteData.pdf_url) {
        console.error('❌ PDF URL이 비어있습니다')
        toast.error('견적서 파일이 업로드되지 않았습니다.')
        return
      }

      const originalUrl = quoteData.pdf_url
      console.log('📄 원본 URL:', originalUrl)
      console.log('📄 파일명:', quoteData.pdf_filename || '(없음)')

      // 2단계: URL 형식 판단 및 처리
      if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
        console.log('🌐 케이스 1: 전체 URL 감지')
        window.open(originalUrl, '_blank')
        toast.success('견적서를 새 탭에서 엽니다...')
        console.log('✅ 성공: 전체 URL로 다운로드')
        return
      }

      // 케이스 2: 상대 경로 - Supabase Storage 사용
      console.log('📁 케이스 2: 상대 경로 감지 - Supabase Storage 사용')
      
      let filePath = originalUrl.trim()
      const bucketPrefixes = ['contractor-quotes/', '/contractor-quotes/', 'contractor-quotes\\', '\\contractor-quotes\\']
      for (const prefix of bucketPrefixes) {
        if (filePath.startsWith(prefix)) {
          filePath = filePath.substring(prefix.length)
          console.log(`🔧 버킷 접두사 제거: "${prefix}" → "${filePath}"`)
        }
      }

      filePath = filePath.replace(/^\/+|\/+$/g, '')
      console.log('🔧 정규화된 파일 경로:', filePath)

      // Public URL 생성
      console.log('🔄 Public URL 생성 시도...')
      const { data: publicUrlData } = supabase.storage
        .from('contractor-quotes')
        .getPublicUrl(filePath)

      console.log('Public URL 결과:', publicUrlData)

      if (publicUrlData?.publicUrl) {
        const publicUrl = publicUrlData.publicUrl
        console.log('✅ Public URL 생성 성공:', publicUrl)
        
        window.open(publicUrl, '_blank')
        toast.success('견적서를 새 탭에서 엽니다...')
        console.log('✅ 성공: Public URL로 다운로드')
        return
      }

      // Signed URL로 fallback
      console.log('🔄 Signed URL 생성 시도...')
      const { data: signedData, error: signedError } = await supabase.storage
        .from('contractor-quotes')
        .createSignedUrl(filePath, 3600)

      if (!signedError && signedData?.signedUrl) {
        console.log('✅ Signed URL 생성 성공')
        window.open(signedData.signedUrl, '_blank')
        toast.success('견적서를 새 탭에서 엽니다...')
        return
      }

      console.error('❌ 모든 다운로드 방법 실패')
      toast.error('견적서 파일을 찾을 수 없습니다.')

    } catch (error: any) {
      console.error('========================================')
      console.error('❌ 오류 발생')
      console.error('오류 내용:', error)
      console.error('========================================')
      
      if (error.message === '쿼리 타임아웃 (15초)') {
        toast.error('요청 시간이 초과되었습니다. 다시 시도해주세요.')
      } else {
        toast.error('견적서 다운로드 중 오류가 발생했습니다.')
      }
    } finally {
      // 다운로드 중 상태 제거
      setDownloadingQuotes(prev => {
        const newSet = new Set(prev)
        newSet.delete(quoteId)
        return newSet
      })
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
              const siteVisitCount = quote.site_visit_applications?.length || 0
              const quoteCount = quote.contractor_quotes?.length || 0
              
              // ✅ 현장방문 단계인지 확인
              const showSiteVisitInfo = isInSiteVisitPhase(quote.status)
              
              return (
                <div key={quote.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6">
                    {/* 프로젝트 헤더 */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3 flex-wrap gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <IconComponent className="w-3 h-3 mr-1" />
                            {statusInfo.text}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(quote.created_at).toLocaleDateString('ko-KR')}
                          </span>
                          {/* ✅ 현장방문 단계일 때만 현장방문 배지 표시 */}
                          {showSiteVisitInfo && siteVisitCount > 0 && (
                            <span className="inline-flex items-center bg-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm">
                              <Home className="w-4 h-4 mr-1.5" />
                              현장방문 신청 {siteVisitCount}개
                            </span>
                          )}
                          {quoteCount > 0 && (
                            <span className="inline-flex items-center bg-purple-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm">
                              <FileText className="w-4 h-4 mr-1.5" />
                              견적서 {quoteCount}개
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

                    {/* ✅ 현장방문 단계일 때만 현장방문 신청 섹션 표시 */}
                    {showSiteVisitInfo && siteVisitCount > 0 && (
                      <div className="mt-6 mb-6">
                        <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                            <Home className="w-6 h-6 mr-2 text-blue-600" />
                            현장방문 신청 업체 ({siteVisitCount}개)
                          </h3>
                          <p className="text-sm text-gray-700">
                            {siteVisitCount}개 업체가 현장방문을 신청했습니다. 승인하시면 업체가 현장방문 후 견적서를 제출합니다.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {quote.site_visit_applications!.map((application) => (
                            <div key={application.id} className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all shadow-sm">
                              <div className="mb-3">
                                <h4 className="font-semibold text-lg text-gray-900 flex items-center">
                                  <Building className="w-5 h-5 mr-2 text-blue-600" />
                                  {application.contractors?.company_name || '업체명 없음'}
                                </h4>
                                <p className="text-sm text-gray-600 ml-7">
                                  담당자: {application.contractors?.contact_name || '담당자 정보 없음'}
                                </p>
                              </div>
                              
                              <div className="mb-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                  application.status === 'pending' 
                                    ? 'bg-green-100 text-green-800 border border-green-300' 
                                    : application.status === 'approved'
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                }`}>
                                  {application.status === 'pending' ? '방문 예정' : 
                                   application.status === 'approved' ? '승인됨' : '취소됨'}
                                </span>
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                신청일: {new Date(application.applied_at).toLocaleDateString('ko-KR')}
                              </div>
                              
                              {application.notes && (
                                <div className="mt-2 p-2 bg-white rounded text-sm text-gray-700 border border-blue-200">
                                  <strong>메모:</strong> {application.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 받은 견적서 섹션 */}
                    {quoteCount > 0 ? (
                      <div className="mt-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            받은 견적서 ({quoteCount}개)
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {quote.contractor_quotes!.map((contractorQuote) => {
                            const isDownloading = downloadingQuotes.has(contractorQuote.id)
                            
                            return (
                              <div key={contractorQuote.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="mb-3">
                                  <h4 className="font-semibold text-lg text-gray-900">
                                    {contractorQuote.contractors?.company_name || '업체명 없음'}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    담당자: {contractorQuote.contractors?.contact_name || '담당자 정보 없음'}
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
                                        📞 {contractorQuote.contractors?.company_name || '업체'}가 입력해주신 전화번호로 연락드릴 예정입니다
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
                                          projectId: contractorQuote.project_id
                                        });
                                        handleSelectContractor(contractorQuote.id, quote.id, contractorQuote.contractor_id);
                                      }}
                                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      업체 선택하기
                                    </button>
                                  )}
                                  
                                  {contractorQuote.pdf_url && (
                                    <button 
                                      onClick={() => {
                                        console.log('🔽 Download button clicked for quote:', contractorQuote.id)
                                        downloadQuote(contractorQuote.id)
                                      }}
                                      disabled={isDownloading}
                                      className={`w-full px-4 py-2 border text-sm font-medium flex items-center justify-center rounded ${
                                        isDownloading
                                          ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                      }`}
                                    >
                                      {isDownloading ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                                          다운로드 중...
                                        </>
                                      ) : (
                                        <>
                                          <Download className="w-4 h-4 mr-2" />
                                          견적서 다운로드
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      // 견적서도 없고 현장방문 신청도 없을 때만 이 메시지 표시
                      !showSiteVisitInfo && siteVisitCount === 0 && (
                        <div className="mt-6 p-6 bg-gray-50 rounded-lg text-center">
                          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">아직 제출된 견적서가 없습니다.</p>
                        </div>
                      )
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
