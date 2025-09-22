'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, RefreshCw, Eye, CheckCircle, XCircle, Calendar, MapPin } from 'lucide-react'
import { toast } from 'react-hot-toast'
import PortfolioManager from '@/components/PortfolioManager'
import type { Project, ProjectStatus, ContractorData } from '@/types/contractor'
import { calculateProjectStatus } from '@/lib/contractor/projectHelpers'
import StatusBadge from '@/components/contractor/StatusBadge'
import ProjectFilters from '@/components/contractor/ProjectFilters'
import ProjectCard from '@/components/contractor/ProjectCard'
import QuoteModal from '@/components/contractor/QuoteModal'

interface Props {
  initialContractorData?: any
}

export default function IntegratedContractorDashboard({ initialContractorData }: Props) {
  const router = useRouter()
  
  // 상태 관리
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [contractorData, setContractorData] = useState<ContractorData | null>(initialContractorData)
  const [projectFilter, setProjectFilter] = useState<ProjectStatus | 'all'>('all')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'projects' | 'portfolio'>('projects')
  
  // 프로젝트 데이터 로드 함수
  const loadProjects = useCallback(async () => {
    if (!contractorData) return
    
    try {
      setIsLoading(true)
      const supabase = createBrowserClient()
      
      // 전체 프로젝트와 관련 데이터를 함께 조회
      const { data: projectsData, error: projectsError } = await supabase
        .from('quote_requests')
        .select(`
          *,
          site_visit_applications!site_visit_applications_project_id_fkey (
            id,
            contractor_id,
            status,
            applied_at,
            is_cancelled,
            cancelled_at,
            cancelled_by,
            contractors!site_visit_applications_contractor_id_fkey (
              id,
              company_name,
              contact_name
            )
          ),
          contractor_quotes!contractor_quotes_project_id_fkey (
            id,
            contractor_id,
            price,
            description,
            pdf_url,
            status,
            created_at,
            is_selected
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (projectsError) throw projectsError
      
      console.log('Raw projects data:', projectsData)
      
      // 각 프로젝트에 대해 업체와의 관계 데이터 필터링 및 상태 계산
      const processedProjects: Project[] = (projectsData || []).map(project => {
        // 현재 업체의 현장방문 신청 찾기
        const mySiteVisit = project.site_visit_applications?.find(
          (app: any) => app.contractor_id === contractorData.id && !app.is_cancelled
        )
        
        // 현재 업체의 견적서 찾기
        const myQuote = project.contractor_quotes?.find(
          (quote: any) => quote.contractor_id === contractorData.id
        )
        
        // 선택된 견적이 있는지 확인
        const hasSelectedQuote = project.contractor_quotes?.some(
          (quote: any) => quote.is_selected === true
        )
        
        // 내 견적이 선택되었는지 확인
        const isMyQuoteSelected = myQuote?.is_selected === true
        
        // 프로젝트 상태 결정
        let projectStatus: ProjectStatus = 'pending'
        
        if (project.status === 'cancelled') {
          projectStatus = 'cancelled'
        } else if (project.status === 'completed') {
          projectStatus = 'completed'
        } else if (isMyQuoteSelected) {
          projectStatus = 'selected'
        } else if (hasSelectedQuote && !isMyQuoteSelected) {
          projectStatus = 'not-selected'
        } else if (myQuote) {
          projectStatus = 'quoted'
        } else if (mySiteVisit && mySiteVisit.status === 'completed') {
          projectStatus = 'site-visit-completed'
        } else if (mySiteVisit) {
          projectStatus = 'site-visit-applied'
        } else if (project.status === 'approved') {
          projectStatus = 'approved'
        }
        
        console.log(`Project ${project.id} status:`, {
          projectStatus,
          isMyQuoteSelected,
          hasSelectedQuote,
          myQuote,
          mySiteVisit
        })
        
        return {
          ...project,
          site_visit_application: mySiteVisit,
          contractor_quote: myQuote,
          projectStatus
        }
      })
      
      setProjects(processedProjects)
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError('프로젝트를 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [contractorData])
  
  // 초기 데이터 로드
  useEffect(() => {
    if (contractorData) {
      loadProjects()
    }
  }, [contractorData, loadProjects])
  
  const refreshData = async () => {
    setIsRefreshing(true)
    await loadProjects()
    setIsRefreshing(false)
    toast.success('데이터를 새로고침했습니다')
  }
  
  // 필터링된 프로젝트
  const filteredProjects = useMemo(() => {
    if (projectFilter === 'all') return projects
    return projects.filter(p => p.projectStatus === projectFilter)
  }, [projects, projectFilter])
  
  // 상태별 카운트
  const statusCounts = useMemo(() => {
    const counts: Record<ProjectStatus | 'all', number> = {
      'all': projects.length,
      'pending': 0,
      'approved': 0,
      'site-visit-applied': 0,
      'site-visit-completed': 0,
      'quoted': 0,
      'selected': 0,
      'not-selected': 0,
      'completed': 0,
      'cancelled': 0
    }
    
    projects.forEach(p => {
      if (p.projectStatus) {
        counts[p.projectStatus]++
      }
    })
    
    return counts
  }, [projects])
  
  if (isLoading && !projects.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }
  
  // 프로젝트 카드를 렌더링하는 간단한 컴포넌트
  const SimpleProjectCard = ({ project }: { project: Project }) => {
    const getStatusBadge = () => {
      const statusConfig: Record<ProjectStatus, { label: string; color: string }> = {
        'pending': { label: '대기중', color: 'bg-gray-100 text-gray-700' },
        'approved': { label: '승인됨', color: 'bg-green-100 text-green-700' },
        'site-visit-applied': { label: '현장방문 신청', color: 'bg-blue-100 text-blue-700' },
        'site-visit-completed': { label: '현장방문 완료', color: 'bg-indigo-100 text-indigo-700' },
        'quoted': { label: '견적서 제출', color: 'bg-purple-100 text-purple-700' },
        'selected': { label: '✅ 선택됨', color: 'bg-green-500 text-white font-bold' },
        'not-selected': { label: '❌ 미선택', color: 'bg-red-100 text-red-700' },
        'completed': { label: '완료', color: 'bg-gray-500 text-white' },
        'cancelled': { label: '취소됨', color: 'bg-gray-300 text-gray-600' }
      }
      
      const config = statusConfig[project.projectStatus || 'pending']
      return (
        <span className={`px-3 py-1 rounded-full text-xs ${config.color}`}>
          {config.label}
        </span>
      )
    }
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {project.project_type === 'full' ? 'Town House' : 'Detached House'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              예산: ${project.budget?.toLocaleString() || '미정'}
            </p>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            방문일: {project.preferred_date || '미정'}
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {project.address || '주소 미입력'}
          </div>
          
          {project.contractor_quote && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm font-medium">
                제출 견적: ${project.contractor_quote.price?.toLocaleString()}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex gap-2">
          {project.projectStatus === 'selected' && (
            <button className="px-4 py-2 bg-green-500 text-white rounded text-sm font-medium">
              고객이 선택함 ✅
            </button>
          )}
          {project.projectStatus === 'not-selected' && (
            <button className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm">
              다른 업체 선택됨
            </button>
          )}
          <button 
            onClick={() => console.log('View details:', project)}
            className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            상세보기
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
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                홈으로
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {contractorData?.company_name || '업체 대시보드'}
              </h1>
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                프로젝트 관리
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'portfolio'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                포트폴리오 관리
              </button>
            </nav>
          </div>
        </div>
        
        {/* 프로젝트 탭 */}
        {activeTab === 'projects' && (
          <>
            <ProjectFilters
              currentFilter={projectFilter}
              onFilterChange={setProjectFilter}
              statusCounts={statusCounts}
            />
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  프로젝트 목록 ({filteredProjects.length}개)
                </h3>
              </div>
              
              {filteredProjects.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  해당하는 프로젝트가 없습니다.
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {filteredProjects.map((project) => (
                      <SimpleProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* 포트폴리오 탭 */}
        {activeTab === 'portfolio' && contractorData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <PortfolioManager 
                contractorId={contractorData.id}
                onPortfolioUpdate={() => console.log('Portfolio updated')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
