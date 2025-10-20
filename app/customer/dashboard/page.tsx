'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Calendar, MapPin, DollarSign, Clock, Award, Play, Eye, CheckCircle, Download } from 'lucide-react'
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

  useEffect(() => {
    checkAuthAndLoadProjects()
  }, [])

  const checkAuthAndLoadProjects = async () => {
    try {
      const supabase = createBrowserClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/login')
        return
      }

      await loadProjects(user.id)
    } catch (error) {
      console.error('Error:', error)
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
        p => p.status === 'bidding' || p.status === 'bidding-closed' || p.status === 'contractor-selected' || p.status === 'quote-submitted'
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
    
    if (!confirm('이 업체를 선택하시겠습니까?')) {
      console.log('❌ 사용자가 취소했습니다')
      return
    }
    
    try {
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
    'full_renovation': '전체 리노베이션'
  }

  const budgetLabels: Record<string, string> = {
    'under_50k': '$50,000 미만',
    '50k_100k': '$50,000 - $100,000',
    'over_100k': '$100,000 이상',
    '100k_200k': '$100,000 - $200,000',
    '200k_500k': '$200,000 - $500,000',
    'over_500k': '$500,000 이상'
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
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                홈으로
              </button>
              <h1 className="text-xl font-bold text-gray-900">내 견적</h1>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600 mb-6">견적요청 내역과 받은 견적서를 비교해보세요.</p>
        
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">아직 제출한 견적요청서가 없습니다</p>
            <button
              onClick={() => router.push('/quote-request')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              견적 요청하기
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => {
              const quotes = selectedProjectQuotes[project.id] || []
              const isExpanded = expandedProject === project.id
              const canSelectContractor = (project.status === 'bidding' || project.status === 'bidding-closed') && !project.selected_contractor_id
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
                <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
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
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        {project.full_address}
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium">
                          프로젝트: {project.project_types?.map(type => projectTypeLabels[type] || type).join(', ')}
                        </p>
                        <p className="text-gray-700">
                          예산: {budgetLabels[project.budget] || project.budget}
                        </p>
                        <p className="text-gray-700">
                          원하는 완료일: {project.timeline}
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
                              console.log('🎯 견적서 렌더링:', {
                                quoteId: quote.id,
                                contractorId: quote.contractor_id,
                                contractor: quote.contractor?.company_name,
                                isSelected,
                                canSelect: canSelectContractor,
                                hasPDF: !!quote.pdf_url
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
                                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold whitespace-nowrap"
                                        >
                                          업체 선택하기
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
                      <div className="mt-6 border-t pt-6 bg-gradient-to-br from-blue-50 to-purple-50 -m-6 p-6 rounded-b-lg">
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">프로젝트를 시작해주세요!</h3>
                          <p className="text-sm text-gray-700 mb-4 flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            업체와 연락하여 공사 일정을 확정하세요
                          </p>
                        </div>
                        <p className="text-sm text-blue-800 mb-4 text-center">
                          준비가 완료되고 프로젝트를 시작하실 때 시작버튼을 눌러주세요.
                        </p>
                        <button
                          onClick={() => handleStartProject(project.id)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 shadow-lg transform transition-all hover:scale-105"
                        >
                          <Play className="w-6 h-6" />
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
