'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Calendar, MapPin, DollarSign, Clock, Award, Play, Eye, CheckCircle } from 'lucide-react'
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
  created_at: string
  status: string
  contractor?: {
    company_name: string
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
        p => p.status === 'bidding' || p.status === 'bidding-closed' || p.status === 'quote-submitted'
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

  const handleSelectContractor = async (projectId: string, contractorId: string, quoteId: string) => {
    if (!confirm('이 업체를 선택하시겠습니까?')) return
    
    try {
      const response = await fetch('/api/select-contractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, contractorId, quoteId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to select contractor')
      }
      
      toast.success('업체가 선택되었습니다! 선택된 업체에게 축하 이메일이 발송됩니다.')
      
      // 프로젝트 새로고침
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await loadProjects(user.id)
      }
      
    } catch (error) {
      console.error('Error selecting contractor:', error)
      toast.error('업체 선택에 실패했습니다')
    }
  }

  const handleStartProject = async (projectId: string) => {
    if (!confirm('프로젝트를 시작하시겠습니까? 프로젝트가 완료 상태로 변경됩니다.')) return
    
    try {
      const supabase = createBrowserClient()
      
      const { error } = await supabase
        .from('quote_requests')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
      
      if (error) throw error
      
      toast.success('프로젝트가 시작되었습니다!')
      
      // 프로젝트 새로고침
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await loadProjects(user.id)
      }
      
    } catch (error) {
      console.error('Error starting project:', error)
      toast.error('프로젝트 시작에 실패했습니다')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      'pending': { label: '승인 대기중', color: 'bg-yellow-100 text-yellow-800' },
      'approved': { label: '승인됨', color: 'bg-green-100 text-green-800' },
      'site-visit-pending': { label: '현장방문 예정', color: 'bg-blue-100 text-blue-800' },
      'bidding': { label: '입찰 진행중', color: 'bg-orange-100 text-orange-800' },
      'bidding-closed': { label: '입찰 종료', color: 'bg-indigo-100 text-indigo-800' },
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
              <h1 className="text-xl font-bold text-gray-900">내 프로젝트</h1>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              const canStartProject = project.status === 'bidding-closed' && project.selected_contractor_id

              return (
                <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    {/* 프로젝트 헤더 */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {spaceTypeLabels[project.space_type] || project.space_type}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {project.project_types?.map(type => projectTypeLabels[type] || type).join(', ')}
                        </p>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>

                    {/* 프로젝트 정보 */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {project.full_address}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        예산: {project.budget}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {project.timeline}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(project.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>

                    {/* 견적서 목록 (입찰 중이거나 종료된 경우) */}
                    {quotes.length > 0 && (
                      <div className="mt-6 border-t pt-6">
                        <button
                          onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                          className="flex items-center justify-between w-full mb-4"
                        >
                          <h4 className="text-lg font-semibold text-gray-900">
                            제출된 견적서 ({quotes.length}개)
                          </h4>
                          <Eye className="w-5 h-5 text-gray-400" />
                        </button>

                        {isExpanded && (
                          <div className="space-y-4">
                            {quotes.map((quote) => (
                              <div
                                key={quote.id}
                                className={`border rounded-lg p-4 ${
                                  project.selected_quote_id === quote.id
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                                      <Award className="w-5 h-5 text-blue-500" />
                                      {quote.contractor?.company_name || '업체명 없음'}
                                    </h5>
                                    <p className="text-2xl font-bold text-blue-600 mt-2">
                                      ${quote.price.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-2">{quote.description}</p>
                                    {quote.pdf_url && (
                                      <a
                                        href={quote.pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                                      >
                                        견적서 PDF 보기 →
                                      </a>
                                    )}
                                  </div>
                                  
                                  {project.selected_quote_id === quote.id ? (
                                    <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg">
                                      <CheckCircle className="w-5 h-5" />
                                      선택됨
                                    </div>
                                  ) : canSelectContractor ? (
                                    <button
                                      onClick={() => handleSelectContractor(project.id, quote.contractor_id, quote.id)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                                    >
                                      이 업체 선택
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 프로젝트 시작 버튼 */}
                    {canStartProject && (
                      <div className="mt-6 border-t pt-6 bg-blue-50 -m-6 p-6 rounded-b-lg">
                        <p className="text-sm text-blue-800 mb-4">
                          업체를 선택하셨습니다. 프로젝트를 시작하시겠습니까?
                        </p>
                        <button
                          onClick={() => handleStartProject(project.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
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
