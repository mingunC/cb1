'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createBrowserClient } from '@/lib/supabase/clients'
import { 
  ArrowLeft, RefreshCw, ChevronDown, ChevronUp, 
  Calendar, MapPin, User, Trophy, X, TrendingUp, 
  FileText, Ban, Settings, DollarSign, Home
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import PortfolioManager from '@/components/PortfolioManager'
import type { Project, ProjectStatus, ContractorData } from '@/types/contractor'
import QuoteModal from '@/components/contractor/QuoteModal'

interface Props {
  initialContractorData?: any
}

export default function ImprovedContractorDashboard({ initialContractorData }: Props) {
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  
  // 상태 관리
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [contractorData, setContractorData] = useState<ContractorData | null>(initialContractorData)
  const [projectFilter, setProjectFilter] = useState<ProjectStatus | 'all' | 'bidding'>('all')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'projects' | 'portfolio' | 'profile'>('projects')
  const [selectedContractorNames, setSelectedContractorNames] = useState<Record<string, string>>({})
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  
  // 프로젝트 카드 펼치기/접기
  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }
  
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
      
      if (process.env.NODE_ENV === 'development') console.log('Loading projects for contractor:', {
        contractorId: contractorData.id,
        companyName: contractorData.company_name
      })
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('quote_requests')
        .select('*, selected_contractor_id, selected_quote_id')
        .gte('created_at', contractorData.created_at)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (projectsError) {
        console.error('Projects fetch error:', projectsError)
        throw projectsError
      }
      
      if (process.env.NODE_ENV === 'development') console.log('Projects data loaded:', projectsData?.length, 'projects')
      
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
          
          // 프로젝트 상태 결정
          let projectStatus: ProjectStatus | 'bidding' = 'pending'
          
          const isMyQuoteSelected = selectedContractorId === contractorData.id
          const hasSelectedContractor = !!selectedContractorId
          
          if (project.status === 'bidding' || project.status === 'quote-submitted') {
            projectStatus = 'bidding'
          } else if (project.status === 'cancelled') {
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
          } else if (project.status === 'approved' || project.status === 'site_visit' || project.status === 'site-visit-pending') {
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
      
      if (process.env.NODE_ENV === 'development') console.log('Processed projects:', processedProjects.length)
      setProjects(processedProjects)
    } catch (err: any) {
      console.error('Failed to load projects:', err)
      setError(t('contractor.errors.loadFailed'))
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
    toast.success(t('contractor.dashboard.refreshed'))
  }
  
  // 현장방문 신청 함수 (API 호출)
  const handleApplySiteVisit = async (project: Project) => {
    if (!contractorData?.id) {
      toast.error(t('contractor.errors.noContractorInfo'))
      return
    }

    try {
      const loadingToast = toast.loading(t('contractor.messages.applying'))
      
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

      const result = await response.json()

      toast.dismiss(loadingToast)

      if (!response.ok) {
        if (response.status === 409) {
          toast.error(t('contractor.errors.alreadyApplied'))
        } else {
          toast.error(result.error || t('contractor.errors.applySiteVisitFailed'))
        }
        return
      }

      if (result.data?.emailSent) {
        toast.success(t('contractor.messages.appliedWithEmail'))
      } else {
        toast.success(t('contractor.messages.applied'))
      }
      
      await loadProjects() // 프로젝트 목록 새로고침
    } catch (error: any) {
      console.error('Site visit application error:', error)
      toast.error(t('contractor.errors.applySiteVisitFailed'))
    }
  }
  
  // 현장방문 취소 함수
  const handleCancelSiteVisit = async (project: Project) => {
    if (!project.site_visit_application) {
      toast.error(t('contractor.errors.noContractorInfo'))
      return
    }

    const confirmed = window.confirm(t('contractor.confirmations.cancelSiteVisit'))
    if (!confirmed) return

    try {
      const supabase = createBrowserClient()
      
      // is_cancelled를 true로 설정
      const { error } = await supabase
        .from('site_visit_applications')
        .update({ is_cancelled: true })
        .eq('id', project.site_visit_application.id)

      if (error) throw error

      toast.success(t('contractor.messages.cancelled'))
      await loadProjects() // 프로젝트 목록 새로고침
    } catch (error: any) {
      console.error('Cancel site visit error:', error)
      toast.error(t('contractor.errors.cancelSiteVisitFailed'))
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
    
    const confirmed = window.confirm(t('contractor.confirmations.cancelBidding'))
    if (!confirmed) return
    
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from('contractor_quotes')
        .delete()
        .eq('id', project.contractor_quote.id)
      
      if (error) throw error
      
      toast.success(t('contractor.messages.biddingCancelled'))
      await loadProjects()
    } catch (error) {
      console.error('Failed to cancel bidding:', error)
      toast.error(t('contractor.errors.cancelBiddingFailed'))
    }
  }
  
  // 견적서 제출 완료 핸들러
  const handleQuoteSubmitted = async () => {
    setShowQuoteModal(false)
    setSelectedProject(null)
    toast.success(t('contractor.messages.quoteSubmitted'))
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">{t('common.loading')}</p>
        </div>
      </div>
    )
  }
  
  // Accordion 스타일 프로젝트 카드
  const AccordionProjectCard = ({ project }: { project: Project }) => {
    const isExpanded = expandedProjects.has(project.id)
    
    const getStatusInfo = () => {
      const statusConfig: Record<ProjectStatus | 'bidding', { label: string; bgColor: string; textColor: string; icon?: any }> = {
        'pending': { label: t('contractor.projectStatus.pending'), bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
        'approved': { label: t('contractor.projectStatus.approved'), bgColor: 'bg-green-100', textColor: 'text-green-700' },
        'site-visit-applied': { label: t('contractor.projectStatus.siteVisitApplied'), bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
        'site-visit-completed': { label: t('contractor.projectStatus.siteVisitCompleted'), bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
        'bidding': { 
          label: project.contractor_quote ? t('contractor.projectStatus.biddingSubmitted') : t('contractor.projectStatus.bidding'), 
          bgColor: 'bg-gradient-to-r from-orange-500 to-orange-600',
          textColor: 'text-white',
          icon: TrendingUp
        },
        'quoted': { label: t('contractor.projectStatus.quoted'), bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
        'selected': { 
          label: t('contractor.projectStatus.selected'), 
          bgColor: 'bg-gradient-to-r from-green-500 to-green-600',
          textColor: 'text-white',
          icon: Trophy
        },
        'not-selected': { 
          label: selectedContractorNames[project.selected_contractor_id!] 
            ? `${selectedContractorNames[project.selected_contractor_id!]} ${t('contractor.projectStatus.selectedBy')}` 
            : t('contractor.projectStatus.notSelected'),
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          icon: X
        },
        'completed': { label: t('contractor.projectStatus.completed'), bgColor: 'bg-gray-400', textColor: 'text-white' },
        'cancelled': { label: t('contractor.projectStatus.cancelled'), bgColor: 'bg-gray-300', textColor: 'text-gray-600' }
      }
      
      return statusConfig[project.projectStatus || 'pending']
    }
    
    const statusInfo = getStatusInfo()
    const StatusIcon = statusInfo.icon
    
    // ✅ 현장방문 신청이 있어야만 견적 제출 가능 (프로젝트가 bidding이면 신청만 있으면 OK)
    const canSubmitQuote = !!project.site_visit_application && (project.site_visit_application.status === 'completed' || project.status === 'bidding')
    
    // 고객 이름 표시
    const getCustomerName = () => {
      if (!project.customer) return t('contractor.projectCard.noCustomer')
      const { first_name, last_name, email } = project.customer
      if (first_name || last_name) {
        return `${first_name || ''} ${last_name || ''}`.trim()
      }
      return email?.split('@')[0] || t('contractor.projectCard.noName')
    }
    
    // 프로젝트 타입 표시
    const getProjectTypeLabel = () => {
      if (project.project_types && project.project_types.length > 0) {
        return project.project_types.map(type => {
          // Convert snake_case to camelCase for translation keys
          const typeKey = type.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
          // Try to get translation from projectTypes
          try {
            const translationKey = `projectTypes.${typeKey}` as any
            const translated = t(translationKey)
            if (translated && translated !== translationKey) {
              return translated
            }
          } catch {}
          
          // Fallback to original type
          return type
        }).join(', ')
      }
      return t('projectTypes.fullRenovation') || 'Renovation'
    }
    
    // 공간 타입 표시
    const getSpaceTypeLabel = () => {
      // DB에 저장된 값(snake_case)을 번역 키(camelCase)로 변환
      const spaceTypeMap: Record<string, string> = {
        'detached_house': 'detachedHouse',
        'town_house': 'townHouse',
        'condo': 'condo',
        'condo_apartment': 'condoApartment',
        'semi_detached': 'semiDetached',
        'commercial': 'commercial',
        'apartment': 'apartment',
        'house': 'house'
      }
      
      const typeKey = spaceTypeMap[project.space_type] || project.space_type
      
      // 번역 시도
      try {
        const translationKey = `spaceTypes.${typeKey}` as any
        const translated = t(translationKey)
        if (translated && translated !== translationKey && !translated.startsWith('spaceTypes.')) {
          return translated
        }
      } catch {}
      
      // Fallback labels (영어)
      const fallbackLabels: Record<string, string> = {
        'detached_house': 'Detached House',
        'town_house': 'Town House',
        'condo': 'Condo',
        'semi_detached': 'Semi-Detached',
        'commercial': 'Commercial'
      }
      
      return fallbackLabels[project.space_type] || 'House'
    }
    
    // 예산 표시
    const getBudgetLabel = () => {
      const budget = project.budget
      
      // Map budget keys to translation keys
      const budgetMap: Record<string, string> = {
        'under_50k': 'budget.under50k',
        '50k_100k': 'budget.50kTo100k',
        'over_100k': 'budget.over100k',
        '100k_200k': 'budget.50kTo100k', // Fallback
        '200k_500k': 'budget.50kTo100k', // Fallback
        'over_500k': 'budget.over100k' // Fallback
      }
      
      if (budget && budgetMap[budget]) {
        try {
          const translated = t(budgetMap[budget] as any)
          if (translated && translated !== budgetMap[budget]) {
            return translated
          }
        } catch {}
      }
      
      // Fallback labels
      const budgetLabels: Record<string, string> = {
        'under_50k': 'Under $50,000',
        '50k_100k': '$50,000 - $100,000',
        'over_100k': '$100,000+',
        '100k_200k': '$100,000 - $200,000',
        '200k_500k': '$200,000 - $500,000',
        'over_500k': '$500,000+'
      }
      
      if (budget && budgetLabels[budget]) return budgetLabels[budget]
      if (typeof budget === 'number') return `$${budget.toLocaleString()}`
      return t('contractor.projectCard.tbd')
    }
    
    // 날짜 포맷 - locale에 따라 다른 형식 사용
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return t('contractor.projectCard.tbd')
      try {
        const date = new Date(dateStr)
        // locale에 따른 날짜 형식 매핑
        const localeMap: Record<string, string> = {
          'ko': 'ko-KR',
          'en': 'en-US',
          'zh': 'zh-CN'
        }
        const dateLocale = localeMap[locale] || 'en-US'
        
        return date.toLocaleDateString(dateLocale, { 
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
      return t('contractor.projectCard.tbd')
    }
    
    // 카드 테두리 색상
    const getBorderStyle = () => {
      if (project.projectStatus === 'selected') return 'border-l-4 border-l-green-500 shadow-md hover:shadow-lg'
      if (project.projectStatus === 'not-selected') return 'border-l-4 border-l-red-400 shadow-sm'
      if (project.projectStatus === 'bidding') return 'border-l-4 border-l-orange-500 shadow-md hover:shadow-lg'
      return 'border-l-4 border-l-gray-300 shadow-sm hover:shadow-md'
    }
    
    return (
      <div className={`bg-white rounded-lg ${getBorderStyle()} transition-all duration-200 overflow-hidden`}>
        {/* 항상 보이는 헤더 부분 - 예산과 장소만 */}
        <div 
          className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleProjectExpanded(project.id)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* 상태 배지 */}
              <div className="mb-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                  {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                  {statusInfo.label}
                </span>
              </div>
              
              {/* 예산과 장소 - 큰 폰트 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>{getBudgetLabel()}</span>
                </div>
                <div className="flex items-start gap-2 text-base text-gray-700">
                  <MapPin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                  <span className="line-clamp-1">{project.full_address || project.postal_code || t('contractor.projectCard.noAddress')}</span>
                </div>
              </div>
            </div>
            
            {/* 펼치기/접기 아이콘 */}
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        
        {/* 펼쳐지는 상세 정보 */}
        {isExpanded && (
          <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50">
            <div className="space-y-4">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Home className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{getSpaceTypeLabel()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{getCustomerName()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{t('contractor.projectCard.visitDate')}: {getVisitDate()}</span>
                </div>
                <div className="flex items-start gap-2 text-gray-700">
                  <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                  <span>{getProjectTypeLabel()}</span>
                </div>
              </div>
              
              {/* 요구사항 */}
              {project.description && (
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1 font-medium">{t('contractor.projectCard.requirements')}:</p>
                  <p className="text-sm text-gray-700">
                    {project.description}
                  </p>
                </div>
              )}
              
              {/* 견적 정보 */}
              {project.contractor_quote && (
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <p className="text-sm font-semibold text-purple-900">
                    {t('contractor.projectCard.myQuote')}: ${project.contractor_quote.price?.toLocaleString()}
                  </p>
                  {project.contractor_quote.description && (
                    <p className="text-xs text-purple-700 mt-1">
                      {project.contractor_quote.description}
                    </p>
                  )}
                </div>
              )}
              
              {/* 입찰 중 상태 강조 */}
              {project.projectStatus === 'bidding' && (
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-300">
                  <p className="text-sm font-bold text-orange-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {project.contractor_quote 
                      ? t('contractor.messages.biddingSubmitted') 
                      : t('contractor.messages.biddingActive')}
                  </p>
                </div>
              )}
              
              {/* 선정 상태 */}
              {project.projectStatus === 'selected' && (
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-300">
                  <p className="text-sm font-bold text-green-700 flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    {t('contractor.messages.congratulations')}
                  </p>
                </div>
              )}
              
              {project.projectStatus === 'not-selected' && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700">
                    {t('contractor.messages.notSelectedMessage')} <span className="font-bold">
                      {selectedContractorNames[project.selected_contractor_id!] || t('contractor.projectStatus.notSelected')}
                    </span>
                  </p>
                </div>
              )}
              
              {/* 액션 버튼 */}
              <div className="flex gap-2 flex-wrap pt-2">
                {/* 승인된 프로젝트: 현장방문 신청/취소 버튼 */}
                {project.projectStatus === 'approved' && (
                  <>
                    {!project.site_visit_application ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApplySiteVisit(project)
                        }}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        {t('contractor.actions.applySiteVisit')}
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancelSiteVisit(project)
                        }}
                        className="px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        {t('contractor.actions.cancelSiteVisit')}
                      </button>
                    )}
                  </>
                )}
                
                {/* 현장방문 신청 상태: 취소 버튼 */}
                {project.projectStatus === 'site-visit-applied' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCancelSiteVisit(project)
                    }}
                    className="px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    {t('contractor.actions.cancelSiteVisit')}
                  </button>
                )}
                
                {project.projectStatus === 'bidding' && !project.contractor_quote && (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleJoinBidding(project)}
                      disabled={!canSubmitQuote}
                      className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                        canSubmitQuote
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      {t('contractor.actions.joinBidding')}
                    </button>
                    {!canSubmitQuote && (
                      <p className="text-xs text-red-500">
                        {t('contractor.messages.siteVisitRequired')}
                      </p>
                    )}
                  </div>
                )}
                
                {project.projectStatus === 'bidding' && project.contractor_quote && (
                  <button 
                    onClick={() => handleCancelBidding(project)}
                    className="px-5 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    {t('contractor.actions.cancelBidding')}
                  </button>
                )}
                
                {project.projectStatus === 'site-visit-completed' && 
                 project.status !== 'bidding' && 
                 project.status !== 'quote-submitted' &&
                 !project.contractor_quote && (
                  <button 
                    onClick={() => handleJoinBidding(project)}
                    className="px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    {t('contractor.actions.submitQuote')}
                  </button>
                )}
                
                {project.projectStatus === 'selected' && (
                  <div className="w-full px-4 py-3 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                    {t('contractor.actions.customerInfoSent')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/${locale}`)}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="font-medium">{t('contractor.dashboard.backToHome')}</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900">
                {contractorData?.company_name || t('contractor.dashboard.title')}
              </h1>
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium text-blue-700 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('contractor.dashboard.refresh')}
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 with 통합된 필터 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex px-6">
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('contractor.tabs.projects')}
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`py-4 px-1 ml-8 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'portfolio'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('contractor.tabs.portfolio')}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 ml-8 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="w-4 h-4" />
                {t('contractor.tabs.profile')}
              </button>
            </nav>
          </div>
          
          {/* 통합된 필터 탭 - 프로젝트 탭에서만 표시 */}
          {activeTab === 'projects' && (
            <div className="px-6 py-4 bg-gray-50">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setProjectFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    projectFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t('contractor.filters.all')} <span className="ml-1.5 font-bold">({statusCounts['all']})</span>
                </button>
                
                {statusCounts['bidding'] > 0 && (
                  <button
                    onClick={() => setProjectFilter('bidding')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      projectFilter === 'bidding'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                        : 'bg-white text-orange-600 hover:bg-orange-50 border border-orange-300'
                    }`}
                  >
                    🔥 {t('contractor.filters.bidding')} <span className="ml-1.5">({statusCounts['bidding']})</span>
                  </button>
                )}
                
                {statusCounts['selected'] > 0 && (
                  <button
                    onClick={() => setProjectFilter('selected')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      projectFilter === 'selected'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                        : 'bg-white text-green-600 hover:bg-green-50 border border-green-300'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5 inline mr-1" />
                    {t('contractor.filters.selected')} <span className="ml-1.5">({statusCounts['selected']})</span>
                  </button>
                )}
                
                {statusCounts['quoted'] > 0 && (
                  <button
                    onClick={() => setProjectFilter('quoted')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      projectFilter === 'quoted'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-purple-600 hover:bg-purple-50 border border-purple-300'
                    }`}
                  >
                    {t('contractor.filters.quoted')} <span className="ml-1.5 font-bold">({statusCounts['quoted']})</span>
                  </button>
                )}
                
                {statusCounts['not-selected'] > 0 && (
                  <button
                    onClick={() => setProjectFilter('not-selected')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      projectFilter === 'not-selected'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-white text-red-600 hover:bg-red-50 border border-red-300'
                    }`}
                  >
                    {t('contractor.filters.notSelected')} <span className="ml-1.5 font-bold">({statusCounts['not-selected']})</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* 콘텐츠 영역 */}
        {activeTab === 'projects' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-lg font-bold text-gray-900">
                {t('contractor.projectList.title')} 
                <span className="ml-2 text-blue-600">({filteredProjects.length}{t('contractor.projectList.count')})</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {t('contractor.projectList.clickForDetails')}
              </p>
            </div>
            
            {filteredProjects.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="text-gray-400 mb-3">
                  <FileText className="w-16 h-16 mx-auto" />
                </div>
                <p className="text-gray-500 text-lg font-medium">{t('contractor.projectList.noProjects')}</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  {filteredProjects.map((project) => (
                    <AccordionProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'portfolio' && contractorData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <PortfolioManager 
                contractorId={contractorData.id}
                onPortfolioUpdate={() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Portfolio updated')
                  }
                }}
              />
            </div>
          </div>
        )}
        
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('contractor.profile.title')}</h2>
              <p className="text-gray-600 mb-8">
                {t('contractor.profile.description')}
              </p>
              <button
                onClick={() => router.push(`/${locale}/contractor/profile`)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <Settings className="w-5 h-5" />
                {t('contractor.profile.editProfile')}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 견적서 작성 모달 */}
      <QuoteModal
        isOpen={showQuoteModal}
        mode="create"
        project={selectedProject}
        contractorId={contractorData?.id || ''}
        onClose={() => {
          setShowQuoteModal(false)
          setSelectedProject(null)
        }}
        onSuccess={handleQuoteSubmitted}
      />
    </div>
  )
}
