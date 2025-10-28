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
  const [activeTab, setActiveTab] = useState<'projects' | 'profile' | 'portfolio'>('projects')
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
      
      console.log('🚀 Loading projects for contractor:', {
        contractorId: contractorData.id,
        companyName: contractorData.company_name
      })
      
      // ✅ 모든 견적요청서를 가져오기 (업체가 참여하지 않은 것도 포함)
      console.log('📝 Step 1: Fetching all quote requests...')
      const { data: allProjectsData, error: projectsError } = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (projectsError) {
        console.error('Error fetching projects:', projectsError)
        throw projectsError
      }
      
      console.log('📊 Total projects loaded:', allProjectsData?.length || 0)
      
      // ✅ 2. 업체가 참여한 프로젝트 정보 가져오기
      console.log('📝 Step 2: Fetching contractor participation data...')
      const [siteVisitsResponse, quotesResponse] = await Promise.all([
        // 현장방문 신청한 프로젝트
        supabase
          .from('site_visit_applications')
          .select('project_id, status, applied_at')
          .eq('contractor_id', contractorData.id),
        // 견적서 제출한 프로젝트
        supabase
          .from('contractor_quotes')
          .select('id, project_id, price, status, created_at')
          .eq('contractor_id', contractorData.id)
      ])
      
      // 참여 정보를 Map으로 정리
      const siteVisitMap = new Map()
      siteVisitsResponse.data?.forEach(item => {
        siteVisitMap.set(item.project_id, item)
      })
      
      const quotesMap = new Map()
      quotesResponse.data?.forEach(item => {
        quotesMap.set(item.project_id, item)
      })
      
      console.log('📊 Site visits:', siteVisitMap.size)
      console.log('📊 Quotes submitted:', quotesMap.size)
      
      // ✅ 3. 고객 정보 일괄 조회
      console.log('📝 Step 3: Fetching customer information...')
      const customerIds = [...new Set(allProjectsData?.map(p => p.customer_id).filter(Boolean) || [])]
      console.log('👥 Customer IDs:', customerIds.length)
      
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
      
      console.log('✅ Fetched customers:', Object.keys(customersMap).length)
      
      // ✅ 4. 선택된 업체 이름들 로드
      console.log('📝 Step 4: Fetching selected contractor names...')
      const selectedContractorIds = new Set<string>()
      allProjectsData?.forEach(project => {
        if (project.selected_contractor_id) {
          selectedContractorIds.add(project.selected_contractor_id)
        }
      })
      
      const contractorNames = await loadSelectedContractorNames(Array.from(selectedContractorIds))
      console.log('✅ Loaded contractor names:', Object.keys(contractorNames).length)
      
      // ✅ 5. 프로젝트 상태 계산 및 처리
      console.log('📝 Step 5: Processing individual projects...')
      const processedProjects = allProjectsData?.map((project, index) => {
        console.log(`🔄 Processing project ${index + 1}/${allProjectsData.length}: ${project.id.slice(0, 8)}`)
        
        const customer = customersMap[project.customer_id]
        const siteVisit = siteVisitMap.get(project.id)
        const quote = quotesMap.get(project.id)
        
        // 프로젝트 상태 계산
        const isSelected = project.selected_contractor_id === contractorData.id
        const hasOtherSelected = project.selected_contractor_id && project.selected_contractor_id !== contractorData.id
        const hasSiteVisit = !!siteVisit
        const hasSiteVisitCompleted = siteVisit?.status === 'completed'
        const hasQuote = !!quote
        
        console.log(`🔍 Project ${project.id.slice(0, 8)} status calculation:`, {
          dbStatus: project.status,
          isSelected,
          hasOtherSelected,
          hasSiteVisit,
          hasSiteVisitCompleted,
          hasQuote
        })
        
        let projectStatus: ProjectStatus
        
        if (isSelected) {
          projectStatus = 'selected'
        } else if (hasOtherSelected) {
          projectStatus = 'not-selected'
        } else if (project.status === 'bidding') {
          projectStatus = 'bidding'
        } else if (hasQuote) {
          projectStatus = 'quote-submitted'
        } else if (hasSiteVisitCompleted) {
          projectStatus = 'site-visit-completed'
        } else if (hasSiteVisit) {
          projectStatus = 'site-visit-applied'
        } else if (project.status === 'approved' || project.status === 'site-visit-pending') {
          projectStatus = 'approved'
        } else {
          projectStatus = project.status as ProjectStatus
        }
        
        console.log(`✅ Successfully processed project ${project.id.slice(0, 8)} with status: ${projectStatus}`)
        
        return {
          ...project,
          projectStatus,
          customer,
          siteVisit,
          quote,
          contractorNames
        }
      }) || []
      
      console.log('✅ Final processed projects:', processedProjects.length)
      console.log('📊 Project statuses breakdown:', processedProjects.map(p => ({ 
        id: p.id.slice(0, 8), 
        status: p.projectStatus 
      })))
      
      setProjects(processedProjects)
      setSelectedContractorNames(contractorNames)
      console.log('🎉 Projects state updated successfully!')
      
    } catch (error) {
      console.error('❌ Error loading projects:', error)
      setError('프로젝트를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
      console.log('🏁 loadProjects finished')
    }
  }, [contractorData, loadSelectedContractorNames])
  
  // 초기 데이터 로드
  useEffect(() => {
    console.log('🔄 useEffect triggered, contractorData:', contractorData?.id)
    if (contractorData && contractorData.id) {
      loadProjects()
    }
  }, [contractorData])
  
  // showQuoteModal 상태 변경 감지
  useEffect(() => {
    console.log('📊 Modal State Changed:', { showQuoteModal, hasProject: !!selectedProject, contractorId: contractorData?.id })
  }, [showQuoteModal, selectedProject, contractorData])
  
  // projects 상태 변경 감지
  useEffect(() => {
    console.log('📊 Projects state changed:', {
      count: projects.length,
      statuses: projects.map(p => p.projectStatus)
    })
  }, [projects])
  
  const refreshData = async () => {
    setIsRefreshing(true)
    await loadProjects()
    setIsRefreshing(false)
    toast.success('데이터를 새로고침했습니다')
  }

  // ✅ 현장방문 신청 함수
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
    console.log('🎯 입찰 참여하기 버튼 클릭됨!', { projectId: project.id, contractorId: contractorData?.id })
    
    setSelectedProject(project)
    setShowQuoteModal(true)
    
    toast.success('견적서 작성 모달을 여는 중...')
  }
  
  // 입찰 취소 함수
  const handleCancelBidding = async (project: Project) => {
    console.log('🚫 입찰 취소 시도:', { projectId: project.id, quote: project.quote })
    console.log('🔍 Quote 객체 구조:', JSON.stringify(project.quote, null, 2))
    
    if (!project.quote) {
      console.error('❌ 견적서 정보가 없습니다:', project.quote)
      toast.error('견적서 정보를 찾을 수 없습니다')
      return
    }
    
    // quote 객체에서 id 찾기
    const quoteId = project.quote.id || project.quote.quote_id
    if (!quoteId) {
      console.error('❌ 견적서 ID를 찾을 수 없습니다:', project.quote)
      toast.error('견적서 ID를 찾을 수 없습니다')
      return
    }
    
    const confirmed = window.confirm('입찰을 취소하시겠습니까? 제출한 견적서가 삭제됩니다.')
    if (!confirmed) return
    
    try {
      console.log('🗑️ 견적서 삭제 중:', quoteId)
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from('contractor_quotes')
        .delete()
        .eq('id', quoteId)
      
      if (error) {
        console.error('❌ 삭제 오류:', error)
        throw error
      }
      
      console.log('✅ 견적서 삭제 완료')
      toast.success('입찰을 취소하셨습니다.')
      await loadProjects()
    } catch (error) {
      console.error('Failed to cancel bidding:', error)
      toast.error('입찰 취소에 실패했습니다')
    }
  }
  
  // 견적서 제출 완료 핸들러
  const handleQuoteSubmitted = async () => {
    console.log('✅ 견적서 제출 완료')
    setShowQuoteModal(false)
    setSelectedProject(null)
    await loadProjects()
  }
  
  // 필터링된 프로젝트
  const filteredProjects = useMemo(() => {
    console.log('🔍 Filtering projects:', {
      total: projects.length,
      filter: projectFilter
    })
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
    
    console.log('📊 Status counts:', counts)
    
    return counts
  }, [projects])
  
  console.log('🎨 Rendering dashboard:', {
    isLoading,
    projectsCount: projects.length,
    filteredCount: filteredProjects.length,
    filter: projectFilter
  })
  
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
        'approved': { label: '✅ 승인됨 - 현장방문 신청 가능', color: 'bg-green-100 text-green-700' },
        'site-visit-applied': { label: '현장방문 신청됨', color: 'bg-blue-100 text-blue-700' },
        'site-visit-pending': { label: '현장방문 대기중', color: 'bg-yellow-100 text-yellow-700' },
        'site-visit-completed': { label: '현장방문 완료', color: 'bg-indigo-100 text-indigo-700' },
        'bidding': { 
          label: project.contractor_quote ? '🔥 입찰 중 (견적서 제출완료)' : '🔥 입찰 중', 
          color: 'bg-orange-500 text-white font-bold',
          icon: TrendingUp
        },
        'quoted': { label: '견적서 제출완료', color: 'bg-purple-100 text-purple-700' },
        'selected': { 
          label: '🎉 선정됨!', 
          color: 'bg-green-500 text-white font-bold',
          icon: Trophy
        },
        'not-selected': { 
          label: '미선택',
          color: 'bg-orange-100 text-orange-800',
          icon: X
        },
        'completed': { label: '프로젝트 종료', color: 'bg-gray-500 text-white' },
        'cancelled': { label: '취소됨', color: 'bg-gray-300 text-gray-600' }
      }
      
      const config = statusConfig[project.projectStatus || 'approved']
      const Icon = config?.icon
      
      return (
        <span className={`px-3 py-1 rounded-full text-xs inline-flex items-center gap-1 ${config?.color || 'bg-gray-100 text-gray-700'}`}>
          {Icon && <Icon className="w-3 h-3" />}
          {config?.label || '알 수 없음'}
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
    
    // 예산 표시 - 개선된 버전
    const getBudgetLabel = () => {
      const budget = project.budget
      const budgetLabels: Record<string, string> = {
        'under_50k': '$50,000 미만',
        '50k_100k': '$50,000 - $100,000',
        '50k_to_100k': '$50,000 - $100,000',
        'over_100k': '$100,000 이상',
        '100k_200k': '$100,000 - $200,000',
        '200k_500k': '$200,000 - $500,000',
        'over_500k': '$500,000 이상'
      }
      
      if (budgetLabels[budget]) return budgetLabels[budget]
      if (typeof budget === 'number') return `$${budget.toLocaleString()}`
      return budget || '미정'
    }
    
    // 시작시기 표시 - 새로 추가
    const getTimelineLabel = () => {
      const timeline = project.timeline
      const timelineLabels: Record<string, string> = {
        'immediate': '즉시 시작',
        'immediately': '즉시 시작',
        'asap': '즉시 시작',
        '1_month': '1개월 내',
        'within_1_month': '1개월 내',
        '3_months': '3개월 내',
        'within_3_months': '3개월 내',
        'planning': '계획단계',
        'planning_stage': '계획단계',
        'flexible': '유연함'
      }
      
      return timelineLabels[timeline] || timeline || '미정'
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
      if (project.projectStatus === 'approved') return 'border-blue-300 border-2'
      return 'border-gray-200'
    }
    
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#daa520]/20 hover:shadow-xl transition-all duration-300 ${getBorderColor()}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-serif font-light text-[#2c5f4e] mb-2">
              {getSpaceTypeLabel()}
            </h3>
            <div className="flex items-center text-sm text-gray-600 mt-1 mb-3">
              <User className="w-4 h-4 mr-2 text-[#daa520]" />
              <span className="font-light">{getCustomerName()}</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-light">
                프로젝트: {getProjectTypeLabel()}
              </p>
              <p className="text-sm text-gray-600 font-light">
                예산: {getBudgetLabel()}
              </p>
              <p className="text-sm text-gray-600 font-light">
                시작시기: {getTimelineLabel()}
              </p>
            </div>
          </div>
          <div className="ml-4">
            {getStatusBadge()}
          </div>
        </div>
        
        <div className="space-y-3 text-sm mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center text-gray-600 font-light">
            <Calendar className="w-4 h-4 mr-3 text-[#daa520]" />
            방문 희망일: {getVisitDate()}
          </div>
          <div className="flex items-center text-gray-600 font-light">
            <MapPin className="w-4 h-4 mr-3 text-[#daa520]" />
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
          
          {/* Approved 상태 안내 */}
          {project.projectStatus === 'approved' && (
            <div className="mt-3 pt-3 border-t bg-green-50 -m-2 p-3 rounded">
              <p className="text-sm font-semibold text-green-700">
                ✅ 관리자가 승인한 프로젝트입니다. 현장방문을 신청하세요!
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
            <div className="mt-3 pt-3 border-t bg-orange-50 -m-2 p-3 rounded">
              <p className="text-sm text-orange-800">
                고객이 타업체를 선택했습니다.
              </p>
            </div>
          )}
          
          {/* 프로젝트 종료 안내 */}
          {project.projectStatus === 'completed' && !project.selected_contractor_id && (
            <div className="mt-3 pt-3 border-t bg-gray-50 -m-2 p-3 rounded">
              <p className="text-sm text-gray-700">
                프로젝트가 종료되었습니다.
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex gap-2 flex-wrap">
          {project.projectStatus === 'approved' && !project.siteVisit && (
            <button 
              onClick={() => handleSiteVisitApplication(project)}
              className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 font-semibold"
            >
              현장방문 신청
            </button>
          )}
          
          {/* 입찰 중 - 견적서 미제출 시 입찰 참여 버튼 (현장방문 필수) */}
          {project.projectStatus === 'bidding' && !project.quote && project.siteVisit && (
            <button 
              onClick={() => handleJoinBidding(project)}
              className="px-4 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 font-semibold flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              입찰 참여하기
            </button>
          )}
          
          {/* 입찰 중 - 현장방문을 하지 않은 경우 */}
          {project.projectStatus === 'bidding' && !project.siteVisit && (
            <div className="px-4 py-2 bg-gray-300 text-gray-600 rounded text-sm font-semibold flex items-center gap-2 cursor-not-allowed">
              <FileText className="w-4 h-4" />
              현장방문 후 입찰 가능
            </div>
          )}
          
          {/* 입찰 중 - 견적서 제출 완료 시 입찰 취소 버튼 */}
          {project.projectStatus === 'bidding' && project.quote && (
            <button 
              onClick={() => handleCancelBidding(project)}
              className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 font-semibold flex items-center gap-2"
            >
              <Ban className="w-4 h-4" />
              입찰 취소하기
            </button>
          )}
          
          {project.projectStatus === 'site-visit-completed' && !project.quote && (
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
        <div className="mt-2 pt-2 border-t text-xs text-gray-400">
          <p>ID: {project.id.slice(0, 8)} | DB Status: {project.status} | Project Status: {project.projectStatus} | Has Quote: {project.quote ? 'Yes' : 'No'} | Has Site Visit: {project.siteVisit ? 'Yes' : 'No'}</p>
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
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-serif font-light text-[#2c5f4e]">
                    {contractorData?.company_name || 'Partners Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-500 font-light">업체 대시보드</p>
                </div>
              </div>
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-light transition-all"
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
        
        {/* 탭 네비게이션 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-[#daa520]/20 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'projects'
                    ? 'border-[#daa520] text-[#2c5f4e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Projects
              </button>
              <button
                onClick={() => router.push('/contractor/profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'border-[#daa520] text-[#2c5f4e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Profile 관리
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'portfolio'
                    ? 'border-[#daa520] text-[#2c5f4e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Portfolio 관리
              </button>
            </nav>
          </div>
        </div>
        
        {/* 통계 요약 */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {statusCounts['bidding'] > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#daa520]/20 p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-light mb-1">입찰 중</p>
                    <p className="text-3xl font-serif font-light text-[#2c5f4e]">{statusCounts['bidding']}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </div>
            )}
            {statusCounts['selected'] > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#daa520]/20 p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-light mb-1">선정된 프로젝트</p>
                    <p className="text-3xl font-serif font-light text-green-600">{statusCounts['selected']}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            )}
            {statusCounts['quoted'] > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#daa520]/20 p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-light mb-1">제출한 견적서</p>
                    <p className="text-3xl font-serif font-light text-purple-600">{statusCounts['quoted']}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#daa520]/20 p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-light mb-1">전체 프로젝트</p>
                  <p className="text-3xl font-serif font-light text-[#2c5f4e]">{statusCounts['all']}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
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
                <p className="text-sm text-gray-500 mt-1">
                  ✅ 참여 중인 프로젝트만 표시됩니다
                </p>
              </div>
              
              {filteredProjects.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  {projects.length === 0 ? '참여 중인 프로젝트가 없습니다.' : '해당하는 프로젝트가 없습니다.'}
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
      {showQuoteModal && selectedProject && contractorData?.id && (
        <QuoteModal
          isOpen={showQuoteModal}
          mode="create"
          project={selectedProject}
          contractorId={contractorData.id}
          onClose={() => {
            console.log('❌ Modal 닫기')
            setShowQuoteModal(false)
            setSelectedProject(null)
          }}
          onSuccess={handleQuoteSubmitted}
        />
      )}
    </div>
  )
}
