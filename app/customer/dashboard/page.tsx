'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Calendar, MapPin, DollarSign, Clock, Award, Play, Eye, CheckCircle, Download, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Project {
  id: string
  space_type: string
  project_types: string[]
  budget: string
  timeline: string
  full_address: string
  postal_code: string
  description: string
  status: string
  created_at: string
  selected_contractor_id?: string
  selected_quote_id?: string
}

interface Quote {
  id: string
  contractor_id: string
  price: number
  description: string
  pdf_url: string
  pdf_filename?: string
  created_at: string
  status: string
  contractor?: {
    company_name: string
    contact_name?: string
    email: string
  }
}

export default function CustomerDashboard() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectQuotes, setSelectedProjectQuotes] = useState<Record<string, Quote[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [selectingContractor, setSelectingContractor] = useState<string | null>(null) // 선택 중인 견적서 ID

  useEffect(() => {
    checkAuthAndLoadProjects()
  }, [])

  const checkAuthAndLoadProjects = async () => {
    try {
      const supabase = createBrowserClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        setIsLoading(false)
        router.push('/login')
        return
      }

      await loadProjects(user.id)
    } catch (error) {
      console.error('Error:', error)
      setIsLoading(false)
      router.push('/login')
    }
  }

  const loadProjects = async (userId: string) => {
    try {
      setIsLoading(true)
      const supabase = createBrowserClient()
      
      // 내 프로젝트 가져오기
      const { data: projectsData, error: projectsError } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
      
      if (projectsError) throw projectsError
      
      setProjects(projectsData || [])
      
      // 입찰 중이거나 종료된 프로젝트의 견적서 로드
      const biddingProjects = (projectsData || []).filter(
        p => p.status === 'bidding' || p.status === 'bidding-closed' || p.status === 'contractor-selected'
      )
      
      for (const project of biddingProjects) {
        await loadQuotes(project.id)
      }
      
    } catch (error) {
      console.error('Failed to load projects:', error)
      toast.error('프로젝트를 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const loadQuotes = async (projectId: string) => {
    try {
      const supabase = createBrowserClient()
      
      const { data: quotesData, error: quotesError } = await supabase
        .from('contractor_quotes')
        .select(`
          *,
          contractor:contractors!contractor_quotes_contractor_id_fkey(
            company_name,
            contact_name,
            email
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (quotesError) throw quotesError
      
      console.log('✅ Loaded quotes for project:', projectId, quotesData)
      
      setSelectedProjectQuotes(prev => ({
        ...prev,
        [projectId]: quotesData || []
      }))
      
    } catch (error) {
      console.error('Failed to load quotes:', error)
    }
  }

  // PDF 다운로드 함수 - 개선된 버전
  const handleDownloadPDF = async (quote: Quote) => {
    console.log('🔽 Download button clicked for quote:', quote.id)
    console.log('📄 Quote data:', { 
      id: quote.id, 
      pdf_url: quote.pdf_url, 
      pdf_filename: quote.pdf_filename,
      contractor: quote.contractor?.company_name 
    })
    
    if (!quote.pdf_url) {
      console.error('❌ No PDF URL found for quote:', quote.id)
      toast.error('PDF 파일 정보가 없습니다')
      return
    }

    try {
      const supabase = createBrowserClient()
      
      console.log('📦 Using PDF URL:', quote.pdf_url)
      
      // Supabase Storage에서 public URL 생성
      const { data: publicUrlData } = supabase.storage
        .from('contractor-quotes')
        .getPublicUrl(quote.pdf_url)

      console.log('🔗 Generated public URL:', publicUrlData.publicUrl)

      if (publicUrlData?.publicUrl) {
        // 새 탭에서 PDF 열기
        const opened = window.open(publicUrlData.publicUrl, '_blank')
        
        if (opened) {
          console.log('✅ PDF opened successfully')
          toast.success('PDF 파일을 여는 중...')
        } else {
          console.error('❌ Failed to open new window (popup blocked?)')
          toast.error('팝업 차단을 해제해주세요')
        }
      } else {
        throw new Error('Failed to generate public URL')
      }
      
    } catch (error) {
      console.error('❌ PDF download error:', error)
      toast.error('PDF 다운로드에 실패했습니다')
    }
  }

  const handleSelectContractor = async (projectId: string, contractorId: string, quoteId: string) => {
    console.log('🎯 업체 선택하기 버튼 클릭:', { projectId, contractorId, quoteId })
    console.log('📊 현재 상태:', {
      selectingContractor,
      isAlreadySelecting: selectingContractor !== null
    })
    
    if (selectingContractor) {
      console.log('⚠️ 이미 다른 업체를 선택 중입니다')
      toast.error('처리 중입니다. 잠시만 기다려주세요.')
      return
    }
    
    if (!confirm('이 업체를 선택하시겠습니까?')) {
      console.log('❌ 사용자가 취소했습니다')
      return
    }
    
    try {
      setSelectingContractor(quoteId)
      console.log('📤 API 요청 시작...')
      
      const response = await fetch('/api/select-contractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, contractorId, quoteId })
      })
      
      console.log('📥 API 응답 상태:', response.status, response.statusText)
      
      const responseData = await response.json()
      console.log('📥 API 응답 데이터:', responseData)
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to select contractor')
      }
      
      toast.success('✅ 업체가 선택되었습니다! 선택된 업체에게 축하 이메일이 발송됩니다.')
      
      // 프로젝트 새로고침
      console.log('🔄 프로젝트 데이터 새로고침...')
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await loadProjects(user.id)
        console.log('✅ 데이터 새로고침 완료')
      }
      
    } catch (error: any) {
      console.error('❌ 업체 선택 에러:', error)
      toast.error(`업체 선택에 실패했습니다: ${error.message}`)
    } finally {
      setSelectingContractor(null)
      console.log('🏁 업체 선택 프로세스 종료')
    }
  }

  const handleStartProject = async (projectId: string) => {
    if (!confirm('공사 날짜가 확정되셨나요? 확정되셨으면 이 버튼을 눌러주세요.')) return
    
    try {
      console.log('🚀 프로젝트 시작 API 호출...')
      
      const response = await fetch('/api/start-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      
      const result = await response.json()
      console.log('📥 API 응답:', result)
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to start project')
      }
      
      toast.success('🎉 프로젝트가 시작되었습니다! 프로젝트 시작을 축하드립니다!')
      
      // 프로젝트 새로고침
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await loadProjects(user.id)
      }
      
    } catch (error: any) {
      console.error('❌ 프로젝트 시작 에러:', error)
      toast.error(`프로젝트 시작에 실패했습니다: ${error.message}`)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      'pending': { label: '승인 대기중', color: 'bg-yellow-100 text-yellow-800' },
      'approved': { label: '승인됨', color: 'bg-green-100 text-green-800' },
      'site-visit-pending': { label: '현장방문 예정', color: 'bg-blue-100 text-blue-800' },
      'bidding': { label: '입찰 진행중', color: 'bg-orange-100 text-orange-800' },
      'bidding-closed': { label: '입찰 종료', color: 'bg-indigo-100 text-indigo-800' },
      'contractor-selected': { label: '업체선정완료', color: 'bg-purple-100 text-purple-800' },
      'in-progress': { label: '진행중', color: 'bg-blue-100 text-blue-800' },
      'completed': { label: '완료', color: 'bg-gray-500 text-white' },
      'cancelled': { label: '취소', color: 'bg-red-100 text-red-800' }
    }
    
    const badge = badges[status] || badges['pending']
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const spaceTypeLabels: Record<string, string> = {
    'detached_house': 'Detached House',
    'town_house': 'Town House',
    'condo': 'Condo',
    'semi_detached': 'Semi-Detached',
    'commercial': 'Commercial'
  }

  const projectTypeLabels: Record<string, string> = {
    'kitchen': '주방',
    'bathroom': '욕실',
    'basement': '지하실',
    'flooring': '바닥재',
    'painting': '페인팅',
    'full_renovation': '전체 레노베이션',
    'office': '사무실',
    'retail': '상가/매장',
    'restaurant': '카페/식당',
    'education': '학원/교육',
    'hospitality': '숙박/병원',
    'other': '기타'
  }

  // 예산 범위 포맷팅 함수 - 개선된 버전
  const formatBudget = (budget: string): string => {
    // 먼저 정의된 라벨 확인
    const budgetLabels: Record<string, string> = {
      'under_50k': '$50,000 미만',
      '50k_100k': '$50,000 - $100,000',
      'over_100k': '$100,000 이상',
      '100k_200k': '$100,000 - $200,000',
      '200k_500k': '$200,000 - $500,000',
      'over_500k': '$500,000 이상'
    }
    
    // 정확히 일치하는 경우
    if (budgetLabels[budget]) {
      return budgetLabels[budget]
    }
    
    // 공백이나 대소문자 문제로 일치하지 않는 경우를 위한 정규화
    const normalizedBudget = budget.trim().toLowerCase().replace(/\s+/g, '_')
    if (budgetLabels[normalizedBudget]) {
      return budgetLabels[normalizedBudget]
    }
    
    // 패턴 매칭으로 변환 시도
    if (normalizedBudget.includes('under') || normalizedBudget.includes('50k')) {
      if (normalizedBudget.includes('under') || normalizedBudget.match(/^50k?$/)) {
        return '$50,000 미만'
      }
    }
    
    if (normalizedBudget.includes('50') && normalizedBudget.includes('100')) {
      return '$50,000 - $100,000'
    }
    
    if (normalizedBudget.includes('100') && normalizedBudget.includes('200')) {
      return '$100,000 - $200,000'
    }
    
    if (normalizedBudget.includes('200') && normalizedBudget.includes('500')) {
      return '$200,000 - $500,000'
    }
    
    if (normalizedBudget.includes('over') || normalizedBudget.includes('above')) {
      if (normalizedBudget.includes('500')) {
        return '$500,000 이상'
      }
      if (normalizedBudget.includes('100')) {
        return '$100,000 이상'
      }
    }
    
    // 숫자만 있는 경우 (예: "50000", "100000")
    const numMatch = budget.match(/\d+/)
    if (numMatch) {
      const num = parseInt(numMatch[0])
      if (num < 50000) return '$50,000 미만'
      if (num >= 50000 && num <= 100000) return '$50,000 - $100,000'
      if (num > 100000 && num <= 200000) return '$100,000 - $200,000'
      if (num > 200000 && num <= 500000) return '$200,000 - $500,000'
      if (num > 500000) return '$500,000 이상'
    }
    
    // 변환할 수 없는 경우 원본 반환
    return budget
  }

  // 시작시기 포맷팅 함수 추가
  const formatTimeline = (timeline: string): string => {
    const timelineLabels: Record<string, string> = {
      'immediately': '즉시 시작',
      'asap': '즉시 시작',
      '1_month': '1개월 내',
      'within_1_month': '1개월 내',
      '3_months': '3개월 내',
      'within_3_months': '3개월 내',
      'planning': '계획단계',
      'planning_stage': '계획단계'
    }
    
    // 정확히 일치하는 경우
    if (timelineLabels[timeline]) {
      return timelineLabels[timeline]
    }
    
    // 공백이나 대소문자 문제로 일치하지 않는 경우를 위한 정규화
    const normalizedTimeline = timeline.trim().toLowerCase().replace(/\s+/g, '_')
    if (timelineLabels[normalizedTimeline]) {
      return timelineLabels[normalizedTimeline]
    }
    
    // 패턴 매칭으로 변환 시도
    if (normalizedTimeline.includes('immediately') || normalizedTimeline.includes('asap') || normalizedTimeline.includes('즉시')) {
      return '즉시 시작'
    }
    
    if (normalizedTimeline.includes('1') && (normalizedTimeline.includes('month') || normalizedTimeline.includes('개월'))) {
      return '1개월 내'
    }
    
    if (normalizedTimeline.includes('3') && (normalizedTimeline.includes('month') || normalizedTimeline.includes('개월'))) {
      return '3개월 내'
    }
    
    if (normalizedTimeline.includes('planning') || normalizedTimeline.includes('계획')) {
      return '계획단계'
    }
    
    // 변환할 수 없는 경우 원본 반환
    return timeline
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
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] to-[#f0ebe0]">
      {/* 헤더 */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-[#daa520]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-[#2c5f4e] transition-colors mr-6"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="font-light">홈으로</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#c4a05a] to-[#daa520] rounded-full flex items-center justify-center shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-serif font-light text-[#2c5f4e]">My Quotes</h1>
                  <p className="text-sm text-gray-500 font-light">내 견적 관리</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <p className="text-gray-600 text-lg font-light leading-relaxed">
            견적요청 내역과 받은 견적서를 비교해보세요.
          </p>
        </div>
        
        {projects.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-[#daa520]/20 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-[#c4a05a] to-[#daa520] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-serif font-light text-[#2c5f4e] mb-4">No Quotes Yet</h3>
              <p className="text-gray-600 text-lg mb-8 font-light">
                아직 제출한 견적요청서가 없습니다
              </p>
              <button
                onClick={() => router.push('/quote-request')}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#c4a05a] to-[#daa520] text-white rounded-full hover:from-[#b8944e] hover:to-[#c89510] transition-all duration-300 shadow-lg hover:shadow-xl font-medium text-base"
              >
                견적 요청하기
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => {
              const quotes = selectedProjectQuotes[project.id] || []
              const isExpanded = expandedProject === project.id
              // ✅ 수정: bidding 상태일 때만 버튼 표시 (quote-submitted 제거)
              const canSelectContractor = project.status === 'bidding' && !project.selected_contractor_id
              const canStartProject = (project.status === 'bidding-closed' || project.status === 'contractor-selected') && project.selected_contractor_id

              console.log('🔍 프로젝트 렌더링:', {
                projectId: project.id,
                status: project.status,
                canSelectContractor,
                canStartProject,
                hasSelectedContractor: !!project.selected_contractor_id,
                quotesCount: quotes.length
              })

              return (
                <div key={project.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-[#daa520]/20 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="p-8">
                    {/* 프로젝트 헤더 */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(project.status)}
                          <span className="text-sm text-gray-500">
                            {new Date(project.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {spaceTypeLabels[project.space_type] || project.space_type}
                        </h3>
                      </div>
                    </div>

                    {/* 프로젝트 정보 */}
                    <div className="space-y-3 text-sm mb-6">
                      <div className="flex items-center text-gray-700 font-light">
                        <MapPin className="w-5 h-5 mr-3 text-[#daa520] flex-shrink-0" />
                        <span>{project.full_address}</span>
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium">
                          프로젝트: {project.project_types?.map(type => projectTypeLabels[type] || type).join(', ')}
                        </p>
                        <p className="text-gray-700">
                          예산: {formatBudget(project.budget)}
                        </p>
                        <p className="text-gray-700">
                          시작시기: {formatTimeline(project.timeline)}
                        </p>
                      </div>
                      {project.description && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500 mb-1">요구사항:</p>
                          <p className="text-sm text-gray-700">{project.description}</p>
                        </div>
                      )}
                    </div>

                    {/* 견적서 목록 (입찰 중이거나 종료된 경우) */}
                    {quotes.length > 0 && (
                      <div className="mt-6 border-t pt-6">
                        <button
                          onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                          className="flex items-center justify-between w-full mb-4 text-left"
                        >
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Award className="w-5 h-5 text-purple-500" />
                            받은 견적서 ({quotes.length}개)
                          </h4>
                          <Eye className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isExpanded && (
                          <div className="space-y-4">
                            {quotes.map((quote) => {
                              const isSelected = project.selected_quote_id === quote.id
                              const isSelecting = selectingContractor === quote.id
                              
                              console.log('🎯 견적서 렌더링:', {
                                quoteId: quote.id,
                                contractorId: quote.contractor_id,
                                contractor: quote.contractor?.company_name,
                                isSelected,
                                isSelecting,
                                canSelect: canSelectContractor,
                                hasPDF: !!quote.pdf_url,
                                selectingContractor
                              })
                              
                              return (
                                <div
                                  key={quote.id}
                                  className={`border rounded-lg p-5 transition-all ${
                                    isSelected
                                      ? 'border-green-500 bg-green-50 shadow-md'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                      {/* 업체명 */}
                                      <h5 className="font-bold text-gray-900 text-lg mb-1">
                                        {quote.contractor?.company_name || '업체명 없음'}
                                      </h5>
                                      {quote.contractor?.contact_name && (
                                        <p className="text-sm text-gray-600 mb-3">
                                          담당자: {quote.contractor.contact_name}
                                        </p>
                                      )}
                                      
                                      {/* 견적 금액 */}
                                      <p className="text-3xl font-bold text-blue-600 mb-3">
                                        ${quote.price.toLocaleString()} <span className="text-lg font-medium text-gray-500">CAD</span>
                                      </p>
                                      
                                      {/* 작업 내용 */}
                                      {quote.description && (
                                        <div className="mb-3">
                                          <p className="text-xs text-gray-500 mb-1">상세 작업 내용:</p>
                                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.description}</p>
                                        </div>
                                      )}
                                      
                                      {/* PDF 다운로드 버튼 */}
                                      {quote.pdf_url ? (
                                        <button
                                          onClick={() => handleDownloadPDF(quote)}
                                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                                        >
                                          <Download className="w-4 h-4" />
                                          견적서 다운로드
                                        </button>
                                      ) : (
                                        <p className="text-sm text-gray-500 italic">견적서 파일이 없습니다</p>
                                      )}
                                    </div>
                                    
                                    {/* 선택 상태 or 선택 버튼 */}
                                    <div className="flex-shrink-0">
                                      {isSelected ? (
                                        <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold">
                                          <CheckCircle className="w-5 h-5" />
                                          선택됨
                                        </div>
                                      ) : canSelectContractor ? (
                                        <button
                                          onClick={() => {
                                            console.log('🎯 업체 선택하기 버튼 클릭됨!', {
                                              projectId: project.id,
                                              contractorId: quote.contractor_id,
                                              quoteId: quote.id
                                            })
                                            handleSelectContractor(project.id, quote.contractor_id, quote.id)
                                          }}
                                          disabled={selectingContractor !== null}
                                          className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                                            selectingContractor !== null
                                              ? 'bg-gray-400 cursor-not-allowed'
                                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                                          }`}
                                        >
                                          {isSelecting ? (
                                            <>
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                              처리 중...
                                            </>
                                          ) : (
                                            '업체 선택하기'
                                          )}
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 프로젝트 시작 버튼 */}
                    {canStartProject && (
                      <div className="mt-8 border-t border-[#daa520]/20 pt-8 bg-gradient-to-br from-[#f5f1e8] to-[#f0ebe0] -m-8 p-8 rounded-b-2xl">
                        <div className="text-center mb-8">
                          <h3 className="text-2xl font-serif font-light text-[#2c5f4e] mb-3">프로젝트를 시작해주세요!</h3>
                          <p className="text-sm text-gray-700 mb-4 flex items-center justify-center gap-2 font-light">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            업체와 연락하여 공사 일정을 확정하세요
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mb-6 text-center font-light">
                          준비가 완료되고 프로젝트를 시작하실 때 시작버튼을 눌러주세요.
                        </p>
                        <button
                          onClick={() => handleStartProject(project.id)}
                          className="w-full bg-gradient-to-r from-[#c4a05a] to-[#daa520] hover:from-[#b8944e] hover:to-[#c89510] text-white px-6 py-4 rounded-full font-medium text-base flex items-center justify-center gap-3 shadow-lg transform transition-all hover:scale-105"
                        >
                          <Play className="w-5 h-5" />
                          프로젝트 시작
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
