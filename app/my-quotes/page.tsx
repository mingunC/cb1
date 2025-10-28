'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { getQuoteRequests } from '@/lib/supabase/quotes'
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, Calendar, MapPin, DollarSign, Download, FileText, Building, User, Home, Play, Loader } from 'lucide-react'
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
  status: 'pending' | 'approved' | 'rejected' | 'site-visit-pending' | 'site-visit-completed' | 'bidding' | 'quote-submitted' | 'contractor-selected' | 'in-progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  contractor_quotes?: ContractorQuote[]
  site_visit_applications?: SiteVisitApplication[]
  project_started_at?: string
  project_completed_at?: string
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
  const [startingProject, setStartingProject] = useState<string | null>(null)
  const [selectingContractor, setSelectingContractor] = useState<string | null>(null)
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
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Under Review' }
      case 'approved':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' }
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' }
      case 'site-visit-pending':
        return { color: 'bg-emerald-100 text-emerald-800', icon: Calendar, text: 'Site Visit Pending' }
      case 'site-visit-completed':
        return { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, text: 'Site Visit Completed' }
      case 'bidding':
        return { color: 'bg-orange-100 text-orange-800', icon: Clock, text: 'Bidding' }
      case 'quote-submitted':
        return { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle, text: 'Quote Submitted' }
      case 'contractor-selected':
        return { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, text: 'Contractor Selected' }
      case 'in-progress':
        return { color: 'bg-purple-100 text-purple-800', icon: Play, text: 'In Progress' }
      case 'completed':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completed' }
      case 'cancelled':
        return { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: 'Cancelled' }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'Unknown' }
    }
  }

  const formatBudget = (budget: string) => {
    const budgetMap: { [key: string]: string } = {
      'under_50k': 'Under $50,000',
      '50k_to_100k': '$50,000 - $100,000',
      '50k_100k': '$50,000 - $100,000',
      'over_100k': '$100,000+'
    }
    return budgetMap[budget] || budget
  }

  const spaceTypeMap: { [key: string]: string } = {
    'detached-house': 'Detached House',
    'detached_house': 'Detached House',
    'condo': 'Condo',
    'townhouse': 'Town House',
    'town_house': 'Town House',
    'commercial': 'Commercial',
    'beecroft': 'Beecroft',
    'apartment': 'Apartment',
    'house': 'House'
  }

  const projectTypeMap: { [key: string]: string } = {
    'kitchen': 'Kitchen',
    'bathroom': 'Bathroom',
    'basement': 'Basement',
    'painting': 'Painting',
    'flooring': 'Flooring',
    'full-renovation': 'Full Renovation',
    'full_renovation': 'Full Renovation',
    'restaurant': 'Restaurant',
    'retail': 'Retail',
    'office': 'Office',
    'education': 'Education',
    'other': 'Other'
  }

  const timelineMap: { [key: string]: string } = {
    'asap': 'As soon as possible',
    'immediate': 'Immediate',
    'within_1_month': 'Within 1 month',
    'within_3_months': 'Within 3 months',
    '3_months': 'Within 3 months',
    'flexible': 'Flexible'
  }

  // ✅ 현장방문 단계인지 확인하는 헬퍼 함수
  const isInSiteVisitPhase = (status: string) => {
    return ['pending', 'approved', 'site-visit-pending', 'site-visit-completed'].includes(status)
  }

  // 업체 선택 처리 함수 - API 라우트 사용
  const handleSelectContractor = async (contractorQuoteId: string, projectId: string, contractorId: string) => {
    // 중복 클릭 방지
    if (selectingContractor) {
      console.log('Already processing contractor selection')
      return
    }
    
    try {
      if (!confirm('Do you want to select this contractor? You cannot change this once selected.')) {
        return
      }

      setSelectingContractor(projectId)
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
        
        // 이미 선정된 경우는 성공으로 처리 (중복 클릭 방지)
        if (result.message && result.message.includes('이미 업체가 선정된')) {
          console.log('✅ Project already has selected contractor, refreshing data')
          if (user?.id) {
            await fetchQuotes(user.id)
          }
          return
        }
        
        toast.error(result.error || 'Error selecting contractor.')
        return
      }

      console.log('API response:', result)
      
      // 선택된 업체 정보 가져오기 (로컬 데이터에서 먼저)
      const selectedQuote = quotes.find(q => q.id === projectId)
      const selectedContractorQuote = selectedQuote?.contractor_quotes?.find(cq => cq.id === contractorQuoteId)
      const contractorInfo = selectedContractorQuote?.contractors?.company_name || 'Selected Contractor'
      const contactName = selectedContractorQuote?.contractors?.contact_name || ''
      const phoneNumber = selectedContractorQuote?.contractors?.phone || 'registered phone number'

      toast.success(`Contractor selected successfully!\n\n${contractorInfo} ${contactName ? `(${contactName})` : ''} will contact you at the phone number you provided (${phoneNumber}).`)
      
      // 성공 메시지 표시 후 백그라운드에서 데이터 새로고침
      if (user?.id) {
        fetchQuotes(user.id).catch(err => console.error('Error refreshing quotes:', err))
      }
      
    } catch (error) {
      console.error('Error selecting contractor:', error)
      toast.error('업체 선택 중 오류가 발생했습니다.')
    } finally {
      setSelectingContractor(null)
    }
  }

  // ✅ 프로젝트 시작 처리 함수 추가
  const handleStartProject = async (projectId: string) => {
    try {
      if (!confirm('Do you want to start the project?\n\nPlease coordinate with the contractor and schedule before clicking this button.')) {
        return
      }

      setStartingProject(projectId)
      console.log('Starting project:', projectId)

      const response = await fetch('/api/start-project', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ projectId })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('API error:', result)
        toast.error(result.error || 'Error starting project.')
        return
      }

      console.log('API response:', result)
      toast.success('Project started! 🚀')
      
      // 데이터 새로고침
      if (user?.id) {
        await fetchQuotes(user.id)
      }
      
    } catch (error) {
      console.error('Error starting project:', error)
      toast.error('Error starting project.')
    } finally {
      setStartingProject(null)
    }
  }

  // ✅ 로컬 캐시 데이터 사용 - 데이터베이스 쿼리 없음!
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
      // ✅ 로컬 캐시에서 데이터 찾기 (데이터베이스 쿼리 없음!)
      console.log('📊 로컬 캐시에서 PDF 정보 조회 중...')
      
      let quoteData: ContractorQuote | null = null
      
      // 모든 프로젝트의 견적서를 검색
      for (const project of quotes) {
        if (project.contractor_quotes) {
          const found = project.contractor_quotes.find(cq => cq.id === quoteId)
          if (found) {
            quoteData = found
            break
          }
        }
      }

      console.log('📋 조회 완료!')
      console.log('✅ 조회 결과:', {
        hasData: !!quoteData,
        pdf_url: quoteData?.pdf_url || 'NULL',
        pdf_filename: quoteData?.pdf_filename || 'NULL',
        contractor_id: quoteData?.contractor_id || 'NULL',
        project_id: quoteData?.project_id || 'NULL'
      })

      if (!quoteData) {
        console.error('❌ 견적서 데이터가 존재하지 않습니다')
        toast.error('Quote information not found.')
        return
      }

      if (!quoteData.pdf_url) {
        console.error('❌ PDF URL이 비어있습니다')
        toast.error('Quote file not uploaded.')
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
      const supabase = createBrowserClient()
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
      toast.error('Quote file not found.')

    } catch (error: any) {
      console.error('========================================')
      console.error('❌ 오류 발생')
      console.error('오류 내용:', error)
      console.error('========================================')
                                          toast.error('Error downloading quote.')
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please log in with a customer account.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg"
          >
            Go to Login
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
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">My Quotes</h1>
          <p className="mt-2 text-gray-600">Compare your quote requests with contractor quotes.</p>
        </div>

        {/* 통합 견적 관리 뷰 */}
        <div className="space-y-6">
          {quotes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quote requests yet</h3>
              <p className="text-gray-600 mb-4">Create a new quote request.</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/quote-request')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg"
                >
                  Request a Quote
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
              
              // ✅ 프로젝트 시작 가능 여부
              const canStartProject = quote.status === 'contractor-selected' || 
                (quote.status === 'bidding' && quote.selected_contractor_id)
              const isProjectInProgress = quote.status === 'in-progress'
              const isProjectCompleted = quote.status === 'completed'
              
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
                            <span className="inline-flex items-center bg-emerald-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm">
                              <Home className="w-4 h-4 mr-1.5" />
                              Site Visit Applications {siteVisitCount}
                            </span>
                          )}
                          {quoteCount > 0 && (
                            <span className="inline-flex items-center bg-purple-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm">
                              <FileText className="w-4 h-4 mr-1.5" />
                              Quotes {quoteCount}
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
                              <strong>Project:</strong> {quote.project_types?.map(type => 
                                projectTypeMap[type] || type
                              ).join(', ')}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Timeline:</strong> {timelineMap[quote.timeline] || quote.timeline}
                            </p>
                            {quote.visit_date && (
                              <p className="text-sm text-gray-600">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Visit Date: {new Date(quote.visit_date).toLocaleDateString('ko-KR')}
                              </p>
                            )}
                          </div>
                        </div>

                        {quote.description && (
                          <p className="text-sm text-gray-600 mb-4">
                            <strong>Request:</strong> {quote.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="bg-emerald-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          <Eye className="w-4 h-4 mr-1 inline" />
                          View Details
                        </button>
                      </div>
                    </div>

                    {/* ✅ 프로젝트 시작 버튼 섹션 - contractor-selected 상태일 때만 표시 */}
                    {canStartProject && (
                      <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-emerald-300 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                              <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
                              프로젝트를 시작해주세요!
                            </h3>
                            
                            <div className="space-y-3">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>업체와 연락하여 공사 일정을 확정하세요</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                준비가 완료되고 프로젝트를 시작하실 때 시작버튼을 눌러주세요.
                              </p>
                            </div>
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() => handleStartProject(quote.id)}
                              disabled={startingProject === quote.id}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {startingProject === quote.id ? (
                                <>
                                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                                  시작 중...
                                </>
                              ) : (
                                <>
                                  <Play className="w-5 h-5 mr-2" />
                                  프로젝트 시작
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ✅ 프로젝트 진행 중 표시 */}
                    {isProjectInProgress && (
                      <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                          <Play className="w-6 h-6 mr-2 text-purple-600 animate-pulse" />
                          프로젝트가 시작되었습니다.
                        </h3>
                        <p className="text-sm text-gray-700">
                          고객과 업체와 함께 같이 지속적으로 소통하며 프로젝트 진행을 돕도록 하겠습니다.
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                          캐나다비버를 이용해주셔서 감사합니다. 프로젝트가 끝나면 후기를 꼭 부탁드릴게요.
                        </p>
                        {quote.project_started_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            시작일: {new Date(quote.project_started_at).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* ✅ 프로젝트 완료 표시 */}
                    {isProjectCompleted && (
                      <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                          <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
                          Project Completed
                        </h3>
                        <p className="text-sm text-gray-700">
                          The project has been successfully completed. Thank you for using our service!
                        </p>
                        {quote.project_completed_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Completed: {new Date(quote.project_completed_at).toLocaleDateString('en-US')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* ✅ 현장방문 단계일 때만 현장방문 신청 섹션 표시 */}
                    {showSiteVisitInfo && siteVisitCount > 0 && (
                      <div className="mt-6 mb-6">
                        <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                            <Home className="w-6 h-6 mr-2 text-emerald-600" />
                            Site Visit Applications ({siteVisitCount})
                          </h3>
                          <p className="text-sm text-gray-700">
                            {siteVisitCount} contractors have applied for a site visit. Once approved, they will visit the site and submit quotes.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {quote.site_visit_applications!.map((application) => (
                            <div key={application.id} className="border-2 border-emerald-300 rounded-lg p-4 bg-emerald-50 hover:bg-blue-100 hover:border-emerald-400 transition-all shadow-sm">
                              <div className="mb-3">
                                <h4 className="font-semibold text-lg text-gray-900 flex items-center">
                                  <Building className="w-5 h-5 mr-2 text-emerald-600" />
                                  {application.contractors?.company_name || 'Company Name Not Available'}
                                </h4>
                                <p className="text-sm text-gray-600 ml-7">
                                  Contact: {application.contractors?.contact_name || 'Contact Info Not Available'}
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
                                  {application.status === 'pending' ? 'Pending' : 
                                   application.status === 'approved' ? 'Approved' : 'Cancelled'}
                                </span>
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                Applied: {new Date(application.applied_at).toLocaleDateString('en-US')}
                              </div>
                              
                              {application.notes && (
                                <div className="mt-2 p-2 bg-white rounded text-sm text-gray-700 border border-emerald-200">
                                  <strong>Note:</strong> {application.notes}
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
                            Received Quotes ({quoteCount})
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {quote.contractor_quotes!.map((contractorQuote) => {
                            const isDownloading = downloadingQuotes.has(contractorQuote.id)
                            
                            return (
                              <div key={contractorQuote.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="mb-3">
                                  <h4 className="font-semibold text-lg text-gray-900">
                                    {contractorQuote.contractors?.company_name || 'Company Name Not Available'}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Contact: {contractorQuote.contractors?.contact_name || 'Contact Info Not Available'}
                                  </p>
                                </div>
                                
                                <div className="mb-3">
                                  <p className="text-2xl font-bold text-emerald-600">
                                    ${contractorQuote.price?.toLocaleString() || '0'} CAD
                                  </p>
                                </div>
                                
                                <div className="mb-3">
                                  <p className="text-sm text-gray-700">
                                    {contractorQuote.description || 'No description'}
                                  </p>
                                </div>
                                
                                <div className="text-sm text-gray-500 mb-4">
                                  Submitted: {new Date(contractorQuote.created_at).toLocaleDateString('en-US')}
                                </div>
                                
                                <div className="space-y-2">
                                  {contractorQuote.status === 'accepted' || 
                                   (quote.status === 'contractor-selected' && quote.selected_contractor_id === contractorQuote.contractor_id) ||
                                   (quote.status === 'bidding' && quote.selected_contractor_id === contractorQuote.contractor_id) ? (
                                    <div className="space-y-2">
                                      <div className="w-full px-4 py-2 bg-green-100 text-green-800 rounded text-sm font-medium text-center">
                                        ✓ Selected Contractor
                                      </div>
                                      <div className="w-full px-4 py-2 bg-emerald-50 text-emerald-700 rounded text-sm text-center border border-emerald-200">
                                        📞 {contractorQuote.contractors?.company_name || 'Contractor'} will contact you at the phone number you provided
                                      </div>
                                    </div>
                                  ) : contractorQuote.status === 'rejected' ? (
                                    <div className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded text-sm font-medium text-center">
                                      Not Selected
                                    </div>
                                  ) : (
                                    // ✅ contractor-selected, in-progress, completed 상태일 때는 선택 버튼 숨기기
                                    !['contractor-selected', 'in-progress', 'completed'].includes(quote.status) && (
                                      <button 
                                        onClick={() => {
                                          console.log('Button clicked with:', {
                                            contractorId: contractorQuote.contractor_id,
                                            quoteRequestId: quote.id,
                                            projectId: contractorQuote.project_id
                                          });
                                          handleSelectContractor(contractorQuote.id, quote.id, contractorQuote.contractor_id);
                                        }}
                                        disabled={selectingContractor === quote.id}
                                        className={`w-full px-4 py-2 rounded ${
                                          selectingContractor === quote.id 
                                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                      >
                                        {selectingContractor === quote.id ? 'Processing...' : 'Select Contractor'}
                                      </button>
                                    )
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
                                          Downloading...
                                        </>
                                      ) : (
                                        <>
                                          <Download className="w-4 h-4 mr-2" />
                                          Download Quote
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
                          <p className="text-gray-500">No quotes submitted yet.</p>
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
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Basic Information</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><strong>Space Type:</strong> {spaceTypeMap[selectedQuote.space_type] || selectedQuote.space_type}</p>
                      <p><strong>프로젝트:</strong> {selectedQuote.project_types?.map(type => 
                        projectTypeMap[type] || type
                      ).join(', ')}</p>
                      <p><strong>예산:</strong> {formatBudget(selectedQuote.budget)}</p>
                      <p><strong>일정:</strong> {timelineMap[selectedQuote.timeline] || selectedQuote.timeline}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Location</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p><strong>Address:</strong> {selectedQuote.full_address}</p>
                      <p><strong>Postal Code:</strong> {selectedQuote.postal_code}</p>
                      {selectedQuote.visit_date && (
                        <p><strong>Visit Date:</strong> {new Date(selectedQuote.visit_date).toLocaleDateString('ko-KR')}</p>
                      )}
                    </div>
                  </div>

                  {selectedQuote.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Request</h4>
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
