'use client'

import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, RefreshCw, Eye, CheckCircle, XCircle, Calendar, MapPin, User, Trophy, X, UserCircle, Briefcase, TrendingUp, FileText, Ban, AlertCircle } from 'lucide-react'
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
  const [projectFilter, setProjectFilter] = useState<ProjectStatus | 'all' | 'bidding' | 'failed-bid'>('all')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'projects' | 'profile' | 'portfolio'>('projects')
  const [selectedContractorNames, setSelectedContractorNames] = useState<Record<string, string>>({})
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  
  // ✅ 중복 호출 방지를 위한 ref
  const isLoadingRef = useRef(false)
  
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
    
    // ✅ 중복 호출 방지
    if (isLoadingRef.current) {
      console.log('⏭️ Already loading, skipping...')
      return
    }
    
    isLoadingRef.current = true
    
    try {
      setIsLoading(true)
      const supabase = createBrowserClient()
      
      console.log('🚀 Loading projects for contractor:', {
        contractorId: contractorData.id,
        companyName: contractorData.company_name,
        registeredAt: contractorData.created_at  // ✅ 가입일 로깅
      })
      
      // ✅ 1. 업체 정보에서 가입일 확인
      const contractorCreatedAt = contractorData.created_at
      
      if (!contractorCreatedAt) {
        console.error('❌ Contractor created_at not found')
        throw new Error('Contractor registration date not found')
      }
      
      console.log('📅 Only showing projects created after:', contractorCreatedAt)
      
      // ✅ 2. 가입일 이후의 프로젝트만 조회
      console.log('📝 Step 1: Fetching quote requests after registration date...')
      const { data: allProjectsData, error: projectsError } = await supabase
        .from('quote_requests')
        .select('*')
        .gte('created_at', contractorCreatedAt)  // ⭐ 핵심: 가입일 이후만!
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (projectsError) {
        console.error('Error fetching projects:', projectsError)
        throw projectsError
      }
      
      console.log('📊 Total projects loaded (after registration):', allProjectsData?.length || 0)
      console.log('🔒 Security filter applied - Registration date:', contractorCreatedAt)
      
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
        
        let projectStatus: ProjectStatus | 'failed-bid'
        
        if (isSelected) {
          projectStatus = 'selected'
        } else if (hasOtherSelected) {
          projectStatus = 'not-selected'
        } else if (project.status === 'bidding') {
          projectStatus = 'bidding'
        } else if (project.status === 'bidding-closed' && hasSiteVisit && !hasQuote) {
          // 입찰이 종료되었는데 현장방문은 했지만 견적서를 제출하지 않은 경우
          projectStatus = 'failed-bid'
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
      setError('Error loading projects.')
    } finally {
      setIsLoading(false)
      isLoadingRef.current = false
      console.log('🏁 loadProjects finished')
    }
  }, [contractorData?.id, contractorData?.created_at, loadSelectedContractorNames])
  
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
    toast.success('Data refreshed')
  }

  // ✅ 현장방문 신청 함수 - API 호출 버전
  const handleSiteVisitApplication = async (project: Project) => {
    console.log('🚀 Apply Site Visit clicked!', {
      projectId: project.id,
      contractorId: contractorData?.id,
      hasContractorData: !!contractorData
    })

    if (!contractorData?.id) {
      console.error('❌ No contractor ID')
      toast.error('Contractor information not found')
      return
    }

    // 🚀 낙관적 UI 업데이트 - 즉시 상태 변경
    const updatedProjects = projects.map(p => 
      p.id === project.id 
        ? { 
            ...p, 
            projectStatus: 'site-visit-applied' as ProjectStatus,
            siteVisit: { 
              status: 'pending', 
              applied_at: new Date().toISOString() 
            } 
          }
        : p
    )
    setProjects(updatedProjects)
    
    // 즉시 성공 메시지 표시
    toast.success('Applying for site visit...')

    try {
      console.log('📝 Calling site visit API...')
      
      // API 호출
      const response = await fetch('/api/apply-site-visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          contractorId: contractorData.id
        })
      })

      const data = await response.json()

      console.log('📊 API Response:', {
        status: response.status,
        success: data.success,
        message: data.message
      })

      if (!response.ok) {
        // 실패 시 원래 상태로 되돌림
        await loadProjects()
        throw new Error(data.error || 'Failed to apply for site visit')
      }

      console.log('✅ Site visit applied successfully!')
      toast.success('Site visit application submitted! Customer will be notified.', {
        duration: 3000
      })
      
      // 백그라운드에서 데이터 새로고침
      setTimeout(() => loadProjects(), 1000)
      
    } catch (error: any) {
      console.error('💥 Error applying for site visit:', error)
      toast.error(error.message || 'Failed to apply for site visit')
      
      // 에러 발생 시 데이터 다시 로드
      await loadProjects()
    }
  }
  
  // 입찰 참여 함수
  const handleJoinBidding = (project: Project) => {
    console.log('🎯 Join bidding button clicked!', { projectId: project.id, contractorId: contractorData?.id })
    
    setSelectedProject(project)
    setShowQuoteModal(true)
    
    toast.success('Opening quote modal...')
  }
  
  // 입찰 취소 함수
  const handleCancelBidding = async (project: Project) => {
    console.log('🚫 Cancel bidding attempt:', { projectId: project.id, quote: project.quote })
    console.log('🔍 Quote object structure:', JSON.stringify(project.quote, null, 2))
    
    if (!project.quote) {
      console.error('❌ Quote information not found:', project.quote)
      toast.error('Quote information not found')
      return
    }
    
    // Find id from quote object
    const quoteId = project.quote.id || project.quote.quote_id
    if (!quoteId) {
      console.error('❌ Quote ID not found:', project.quote)
      toast.error('Quote ID not found')
      return
    }
    
    const confirmed = window.confirm('Are you sure you want to cancel the bidding? The submitted quote will be deleted.')
    if (!confirmed) return
    
    try {
      console.log('🗑️ Deleting quote:', quoteId)
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from('contractor_quotes')
        .delete()
        .eq('id', quoteId)
      
      if (error) {
        console.error('❌ Deletion error:', error)
        throw error
      }
      
      console.log('✅ Quote deleted successfully')
      toast.success('Bidding has been cancelled.')
      await loadProjects()
    } catch (error) {
      console.error('Failed to cancel bidding:', error)
      toast.error('Failed to cancel bidding')
    }
  }
  
  // 견적서 제출 완료 핸들러
  const handleQuoteSubmitted = async () => {
    console.log('✅ Quote submitted successfully')
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
    if (projectFilter === 'failed-bid') {
      return projects.filter(p => p.projectStatus === 'failed-bid')
    }
    return projects.filter(p => p.projectStatus === projectFilter)
  }, [projects, projectFilter])
  
  // 상태별 카운트
  const statusCounts = useMemo(() => {
    const counts: Record<ProjectStatus | 'all' | 'bidding' | 'failed-bid', number> = {
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
      'cancelled': 0,
      'failed-bid': 0
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
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  // 프로젝트 카드를 렌더링하는 컴포넌트
  const SimpleProjectCard = ({ project }: { project: Project }) => {
    const getStatusBadge = () => {
      const statusConfig: Record<ProjectStatus | 'bidding' | 'failed-bid', { label: string; color: string; icon?: any }> = {
        'pending': { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
        'approved': { label: '✅ Approved - Apply Site Visit', color: 'bg-green-100 text-green-700' },
        'site-visit-applied': { label: 'Site Visit Applied', color: 'bg-blue-100 text-blue-700' },
        'site-visit-pending': { label: 'Site Visit Pending', color: 'bg-yellow-100 text-yellow-700' },
        'site-visit-completed': { label: 'Site Visit Completed', color: 'bg-indigo-100 text-indigo-700' },
        'bidding': { 
          label: project.contractor_quote ? '🔥 Bidding (Quote Submitted)' : '🔥 Bidding', 
          color: 'bg-orange-500 text-white font-bold',
          icon: TrendingUp
        },
        'quoted': { label: 'Quote Submitted', color: 'bg-purple-100 text-purple-700' },
        'selected': { 
          label: '🎉 Selected!', 
          color: 'bg-green-500 text-white font-bold',
          icon: Trophy
        },
        'not-selected': { 
          label: 'Not Selected',
          color: 'bg-orange-100 text-orange-800',
          icon: X
        },
        'failed-bid': {
          label: 'Failed Bid',
          color: 'bg-red-100 text-red-800',
          icon: AlertCircle
        },
        'completed': { label: 'Project Completed', color: 'bg-gray-500 text-white' },
        'cancelled': { label: 'Cancelled', color: 'bg-gray-300 text-gray-600' }
      }
      
      const config = statusConfig[project.projectStatus || 'approved']
      const Icon = config?.icon
      
      return (
        <span className={`px-3 py-1 rounded-full text-xs inline-flex items-center gap-1 ${config?.color || 'bg-gray-100 text-gray-700'}`}>
          {Icon && <Icon className="w-3 h-3" />}
          {config?.label || 'Unknown'}
        </span>
      )
    }
    
    // 고객 이름 표시
    const getCustomerName = () => {
      if (!project.customer) return 'No Customer Info'
      const { first_name, last_name, email } = project.customer
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim()
      }
      return email?.split('@')[0] || 'No Name'
    }
    
    // 프로젝트 타입 표시
    const getProjectTypeLabel = () => {
      if (project.project_types && project.project_types.length > 0) {
        return project.project_types.map(type => {
          const typeLabels: Record<string, string> = {
            'full_renovation': 'Full Renovation',
            'partial_renovation': 'Partial Renovation',
            'kitchen': 'Kitchen',
            'bathroom': 'Bathroom',
            'basement': 'Basement',
            'painting': 'Painting',
            'flooring': 'Flooring'
          }
          return typeLabels[type] || type
        }).join(', ')
      }
      return 'Renovation'
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
        'under_50k': 'Under $50,000',
        '50k_100k': '$50,000 - $100,000',
        '50k_to_100k': '$50,000 - $100,000',
        'over_100k': '$100,000+',
        '100k_200k': '$100,000 - $200,000',
        '200k_500k': '$200,000 - $500,000',
        'over_500k': '$500,000+'
      }
      
      if (budgetLabels[budget]) return budgetLabels[budget]
      if (typeof budget === 'number') return `$${budget.toLocaleString()}`
      return budget || 'Not Set'
    }
    
    // 시작시기 표시 - 새로 추가
    const getTimelineLabel = () => {
      const timeline = project.timeline
      const timelineLabels: Record<string, string> = {
        'immediate': 'Immediate',
        'immediately': 'Immediate',
        'asap': 'Immediate',
        '1_month': 'Within 1 month',
        'within_1_month': 'Within 1 month',
        '3_months': 'Within 3 months',
        'within_3_months': 'Within 3 months',
        'planning': 'Planning',
        'planning_stage': 'Planning',
        'flexible': 'Flexible'
      }
      
      return timelineLabels[timeline] || timeline || 'Not Set'
    }
    
    // 날짜 포맷
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return 'Not Set'
      try {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { 
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
      return 'Not Set'
    }
    
    // 카드 테두리 색상
    const getBorderColor = () => {
      if (project.projectStatus === 'selected') return 'border-green-500 border-2 shadow-lg'
      if (project.projectStatus === 'not-selected') return 'border-red-300 border-2'
      if (project.projectStatus === 'failed-bid') return 'border-red-500 border-2 shadow-lg'
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
                Project: {getProjectTypeLabel()}
              </p>
              <p className="text-sm text-gray-600 font-light">
                Budget: {getBudgetLabel()}
              </p>
              <p className="text-sm text-gray-600 font-light">
                Timeline: {getTimelineLabel()}
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
            Visit Date: {getVisitDate()}
          </div>
          <div className="flex items-center text-gray-600 font-light">
            <MapPin className="w-4 h-4 mr-3 text-[#daa520]" />
            {project.full_address || project.postal_code || 'No Address'}
          </div>
          
          {/* 요구사항 표시 */}
          {project.description && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500">Requirements:</p>
              <p className="text-sm text-gray-700 line-clamp-2">
                {project.description}
              </p>
            </div>
          )}
          
          {/* 견적 정보 */}
          {project.contractor_quote && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm font-medium">
                Submitted Quote: ${project.contractor_quote.price?.toLocaleString()}
              </p>
            </div>
          )}
          
          {/* Approved 상태 안내 */}
          {project.projectStatus === 'approved' && (
            <div className="mt-3 pt-3 border-t bg-green-50 -m-2 p-3 rounded">
              <p className="text-sm font-semibold text-green-700">
                ✅ Project approved by admin. Apply for site visit!
              </p>
            </div>
          )}
          
          {/* 입찰 중 상태 강조 표시 */}
          {project.projectStatus === 'bidding' && (
            <div className="mt-3 pt-3 border-t bg-orange-50 -m-2 p-3 rounded">
              <p className="text-sm font-semibold text-orange-700 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                {project.contractor_quote 
                  ? '🔥 Bidding in progress. Quote submitted.' 
                  : '🔥 Bidding started! Submit your quote.'}
              </p>
            </div>
          )}
          
          {/* Failed Bid 상태 안내 */}
          {project.projectStatus === 'failed-bid' && (
            <div className="mt-3 pt-3 border-t bg-red-50 -m-2 p-3 rounded">
              <p className="text-sm font-semibold text-red-700 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Failed to submit quote before deadline.
              </p>
            </div>
          )}
          
          {/* 현장방문 정보 */}
          {project.site_visit_application && project.projectStatus !== 'bidding' && project.projectStatus !== 'failed-bid' && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-blue-600">
                Site Visit {project.site_visit_application.status === 'completed' ? 'Completed' : 'Applied'}
              </p>
            </div>
          )}
          
          {/* 선정 상태 표시 */}
          {project.projectStatus === 'selected' && (
            <div className="mt-3 pt-3 border-t bg-green-50 -m-2 p-3 rounded">
              <p className="text-sm font-semibold text-green-700 flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                🎉 Congratulations! Customer has selected you.
              </p>
            </div>
          )}
          
          {project.projectStatus === 'not-selected' && (
            <div className="mt-3 pt-3 border-t bg-orange-50 -m-2 p-3 rounded">
              <p className="text-sm text-orange-800">
                Customer selected another contractor.
              </p>
            </div>
          )}
          
          {/* 프로젝트 종료 안내 */}
          {project.projectStatus === 'completed' && !project.selected_contractor_id && (
            <div className="mt-3 pt-3 border-t bg-gray-50 -m-2 p-3 rounded">
              <p className="text-sm text-gray-700">
                Project completed.
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
              Apply Site Visit
            </button>
          )}
          
          {/* 입찰 중 - 견적서 미제출 시 입찰 참여 버튼 (현장방문 필수) */}
          {project.projectStatus === 'bidding' && !project.quote && project.siteVisit && (
            <button 
              onClick={() => handleJoinBidding(project)}
              className="px-4 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 font-semibold flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Join Bidding
            </button>
          )}
          
          {/* 입찰 중 - 현장방문을 하지 않은 경우 */}
          {project.projectStatus === 'bidding' && !project.siteVisit && (
            <div className="px-4 py-2 bg-gray-300 text-gray-600 rounded text-sm font-semibold flex items-center gap-2 cursor-not-allowed">
              <FileText className="w-4 h-4" />
              Site Visit Required
            </div>
          )}
          
          {/* 입찰 중 - 견적서 제출 완료 시 입찰 취소 버튼 */}
          {project.projectStatus === 'bidding' && project.quote && (
            <button 
              onClick={() => handleCancelBidding(project)}
              className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 font-semibold flex items-center gap-2"
            >
              <Ban className="w-4 h-4" />
              Cancel Bidding
            </button>
          )}
          
          {project.projectStatus === 'site-visit-completed' && !project.quote && (
            <button 
              onClick={() => handleJoinBidding(project)}
              className="px-4 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
            >
              Write Quote
            </button>
          )}
          
          {project.projectStatus === 'selected' && (
            <button className="px-4 py-2 bg-green-500 text-white rounded text-sm font-medium cursor-default">
              Customer contact info will be sent to your email.
            </button>
          )}
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
                <span className="font-light">Home</span>
              </button>
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-light transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                Profile Management
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'portfolio'
                    ? 'border-[#daa520] text-[#2c5f4e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Portfolio Management
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
                    <p className="text-sm text-gray-600 font-light mb-1">Bidding</p>
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
                    <p className="text-sm text-gray-600 font-light mb-1">Selected Projects</p>
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
                    <p className="text-sm text-gray-600 font-light mb-1">Submitted Quotes</p>
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
                  <p className="text-sm text-gray-600 font-light mb-1">Total Projects</p>
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
                  Project List ({filteredProjects.length})
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  ✅ Only projects you are participating in are shown
                </p>
              </div>
              
              {filteredProjects.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  {projects.length === 0 ? 'No projects you are participating in.' : 'No matching projects.'}
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
            console.log('❌ Closing modal')
            setShowQuoteModal(false)
            setSelectedProject(null)
          }}
          onSuccess={handleQuoteSubmitted}
        />
      )}
    </div>
  )
}
