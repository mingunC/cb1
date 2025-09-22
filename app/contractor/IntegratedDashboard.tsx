'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, RefreshCw, Eye, CheckCircle, XCircle, Calendar, MapPin } from 'lucide-react'
import { toast } from 'react-hot-toast'
import PortfolioManager from '@/components/PortfolioManager'
import type { Project, ProjectStatus, ContractorData, CustomerInfo } from '@/types/contractor'
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
  
  // 프로젝트 데이터 로드 함수 - 간단한 쿼리로 시작
  const loadProjects = useCallback(async () => {
    if (!contractorData) return
    
    try {
      setIsLoading(true)
      const supabase = createBrowserClient()
      
      // 먼저 프로젝트만 가져오기 (customer 조인 제거)
      const { data: projectsData, error: projectsError } = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (projectsError) throw projectsError
      
      console.log('Projects data:', projectsData?.[0]) // 첫 번째 프로젝트 데이터 구조 확인
      
      // 각 프로젝트에 대해 관련 데이터 조회
      const processedProjects = await Promise.all(
        (projectsData || []).map(async (project) => {
          // 현장방문 신청 조회
          const { data: siteVisits } = await supabase
            .from('site_visit_applications')
            .select('*')
            .eq('project_id', project.id)
            .eq('contractor_id', contractorData.id)
          
          // 견적서 조회
          const { data: quotes } = await supabase
            .from('contractor_quotes')
            .select('*')
            .eq('project_id', project.id)
            .eq('contractor_id', contractorData.id)
          
          const mySiteVisit = siteVisits?.find((app: any) => !app.is_cancelled)
          const myQuote = quotes?.[0]
          
          // 프로젝트 상태 결정
          let projectStatus: ProjectStatus = 'pending'
          
          const isMyQuoteSelected = project.selected_contractor_id === contractorData.id
          const hasSelectedContractor = !!project.selected_contractor_id
          
          if (project.status === 'cancelled') {
            projectStatus = 'cancelled'
          } else if (project.status === 'completed') {
            projectStatus = 'completed'
          } else if (isMyQuoteSelected) {
            projectStatus = 'selected'
          } else if (hasSelectedContractor && !isMyQuoteSelected) {
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
          
          return {
            ...project,
            site_visit_application: mySiteVisit,
            contractor_quote: myQuote,
            projectStatus
          }
        })
      )
      
      setProjects(processedProjects)
    } catch (err: any) {
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
  
  // 심플하고 모던한 프로젝트 카드 컴포넌트
  const SimpleModernCard = ({ project }: { project: Project }) => {
    const getStatusBadge = () => {
      const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
        'pending': { label: '대기중', className: 'bg-gray-100 text-gray-700' },
        'approved': { label: '승인됨', className: 'bg-blue-100 text-blue-700' },
        'site-visit-applied': { label: '현장방문 신청', className: 'bg-blue-100 text-blue-700' },
        'site-visit-completed': { label: '현장방문 완료', className: 'bg-blue-100 text-blue-700' },
        'quoted': { label: '견적 제출', className: 'bg-blue-100 text-blue-700' },
        'selected': { label: '선택됨', className: 'bg-green-100 text-green-700' },
        'not-selected': { label: '미선택', className: 'bg-gray-100 text-gray-700' },
        'completed': { label: '완료', className: 'bg-gray-500 text-white' },
        'cancelled': { label: '취소됨', className: 'bg-gray-100 text-gray-700' }
      }
      
      const config = statusConfig[project.projectStatus || 'pending']
      return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
          {config.label}
        </span>
      )
    }
    
    // 프로젝트 타입 표시
    const getProjectTypeLabel = () => {
      const typeMap: Record<string, string> = {
        'full': '전체 리노베이션',
        'partial': '부분 리노베이션', 
        'kitchen': '주방',
        'bathroom': '욕실',
        'basement': '지하실',
        'other': '기타'
      }
      return typeMap[project.project_type || 'other'] || '전체 리노베이션'
    }
    
    // 공간 타입 표시
    const getSpaceTypeLabel = () => {
      const spaceMap: Record<string, string> = {
        'detached': 'Detached House',
        'town_house': 'Town House', 
        'condo': 'Condo',
        'semi_detached': 'Semi-Detached'
      }
      return spaceMap[project.space_type || 'detached'] || 'Detached House'
    }
    
    // 예산 표시
    const getBudgetLabel = () => {
      const budgetMap: Record<string, string> = {
        'under_50k': '$50,000 미만',
        '50k_100k': '$50,000 - $100,000',
        '100k_200k': '$100,000 - $200,000', 
        '200k_500k': '$200,000 - $500,000',
        'over_500k': '$500,000 이상'
      }
      
      const budget = project.budget
      if (typeof budget === 'number') {
        return `$${budget.toLocaleString()}`
      }
      return budgetMap[budget] || '미정'
    }
    
    // 날짜 포맷
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '미정'
      try {
        const date = new Date(dateStr)
        return date.toLocaleDateString('ko-KR', { 
          year: 'numeric',
          month: 'numeric', 
          day: 'numeric'
        })
      } catch {
        return '즉시 시작'
      }
    }
    
    // 고객 정보 추출 - 임시로 기본값 사용
    const getCustomerInfo = () => {
      // 현재는 고객 정보를 조인하지 않으므로 기본값 사용
      const customerId = project.customer_id || 'unknown'
      const shortId = customerId.slice(0, 8)
      
      return { 
        name: `고객 ${shortId}`, 
        email: '이메일 정보 없음', 
        phone: '' 
      }
    }

    const customerInfo = getCustomerInfo()
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {/* 카드 헤더 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {getSpaceTypeLabel()}
            </h3>
            {getStatusBadge()}
          </div>
          
          {/* 고객 정보 */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {customerInfo.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 mb-1">{customerInfo.name}</div>
                <div className="text-sm text-gray-600 truncate mb-1">{customerInfo.email}</div>
                {customerInfo.phone && (
                  <div className="text-sm text-gray-600">{customerInfo.phone}</div>
                )}
              </div>
            </div>
          </div>
          
          {/* 프로젝트 타입 태그 */}
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              {getProjectTypeLabel()}
            </span>
          </div>
          
          {/* 예산 */}
          <div className="text-lg font-bold text-gray-900">
            예산: {getBudgetLabel()}
          </div>
        </div>
        
        {/* 카드 바디 */}
        <div className="p-6 space-y-4">
          {/* 기본 정보 그리드 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 font-medium block mb-1">일정</span>
              <span className="text-gray-900">
                {formatDate(project.preferred_date)}
              </span>
            </div>
            
            <div>
              <span className="text-gray-500 font-medium block mb-1">등록일</span>
              <span className="text-gray-900">
                {formatDate(project.created_at)}
              </span>
            </div>
          </div>
          
          {/* 주소 */}
          <div>
            <span className="text-gray-500 font-medium text-sm block mb-1">위치</span>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-900 text-sm">
                {project.address || project.city || '주소 미입력'}
              </span>
            </div>
          </div>
          
          {/* 요구사항 */}
          {project.requirements && (
            <div>
              <span className="text-gray-500 font-medium text-sm block mb-2">요구사항:</span>
              <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
                {project.requirements}
              </p>
            </div>
          )}
          
          {/* 견적 정보 */}
          {project.contractor_quote && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">제출 견적:</span>
                <span className="text-lg font-bold text-gray-900">
                  ${project.contractor_quote.price?.toLocaleString()}
                </span>
              </div>
              {project.contractor_quote.status === 'accepted' && (
                <div className="mt-2">
                  <span className="text-sm text-green-600 font-medium">✓ 고객이 선택했습니다</span>
                </div>
              )}
            </div>
          )}
          
          {/* 현장방문 정보 */}
          {project.site_visit_application && (
            <div className="text-sm">
              <span className="text-blue-600 font-medium">
                현장방문 {project.site_visit_application.status === 'completed' ? '완료' : '신청됨'}
              </span>
            </div>
          )}
        </div>
        
        {/* 카드 푸터 - 액션 버튼 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          {/* 상태별 액션 버튼 */}
          {project.projectStatus === 'selected' && (
            <div className="w-full text-center py-3 bg-green-600 text-white rounded-lg font-medium text-sm">
              ✓ 고객이 선택했습니다
            </div>
          )}
          
          {project.projectStatus === 'not-selected' && (
            <div className="w-full text-center py-3 bg-gray-200 text-gray-600 rounded-lg font-medium text-sm">
              다른 업체가 선택됨
            </div>
          )}
          
          {project.projectStatus === 'approved' && !project.site_visit_application && (
            <button 
              onClick={() => console.log('Apply for site visit')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
            >
              현장방문 신청
            </button>
          )}
          
          {project.projectStatus === 'site-visit-completed' && !project.contractor_quote && (
            <button 
              onClick={() => console.log('Submit quote')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
            >
              견적서 작성
            </button>
          )}
          
          {/* 디버그 정보 */}
          {project.selected_contractor_id && (
            <div className="text-xs text-gray-400 mt-3 text-center">
              등록된 견적: {project.contractor_quote ? '✓' : '✗'}
            </div>
          )}
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
                className="flex items-center text-gray-600 hover:text-gray-900 mr-6 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="font-medium">홈으로</span>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {contractorData?.company_name || '업체 대시보드'}
                </h1>
              </div>
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
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
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                프로젝트 관리
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'portfolio'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                      <SimpleModernCard key={project.id} project={project} />
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
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                포트폴리오 관리
              </h3>
            </div>
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
