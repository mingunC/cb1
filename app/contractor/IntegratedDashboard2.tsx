'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, RefreshCw, Eye, CheckCircle, XCircle, Calendar, MapPin, User, Trophy, X } from 'lucide-react'
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
    if (!contractorData || !contractorData.id) {
      console.error('No contractor data available')
      return
    }
    
    try {
      setIsLoading(true)
      const supabase = createBrowserClient()
      
      console.log('Loading projects for contractor:', {
        contractorId: contractorData.id,
        companyName: contractorData.company_name
      })
      
      // 프로젝트 데이터 가져오기
      const { data: projectsData, error: projectsError } = await supabase
        .from('quote_requests')
        .select('*, selected_contractor_id, selected_quote_id')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (projectsError) {
        console.error('Projects fetch error:', projectsError)
        throw projectsError
      }
      
      // 고객 정보 일괄 조회
      const customerIds = [...new Set(projectsData?.map(p => p.customer_id).filter(Boolean) || [])]
      let customersMap: Record<string, any> = {}
      
      if (customerIds.length > 0) {
        const { data: customersData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, phone')
          .in('id', customerIds)
        
        if (customersData) {
          customersMap = customersData.reduce((acc, customer) => {
            acc[customer.id] = customer
            return acc
          }, {})
        }
      }
      
      // 각 프로젝트에 대해 관련 데이터 조회
      const processedProjects = await Promise.all(
        (projectsData || []).map(async (project) => {
          const customerInfo = customersMap[project.customer_id] || null
          
          // 현장방문 신청 조회
          const { data: siteVisits } = await supabase
            .from('site_visit_applications')
            .select('*')
            .eq('project_id', project.id)
            .eq('contractor_id', contractorData.id)
          
          // 내 견적서 조회
          const { data: quotes } = await supabase
            .from('contractor_quotes')
            .select('*')
            .eq('project_id', project.id)
            .eq('contractor_id', contractorData.id)
          
          const mySiteVisit = siteVisits?.find((app: any) => !app.is_cancelled)
          const myQuote = quotes?.[0]
          
          const selectedContractorId = project.selected_contractor_id
          
          // 프로젝트 상태 결정
          let projectStatus: ProjectStatus = 'pending'
          
          const isMyQuoteSelected = selectedContractorId === contractorData.id
          const hasSelectedContractor = !!selectedContractorId
          
          if (project.status === 'cancelled') {
            projectStatus = 'cancelled'
          } else if (project.status === 'completed' || project.status === 'in_progress') {
            if (isMyQuoteSelected) {
              projectStatus = 'selected'
            } else if (hasSelectedContractor) {
              projectStatus = 'not-selected'
            } else if (myQuote) {
              projectStatus = 'quoted'
            } else {
              projectStatus = 'completed'
            }
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
          } else if (project.status === 'approved' || project.status === 'site_visit') {
            projectStatus = 'approved'
          }
          
          return {
            ...project,
            customer: customerInfo,
            selected_contractor_id: selectedContractorId,
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
    if (contractorData && contractorData.id) {
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
  
  // 프로젝트 카드를 렌더링하는 컴포넌트
  const SimpleProjectCard = ({ project }: { project: Project }) => {
    const getStatusBadge = () => {
      const statusConfig: Record<ProjectStatus, { label: string; color: string; icon?: any }> = {
        'pending': { label: '대기중', color: 'bg-gray-100 text-gray-700' },
        'approved': { label: '승인됨', color: 'bg-green-100 text-green-700' },
        'site-visit-applied': { label: '현장방문 신청', color: 'bg-blue-100 text-blue-700' },
        'site-visit-completed': { label: '현장방문 완료', color: 'bg-indigo-100 text-indigo-700' },
        'quoted': { label: '견적서 제출', color: 'bg-purple-100 text-purple-700' },
        'selected': { 
          label: '선정됨', 
          color: 'bg-green-500 text-white font-bold',
          icon: Trophy
        },
        'not-selected': { 
          label: '미선정',  // 다른 업체 이름 제거
          color: 'bg-red-100 text-red-700',
          icon: X
        },
        'completed': { label: '완료', color: 'bg-gray-500 text-white' },
        'cancelled': { label: '취소됨', color: 'bg-gray-300 text-gray-600' }
      }
      
      const config = statusConfig[project.projectStatus || 'pending']
      const Icon = config.icon
      
      return (
        <span className={`px-3 py-1 rounded-full text-xs inline-flex items-center gap-1 ${config.color}`}>
          {Icon && <Icon className="w-3 h-3" />}
          {config.label}
        </span>
      )
    }
    
    // 고객 이름 표시
    const getCustomerName = () => {
      if (!project.customer) return '고객 정보 없음'
      const { first_name, last_name, email } = project.customer
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim()
      }
      return email?.split('@')[0] || '이름 미입력'
    }
    
    // 프로젝트 타입 표시
    const getProjectTypeLabel = () => {
      if (project.project_types && project.project_types.length > 0) {
        return project.project_types.map(type => {
          const typeLabels: Record<string, string> = {
            'full_renovation': '전체 리노베이션',
            'partial_renovation': '부분 리노베이션',
            'kitchen': '주방',
            'bathroom': '욕실',
            'basement': '지하실',
            'painting': '페인팅',
            'flooring': '바닥재'
          }
          return typeLabels[type] || type
        }).join(', ')
      }
      return '리노베이션'
    }
    
    // 공간 타입 표시
    const getSpaceTypeLabel = () => {
      const spaceLabels: Record<string, string> = {
        'detached_house': 'Detached House',
        'town_house': 'Town House',
        'condo': 'Condo',
        'semi_detached': 'Semi-Detached',
        'commercial': 'Commercial'
      }
      return spaceLabels[project.space_type] || 'House'
    }
    
    // 예산 표시
    const getBudgetLabel = () => {
      const budget = project.budget
      const budgetLabels: Record<string, string> = {
        'under_50k': '$50,000 미만',
        '50k_100k': '$50,000 - $100,000',
        'over_100k': '$100,000 이상',
        '100k_200k': '$100,000 - $200,000',
        '200k_500k': '$200,000 - $500,000',
        'over_500k': '$500,000 이상'
      }
      
      if (budgetLabels[budget]) return budgetLabels[budget]
      if (typeof budget === 'number') return `$${budget.toLocaleString()}`
      return '미정'
    }
    
    // 날짜 포맷
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '미정'
      try {
        const date = new Date(dateStr)
        return date.toLocaleDateString('ko-KR', { 
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      } catch {
        return dateStr
      }
    }
    
    // 방문 날짜 가져오기
    const getVisitDate = () => {
      if (project.visit_dates && project.visit_dates.length > 0) {
        return formatDate(project.visit_dates[0])
      }
      if (project.visit_date) {
        return formatDate(project.visit_date)
      }
      return '미정'
    }
    
    // 카드 테두리 색상
    const getBorderColor = () => {
      if (project.projectStatus === 'selected') return 'border-green-500 border-2 shadow-lg'
      if (project.projectStatus === 'not-selected') return 'border-red-300 border-2'
      return 'border-gray-200'
    }
    
    return (
      <div className={`bg-white rounded-lg p-6 ${getBorderColor()} transition-all`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {getSpaceTypeLabel()}
            </h3>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <User className="w-4 h-4 mr-1" />
              <span className="font-medium">{getCustomerName()}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {getProjectTypeLabel()}
            </p>
            <p className="text-sm text-gray-500">
              예산: {getBudgetLabel()}
            </p>
          </div>
          <div className="ml-4">
            {getStatusBadge()}
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            방문 희망일: {getVisitDate()}
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {project.full_address || project.postal_code || '주소 미입력'}
          </div>
          
          {/* 요구사항 표시 */}
          {project.description && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500">요구사항:</p>
              <p className="text-sm text-gray-700 line-clamp-2">
                {project.description}
              </p>
            </div>
          )}
          
          {/* 견적 정보 */}
          {project.contractor_quote && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm font-medium">
                제출 견적: ${project.contractor_quote.price?.toLocaleString()}
              </p>
              {/* 견적 상태는 보안상 표시하지 않음 */}
            </div>
          )}
          
          {/* 현장방문 정보 */}
          {project.site_visit_application && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-blue-600">
                현장방문 {project.site_visit_application.status === 'completed' ? '완료' : '신청됨'}
              </p>
            </div>
          )}
          
          {/* 선정 상태 표시 - 보안 강화 */}
          {project.projectStatus === 'selected' && (
            <div className="mt-3 pt-3 border-t bg-green-50 -m-2 p-3 rounded">
              <p className="text-sm font-semibold text-green-700 flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                고객이 귀사를 선택했습니다.
              </p>
            </div>
          )}
          
          {project.projectStatus === 'not-selected' && (
            <div className="mt-3 pt-3 border-t bg-red-50 -m-2 p-3 rounded">
              <p className="text-sm text-red-700">
                미선정 되었습니다.
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex gap-2 flex-wrap">
          {project.projectStatus === 'approved' && !project.site_visit_application && (
            <button 
              onClick={() => console.log('Apply for site visit')}
              className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              현장방문 신청
            </button>
          )}
          {project.projectStatus === 'site-visit-completed' && !project.contractor_quote && (
            <button 
              onClick={() => console.log('Submit quote')}
              className="px-4 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
            >
              견적서 작성
            </button>
          )}
          {project.projectStatus === 'selected' && (
            <button className="px-4 py-2 bg-green-500 text-white rounded text-sm font-medium cursor-default">
              프로젝트 진행중 => 고객의 정보가 메일로 전송됩니다.
            </button>
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
        
        {/* 통계 요약 */}
        {activeTab === 'projects' && (statusCounts['selected'] > 0 || statusCounts['not-selected'] > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {statusCounts['selected'] > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">선정된 프로젝트</p>
                    <p className="text-2xl font-bold text-green-700">{statusCounts['selected']}</p>
                  </div>
                  <Trophy className="w-8 h-8 text-green-500" />
                </div>
              </div>
            )}
            {statusCounts['not-selected'] > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 font-medium">미선정 프로젝트</p>
                    <p className="text-2xl font-bold text-red-700">{statusCounts['not-selected']}</p>
                  </div>
                  <X className="w-8 h-8 text-red-500" />
                </div>
              </div>
            )}
            {statusCounts['quoted'] > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">제출한 견적서</p>
                    <p className="text-2xl font-bold text-purple-700">{statusCounts['quoted']}</p>
                  </div>
                  <Eye className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            )}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">전체 프로젝트</p>
                  <p className="text-2xl font-bold text-blue-700">{statusCounts['all']}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>
        )}
        
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
