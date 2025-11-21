'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Calendar, MapPin, DollarSign, Clock, Award, Play, Eye, CheckCircle, Download, Loader2, Edit, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { StatusBadge } from '@/components/ui'

interface Project {
  id: string
  space_type: string
  project_types: string[]
  budget: string
  timeline: string
  full_address: string
  postal_code: string
  description: string
  phone: string
  visit_date?: string
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

interface EditFormData {
  space_type: string
  project_types: string[]
  budget: string
  timeline: string
  postal_code: string
  full_address: string
  visit_date: string
  description: string
  phone: string
}

const spaceTypes = [
  { value: 'detached_house', label: 'Detached House' },
  { value: 'town_house', label: 'Town House' },
  { value: 'condo', label: 'Condo & Apartment' },
  { value: 'commercial', label: 'Commercial' }
]

const residentialProjectTypes = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'basement', label: 'Basement' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'painting', label: 'Painting' },
  { value: 'full_renovation', label: 'Full Renovation' },
  { value: 'other', label: 'Other' }
]

const commercialProjectTypes = [
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'education', label: 'Education' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'other', label: 'Other' }
]

const budgetRanges = [
  { value: 'under_50k', label: 'Under $50,000' },
  { value: '50k_100k', label: '$50,000 - $100,000' },
  { value: 'over_100k', label: '$100,000+' }
]

const timelines = [
  { value: 'immediate', label: 'Immediate' },
  { value: '1_month', label: 'Within 1 month' },
  { value: '3_months', label: 'Within 3 months' },
  { value: 'planning', label: 'Planning stage' }
]

export default function CustomerDashboard() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectQuotes, setSelectedProjectQuotes] = useState<Record<string, Quote[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [selectingContractor, setSelectingContractor] = useState<string | null>(null)
  
  // 수정 관련 상태
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const phoneInputRef = useRef<HTMLInputElement>(null)

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
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
      
      if (projectsError) throw projectsError
      
      setProjects(projectsData || [])
      
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
      
      setSelectedProjectQuotes(prev => ({
        ...prev,
        [projectId]: quotesData || []
      }))
      
    } catch (error) {
      console.error('Failed to load quotes:', error)
    }
  }

  const handleDownloadPDF = async (quote: Quote) => {
    if (!quote.pdf_url) {
      toast.error('PDF 파일 정보가 없습니다')
      return
    }

    try {
      const supabase = createBrowserClient()
      const { data: publicUrlData } = supabase.storage
        .from('contractor-quotes')
        .getPublicUrl(quote.pdf_url)

      if (publicUrlData?.publicUrl) {
        window.open(publicUrlData.publicUrl, '_blank')
        toast.success('PDF 파일을 여는 중...')
      }
    } catch (error) {
      console.error('PDF download error:', error)
      toast.error('PDF 다운로드에 실패했습니다')
    }
  }

  const handleSelectContractor = async (projectId: string, contractorId: string, quoteId: string) => {
    if (selectingContractor) {
      toast.error('처리 중입니다. 잠시만 기다려주세요.')
      return
    }
    
    if (!confirm('이 업체를 선택하시겠습니까?')) return
    
    try {
      setSelectingContractor(quoteId)
      
      const response = await fetch('/api/select-contractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, contractorId, quoteId })
      })
      
      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to select contractor')
      }
      
      toast.success('✅ 업체가 선택되었습니다!')
      
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await loadProjects(user.id)
      
    } catch (error: any) {
      toast.error(`업체 선택에 실패했습니다: ${error.message}`)
    } finally {
      setSelectingContractor(null)
    }
  }

  const handleStartProject = async (projectId: string) => {
    if (!confirm('공사 날짜가 확정되셨나요? 확정되셨으면 이 버튼을 눌러주세요.')) return
    
    try {
      const response = await fetch('/api/start-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to start project')
      }
      
      toast.success('🎉 프로젝트가 시작되었습니다!')
      
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await loadProjects(user.id)
      
    } catch (error: any) {
      toast.error(`프로젝트 시작에 실패했습니다: ${error.message}`)
    }
  }

  // 수정 모달 열기
  const handleEditClick = (project: Project) => {
    setEditingProject(project)
    setEditFormData({
      space_type: project.space_type,
      project_types: project.project_types,
      budget: project.budget,
      timeline: project.timeline,
      postal_code: project.postal_code,
      full_address: project.full_address,
      visit_date: project.visit_date || '',
      description: project.description,
      phone: project.phone
    })
  }

  // 수정 모달 닫기
  const handleCancelEdit = () => {
    setEditingProject(null)
    setEditFormData(null)
  }

  // 수정 제출
  const handleSubmitEdit = async () => {
    if (!editingProject || !editFormData) return

    // 유효성 검사
    if (!editFormData.space_type) {
      toast.error('부동산 유형을 선택해주세요')
      return
    }
    if (editFormData.project_types.length === 0) {
      toast.error('프로젝트 유형을 하나 이상 선택해주세요')
      return
    }
    if (!editFormData.budget) {
      toast.error('예산 범위를 선택해주세요')
      return
    }
    if (!editFormData.timeline) {
      toast.error('시작 시기를 선택해주세요')
      return
    }
    if (!editFormData.postal_code || !editFormData.full_address) {
      toast.error('우편번호와 전체 주소를 입력해주세요')
      return
    }
    if (!editFormData.description) {
      toast.error('프로젝트 설명을 입력해주세요')
      return
    }
    if (!editFormData.phone) {
      toast.error('전화번호를 입력해주세요')
      return
    }

    try {
      setIsSubmittingEdit(true)

      const response = await fetch(`/api/quote-requests/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update quote request')
      }

      toast.success('✅ 견적요청이 수정되었습니다!')
      
      // 프로젝트 목록 새로고침
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await loadProjects(user.id)
      
      handleCancelEdit()
      
    } catch (error: any) {
      console.error('수정 에러:', error)
      toast.error(`수정에 실패했습니다: ${error.message}`)
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const formatPostalCode = (value: string) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    } else {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`
    }
  }

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const limited = cleaned.slice(0, 10)
    
    if (limited.length === 0) {
      return ''
    } else if (limited.length <= 3) {
      return `(${limited})`
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
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
    return <StatusBadge status={status} label={badge.label} size="sm" />
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

  const formatBudget = (budget: string): string => {
    const budgetLabels: Record<string, string> = {
      'under_50k': '$50,000 미만',
      '50k_100k': '$50,000 - $100,000',
      'over_100k': '$100,000 이상'
    }
    return budgetLabels[budget] || budget
  }

  const formatTimeline = (timeline: string): string => {
    const timelineLabels: Record<string, string> = {
      'immediate': '즉시 시작',
      '1_month': '1개월 내',
      '3_months': '3개월 내',
      'planning': '계획단계'
    }
    return timelineLabels[timeline] || timeline
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
              const canSelectContractor = project.status === 'bidding' && !project.selected_contractor_id
              const canStartProject = (project.status === 'bidding-closed' || project.status === 'contractor-selected') && project.selected_contractor_id
              const canEdit = project.status === 'pending'

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
                          {canEdit && (
                            <button
                              onClick={() => handleEditClick(project)}
                              className="ml-2 flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                            >
                              <Edit className="w-3 h-3" />
                              수정
                            </button>
                          )}
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

                    {/* 견적서 목록 */}
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
                              
                              return (
                                <div
                                  key={quote.id}
                                  className={`border rounded-lg p-5 transition-all ${
                                    isSelected
                                      ? 'border-green-500 bg-green-50 shadow-md'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex flex-col gap-4">
                                    {/* 업체 정보 */}
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-bold text-gray-900 text-lg mb-1">
                                        {quote.contractor?.company_name || '업체명 없음'}
                                      </h5>
                                      {quote.contractor?.contact_name && (
                                        <p className="text-sm text-gray-600 mb-3">
                                          담당자: {quote.contractor.contact_name}
                                        </p>
                                      )}
                                      
                                      <p className="text-3xl font-bold text-blue-600 mb-3">
                                        ${quote.price.toLocaleString()} <span className="text-lg font-medium text-gray-500">CAD</span>
                                      </p>
                                      
                                      {quote.description && (
                                        <div className="mb-4">
                                          <p className="text-xs text-gray-500 mb-1">상세 작업 내용:</p>
                                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.description}</p>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* 버튼 영역 - 모바일에서 수직 정렬 */}
                                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                                      {quote.pdf_url && (
                                        <button
                                          onClick={() => handleDownloadPDF(quote)}
                                          className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-semibold w-full sm:flex-1"
                                        >
                                          <Download className="w-4 h-4" />
                                          View Quote
                                        </button>
                                      )}
                                      
                                      {isSelected ? (
                                        <div className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-3 rounded-lg font-semibold w-full sm:flex-1">
                                          <CheckCircle className="w-5 h-5" />
                                          선택됨
                                        </div>
                                      ) : canSelectContractor ? (
                                        <button
                                          onClick={() => handleSelectContractor(project.id, quote.contractor_id, quote.id)}
                                          disabled={selectingContractor !== null}
                                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold whitespace-nowrap transition-all w-full sm:flex-1 ${
                                            selectingContractor !== null
                                              ? 'bg-gray-400 cursor-not-allowed text-white'
                                              : 'bg-green-600 hover:bg-green-700 text-white'
                                          }`}
                                        >
                                          {isSelecting ? (
                                            <>
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                              처리 중...
                                            </>
                                          ) : (
                                            'Select'
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

      {/* Account Settings - Delete Account Section (moved outside conditional) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mt-12 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-red-200 overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-serif font-light text-red-600 mb-2 flex items-center gap-2">
              <X className="w-6 h-6" />
              Danger Zone
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Once you delete your account, there is no going back. Please be certain.
            </p>

            <button
              onClick={async () => {
                const password = prompt('Enter your password to confirm account deletion:')
                if (!password) return

                if (
                  !confirm(
                    'Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted.'
                  )
                )
                  return

                try {
                  const response = await fetch('/api/delete-account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password }),
                  })

                  const data = await response.json()

                  if (data.success) {
                    alert('Your account has been successfully deleted.')
                    window.location.href = '/'
                  } else {
                    alert(data.error || 'Failed to delete account. Please try again.')
                  }
                } catch (err: any) {
                  alert('An error occurred: ' + err.message)
                }
              }}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {/* 수정 모달 */}
      {editingProject && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">견적요청 수정</h2>
                  <p className="text-sm opacity-90">관리자 승인 전까지만 수정 가능합니다</p>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto space-y-6">
              {/* Space Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">부동산 유형 *</label>
                <div className="grid grid-cols-2 gap-3">
                  {spaceTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, space_type: type.value, project_types: [] })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        editFormData.space_type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">프로젝트 유형 *</label>
                <div className="grid grid-cols-2 gap-3">
                  {(editFormData.space_type === 'commercial' ? commercialProjectTypes : residentialProjectTypes).map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        const types = editFormData.project_types
                        if (types.includes(type.value)) {
                          setEditFormData({ ...editFormData, project_types: types.filter(t => t !== type.value) })
                        } else {
                          setEditFormData({ ...editFormData, project_types: [...types, type.value] })
                        }
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        editFormData.project_types.includes(type.value)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">예산 범위 *</label>
                <div className="grid grid-cols-1 gap-3">
                  {budgetRanges.map((budget) => (
                    <button
                      key={budget.value}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, budget: budget.value })}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${
                        editFormData.budget === budget.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {budget.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시작 시기 *</label>
                <div className="grid grid-cols-2 gap-3">
                  {timelines.map((timeline) => (
                    <button
                      key={timeline.value}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, timeline: timeline.value })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        editFormData.timeline === timeline.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {timeline.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">우편번호 *</label>
                  <input
                    type="text"
                    value={editFormData.postal_code}
                    onChange={(e) => setEditFormData({ ...editFormData, postal_code: formatPostalCode(e.target.value) })}
                    maxLength={7}
                    placeholder="A0A 0A0"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">방문 희망일</label>
                  <input
                    type="date"
                    value={editFormData.visit_date}
                    onChange={(e) => setEditFormData({ ...editFormData, visit_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">전체 주소 *</label>
                <input
                  type="text"
                  value={editFormData.full_address}
                  onChange={(e) => setEditFormData({ ...editFormData, full_address: e.target.value })}
                  placeholder="123 Main Street, Toronto, ON"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">프로젝트 설명 *</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={4}
                  placeholder="프로젝트에 대한 자세한 설명을 입력하세요..."
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">전화번호 *</label>
                <input
                  ref={phoneInputRef}
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: formatPhoneNumber(e.target.value) })}
                  placeholder="(416) 555-0100"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={isSubmittingEdit}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSubmitEdit}
                disabled={isSubmittingEdit}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  isSubmittingEdit
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmittingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '저장하기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
