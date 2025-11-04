'use client'

import { useState, useEffect, useCallback, useMemo, Fragment, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, RefreshCw, Eye, CheckCircle, XCircle, Calendar, MapPin, User, Trophy, X, UserCircle, Briefcase, TrendingUp, FileText, Ban, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import PortfolioManager from '@/components/PortfolioManager'
import type { Project, ProjectStatus, ContractorData } from '@/types/contractor'
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
  const [contractorData] = useState<ContractorData | null>(initialContractorData)
  const [projectFilter, setProjectFilter] = useState<ProjectStatus | 'all' | 'bidding' | 'failed-bid'>('all')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'projects' | 'profile' | 'portfolio'>('projects')
  const [selectedContractorNames, setSelectedContractorNames] = useState<Record<string, string>>({})
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  
  // ✅ ref를 사용해서 loadProjects 중복 실행 방지
  const loadProjectsRef = useRef(false)
  
  // ✅ 선택된 업체 이름들을 미리 로드 - useCallback으로 메모이제이션
  const loadSelectedContractorNames = useCallback(async (contractorIds: string[]) => {
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
  }, []) // ✅ 빈 배열 - 한 번만 생성
  
  // ✅ 프로젝트 데이터 로드 함수 - useCallback으로 안정화
  const loadProjects = useCallback(async () => {
    if (!contractorData || !contractorData.id) {
      console.error('No contractor data available')
      return
    }
    
    // ✅ 중복 실행 방지
    if (loadProjectsRef.current) {
      console.log('⏭️ loadProjects already running, skipping...')
      return
    }
    loadProjectsRef.current = true
    
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
      const processedProjects = allProjectsData?.map((project) => {
        const customer = customersMap[project.customer_id]
        const siteVisit = siteVisitMap.get(project.id)
        const quote = quotesMap.get(project.id)
        
        // 프로젝트 상태 계산
        const isSelected = project.selected_contractor_id === contractorData.id
        const hasOtherSelected = project.selected_contractor_id && project.selected_contractor_id !== contractorData.id
        const hasSiteVisit = !!siteVisit
        const hasSiteVisitCompleted = siteVisit?.status === 'completed'
        const hasQuote = !!quote
        
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
      
      setProjects(processedProjects)
      setSelectedContractorNames(contractorNames)
      console.log('🎉 Projects state updated successfully!')
      
    } catch (error) {
      console.error('❌ Error loading projects:', error)
      setError('Error loading projects.')
    } finally {
      setIsLoading(false)
      loadProjectsRef.current = false // ✅ 작업 완료 플래그 해제
      console.log('🏁 loadProjects finished')
    }
  }, [contractorData, loadSelectedContractorNames]) // ✅ 안정적인 의존성만 포함
  
  // ✅ 초기 데이터 로드 - 한 번만 실행
  useEffect(() => {
    console.log('🔄 Dashboard mounted, loading projects...')
    if (contractorData && contractorData.id) {
      loadProjects()
    }
  }, []) // ✅ 빈 배열 - 마운트 시 한 번만!
  
  const refreshData = async () => {
    setIsRefreshing(true)
    loadProjectsRef.current = false // ✅ 수동 새로고침 시 플래그 리셋
    await loadProjects()
    setIsRefreshing(false)
    toast.success('Data refreshed')
  }

  // ✅ 현장방문 신청 함수 - API 호출 버전
  const handleSiteVisitApplication = async (project: Project) => {
    console.log('🚀 Apply Site Visit clicked!', {
      projectId: project.id,
      contractorId: contractorData?.id
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

      if (!response.ok) {
        // 실패 시 원래 상태로 되돌림
        loadProjectsRef.current = false
        await loadProjects()
        throw new Error(data.error || 'Failed to apply for site visit')
      }

      console.log('✅ Site visit applied successfully!')
      toast.success('Site visit application submitted!', {
        duration: 3000
      })
      
      // 백그라운드에서 데이터 새로고침
      setTimeout(() => {
        loadProjectsRef.current = false
        loadProjects()
      }, 1000)
      
    } catch (error: any) {
      console.error('💥 Error applying for site visit:', error)
      toast.error(error.message || 'Failed to apply for site visit')
      
      // 에러 발생 시 데이터 다시 로드
      loadProjectsRef.current = false
      await loadProjects()
    }
  }
  
  // 입찰 참여 함수
  const handleJoinBidding = (project: Project) => {
    console.log('🎯 Join bidding button clicked!', { projectId: project.id })
    
    setSelectedProject(project)
    setShowQuoteModal(true)
    
    toast.success('Opening quote modal...')
  }
  
  // 입찰 취소 함수
  const handleCancelBidding = async (project: Project) => {
    console.log('🚫 Cancel bidding attempt:', { projectId: project.id, quote: project.quote })
    
    if (!project.quote) {
      console.error('❌ Quote information not found')
      toast.error('Quote information not found')
      return
    }
    
    const quoteId = project.quote.id || project.quote.quote_id
    if (!quoteId) {
      console.error('❌ Quote ID not found')
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
      loadProjectsRef.current = false
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
    loadProjectsRef.current = false
    await loadProjects()
  }
  
  // 필터링된 프로젝트
  const filteredProjects = useMemo(() => {
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
    
    return counts
  }, [projects])
  
  if (isLoading && !projects.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }
  
  // 프로젝트 카드 컴포넌트는 기존과 동일...
  const SimpleProjectCard = ({ project }: { project: Project }) => {
    // ... (기존 코드와 동일하므로 생략)
    return <div>Project Card</div>
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
      
      {/* 메인 콘텐츠 - 기존 코드와 동일 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ... 나머지 UI 코드 ... */}
        <div className="text-center py-12">
          <p className="text-gray-600">Dashboard content loading...</p>
          <p className="text-sm text-gray-500 mt-2">
            Total projects: {projects.length}
          </p>
        </div>
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
