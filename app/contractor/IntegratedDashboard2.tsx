'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, RefreshCw, Eye, CheckCircle, XCircle, Calendar, MapPin, User, Trophy, X, UserCircle, Briefcase, TrendingUp, FileText, Ban } from 'lucide-react'
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
  const [projectFilter, setProjectFilter] = useState<ProjectStatus | 'all' | 'bidding'>('all')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'projects' | 'portfolio'>('projects')
  const [selectedContractorNames, setSelectedContractorNames] = useState<Record<string, string>>({})
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  
  // 선택된 업체 이름들을 미리 로드
  const loadSelectedContractorNames = async (contractorIds: string[]) => {
    if (!contractorIds.length) return {}
    
    const supabase = createBrowserClient()
    const { data } = await supabase
      .from('contractors')
      .select('id, company_name')
      .in('id', contractorIds)
    
    const namesMap: Record<string, string> = {}
    data?.forEach(contractor => {
      namesMap[contractor.id] = contractor.company_name
    })
    
    return namesMap
  }
  
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
      
      // ✅ 먼저 업체가 참여한 프로젝트 ID 목록 가져오기
      const [siteVisitsResponse, quotesResponse] = await Promise.all([
        // 현장방문 신청한 프로젝트
        supabase
          .from('site_visit_applications')
          .select('project_id')
          .eq('contractor_id', contractorData.id),
        // 견적서 제출한 프로젝트
        supabase
          .from('contractor_quotes')
          .select('project_id')
          .eq('contractor_id', contractorData.id)
      ])
      
      // 프로젝트 ID 중복 제거
      const participatingProjectIds = new Set<string>()
      
      siteVisitsResponse.data?.forEach(item => {
        if (item.project_id) participatingProjectIds.add(item.project_id)
      })
      
      quotesResponse.data?.forEach(item => {
        if (item.project_id) participatingProjectIds.add(item.project_id)
      })
      
      console.log('Participating project IDs:', Array.from(participatingProjectIds))
      
      // 참여한 프로젝트가 없으면 빈 배열 반환
      if (participatingProjectIds.size === 0) {
        console.log('No participating projects found')
        setProjects([])
        setIsLoading(false)
        return
      }
      
      // ✅ 참여한 프로젝트만 가져오기
      const { data: projectsData, error: projectsError } = await supabase
        .from('quote_requests')
        .select('*, selected_contractor_id, selected_quote_id')
        .in('id', Array.from(participatingProjectIds))
        .order('created_at', { ascending: false })
      
      if (projectsError) {
        console.error('Projects fetch error:', projectsError)
        throw projectsError
      }
      
      console.log('Fetched projects:', projectsData?.length)
      
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
      
      // 선택된 업체 IDs 수집
      const selectedContractorIds = new Set<string>()
      projectsData?.forEach(project => {
        if (project.selected_contractor_id) {
          selectedContractorIds.add(project.selected_contractor_id)
        }
      })
      
      // 선택된 업체 이름들 로드
      const contractorNames = await loadSelectedContractorNames(Array.from(selectedContractorIds))
      setSelectedContractorNames(contractorNames)
      
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
          
          // ⭐ 프로젝트 상태 결정 - 입찰 중 상태 우선 처리!
          let projectStatus: ProjectStatus | 'bidding' = 'pending'
          
          const isMyQuoteSelected = selectedContractorId === contractorData.id
          const hasSelectedContractor = !!selectedContractorId
          
          // 1️⃣ 입찰 중 상태 - 최우선 처리!
          if (project.status === 'bidding' || project.status === 'quote-submitted') {
            projectStatus = 'bidding'  // 입찰 중 상태로 명확히 표시
          }
          // 2️⃣ 취소/완료 상태
          else if (project.status === 'cancelled') {
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
          }
          // 3️⃣ 선정/미선정 상태
          else if (isMyQuoteSelected) {
            projectStatus = 'selected'
          } else if (hasSelectedContractor && !isMyQuoteSelected) {
            projectStatus = 'not-selected'
          }
          // 4️⃣ 견적서 제출 상태
          else if (myQuote) {
            projectStatus = 'quoted'
          }
          // 5️⃣ 현장방문 관련 상태
          else if (mySiteVisit && mySiteVisit.status === 'completed') {
            projectStatus = 'site-visit-completed'
          } else if (mySiteVisit) {
            projectStatus = 'site-visit-applied'
          }
          // 6️⃣ 기본 승인 상태
          else if (project.status === 'approved' || project.status === 'site_visit' || project.status === 'site-visit-pending') {
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

  // ✅ 현장방문 신청 함수 추가
  const handleSiteVisitApplication = async (project: Project) => {
    if (!contractorData?.id) {
      toast.error('업체 정보를 찾을 수 없습니다')
      return
    }

    try {
      const supabase = createBrowserClient()
      
      // 이미 신청했는지 확인
      const { data: existing } = await supabase
        .from('site_visit_applications')
        .select('*')
        .eq('project_id', project.id)
        .eq('contractor_id', contractorData.id)
        .maybeSingle()

      if (existing) {
        toast.error('이미 현장방문을 신청했습니다')
        return
      }

      // 현장방문 신청 삽입
      const { error: insertError } = await supabase
        .from('site_visit_applications')
        .insert({
          project_id: project.id,
          contractor_id: contractorData.id,
          status: 'pending',
          applied_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Site visit application error:', insertError)
        toast.error('현장방문 신청에 실패했습니다')
        return
      }

      toast.success('현장방문 신청이 완료되었습니다')
      await loadProjects() // 데이터 새로고침
    } catch (error) {
      console.error('Error applying for site visit:', error)
      toast.error('현장방문 신청 중 오류가 발생했습니다')
    }
  }
  
  // 입찰 참여 함수
  const handleJoinBidding = (project: Project) => {
    setSelectedProject(project)
    setShowQuoteModal(true)
  }
  
  // 입찰 취소 함수
  const handleCancelBidding = async (project: Project) => {
    if (!project.contractor_quote) return
    
    const confirmed = window.confirm('입찰을 취소하시겠습니까? 제출한 견적서가 삭제됩니다.')
    if (!confirmed) return
    
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from('contractor_quotes')
        .delete()
        .eq('id', project.contractor_quote.id)
      
      if (error) throw error
      
      toast.success('입찰이 취소되었습니다')
      await loadProjects()
    } catch (error) {
      console.error('Failed to cancel bidding:', error)
      toast.error('입찰 취소에 실패했습니다')
    }
  }
  
  // 견적서 제출 완료 핸들러
  const handleQuoteSubmitted = async () => {
    setShowQuoteModal(false)
    setSelectedProject(null)
    toast.success('견적서가 제출되었습니다')
    await loadProjects()
  }
  
  // 필터링된 프로젝트
  const filteredProjects = useMemo(() => {
    if (projectFilter === 'all') return projects
    if (projectFilter === 'bidding') {
      return projects.filter(p => p.projectStatus === 'bidding')
    }
    return projects.filter(p => p.projectStatus === projectFilter)
  }, [projects, projectFilter])
  
  // 상태별 카운트
  const statusCounts = useMemo(() => {
    const counts: Record<ProjectStatus | 'all' | 'bidding', number> = {
      'all': projects.length,
      'pending': 0,
      'approved': 0,
      'site-visit-applied': 0,
      'site-visit-completed': 0,
      'bidding': 0,
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
      const statusConfig: Record<ProjectStatus | 'bidding', { label: string; color: string; icon?: any }> = {
        'pending': { label: '대기중', color: 'bg-gray-100 text-gray-700' },
        'approved': { label: '승인됨 - 현장방문 신청 가능', color: 'bg-green-100 text-green-700' },
        'site-visit-applied': { label: '현장방문 신청', color: 'bg-blue-100 text-blue-700' },
        'site-visit-completed': { label: '현장방문 완료', color: 'bg-indigo-100 text-indigo-700' },
        'bidding': { 
          label: project.contractor_quote ? '🔥 입찰 중 (견적서 제출완료)' : '🔥 입찰 중', 
          color: 'bg-orange-500 text-white font-bold',
          icon: TrendingUp
        },
        'quoted': { label: '견적서 제출', color: 'bg-purple-100 text-purple-700' },
        'selected': { 
          label: '선정됨', 
          color: 'bg-green-500 text-white font-bold',
          icon: Trophy
        },
        'not-selected': { 
          label: selectedContractorNames[project.selected_contractor_id!] 
            ? `${selectedContractorNames[project.selected_contractor_id!]} 선정` 
            : '미선정',
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
      if (project.projectStatus === 'bidding') return 'border-orange-500 border-2 shadow-lg'
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
            </div>
          )}
          
          {/* 입찰 중 상태 강조 표시 */}
          {project.projectStatus === 'bidding' && (
            <div className="mt-3 pt-3 border-t bg-orange-50 -m-2 p-3 rounded">
              <p className="text-sm font-semibold text-orange-700 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                {project.contractor_quote 
                  ? '🔥 입찰이 진행 중입니다. 견적서가 제출되었습니다.' 
                  : '🔥 입찰이 시작되었습니다! 견적서를 제출하세요.'}
              </p>
            </div>
          )}
          
          {/* 현장방문 정보 */}
          {project.site_visit_application && project.projectStatus !== 'bidding' && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-blue-600">
                현장방문 {project.site_visit_application.status === 'completed' ? '완료' : '신청됨'}
              </p>
            </div>
          )}
          
          {/* 선정 상태 표시 */}
          {project.projectStatus === 'selected' && (
            <div className="mt-3 pt-3 border-t bg-green-50 -m-2 p-3 rounded">
              <p className="text-sm font-semibold text-green-700 flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                🎉 축하합니다! 고객이 귀사를 선택했습니다.
              </p>
            </div>
          )}
          
          {project.projectStatus === 'not-selected' && (
            <div className="mt-3 pt-3 border-t bg-red-50 -m-2 p-3 rounded">
              <p className="text-sm text-red-700">
                고객이 <span className="font-semibold">
                  {selectedContractorNames[project.selected_contractor_id!] || '다른 업체'}
                </span>를 선택했습니다.
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex gap-2 flex-wrap">
          {project.projectStatus === 'approved' && !project.site_visit_application && (
            <button 
              onClick={() => handleSiteVisitApplication(project)}
              className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              현장방문 신청
            </button>
          )}
          
          {/* 입찰 중 - 견적서 미제출 시 입찰 참여 버튼 */}
          {project.projectStatus === 'bidding' && !project.contractor_quote && (
            <button 
              onClick={() => handleJoinBidding(project)}
              className="px-4 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 font-semibold flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              입찰 참여하기
            </button>
          )}
          
          {/* 입찰 중 - 견적서 제출 완료 시 입찰 취소 버튼 */}
          {project.projectStatus === 'bidding' && project.contractor_quote && (
            <button 
              onClick={() => handleCancelBidding(project)}
              className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 font-semibold flex items-center gap-2"
            >
              <Ban className="w-4 h-4" />
              입찰 취소하기
            </button>
          )}
          
          {project.projectStatus === 'site-visit-completed' && !project.contractor_quote && (
            <button 
              onClick={() => handleJoinBidding(project)}
              className="px-4 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
            >
              견적서 작성
            </button>
          )}
          {project.projectStatus === 'selected' && (
            <button className="px-4 py-2 bg-green-500 text-white rounded text-sm font-medium cursor-default">
              고객의 정보가 입력하신 메일로 전송됩니다.
            </button>
          )}
        </div>
        
        {/* 디버그 정보 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 pt-2 border-t text-xs text-gray-400">
            <p>Project ID: {project.id}</p>
            <p>DB Status: {project.status}</p>
            <p>Project Status: {project.projectStatus}</p>
            <p>Has Quote: {project.contractor_quote ? 'Yes' : 'No'}</p>
          </div>
        )}
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
        {/* 상단 메뉴 버튼들 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => router.push('/contractor/profile')}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserCircle className="h-5 w-5 text-blue-600" />
            <span className="font-medium">프로필 관리</span>
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Briefcase className="h-5 w-5 text-blue-600" />
            <span className="font-medium">포트폴리오 관리</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors md:col-span-1"
          >
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="font-medium">My project</span>
          </button>
        </div>
        
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
                My project
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
        {activeTab === 'projects' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {statusCounts['bidding'] > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">입찰 중</p>
                    <p className="text-2xl font-bold text-orange-700">{statusCounts['bidding']}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            )}
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
      
      {/* 견적서 작성 모달 */}
      {showQuoteModal && selectedProject && (
        <QuoteModal
          project={selectedProject}
          contractorId={contractorData?.id || ''}
          onClose={() => {
            setShowQuoteModal(false)
            setSelectedProject(null)
          }}
          onSubmit={handleQuoteSubmitted}
        />
      )}
    </div>
  )
}
