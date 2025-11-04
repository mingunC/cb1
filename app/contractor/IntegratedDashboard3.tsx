'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, RefreshCw, Eye, CheckCircle, XCircle, Calendar, MapPin, User, Trophy, X, TrendingUp, FileText, Ban, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import PortfolioManager from '@/components/PortfolioManager'
import type { Project, ProjectStatus, ContractorData } from '@/types/contractor'
import QuoteModal from '@/components/contractor/QuoteModal'
import ProjectCard from '@/components/contractor/ProjectCard'

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
      
      console.log('🚀 Loading projects for contractor:', contractorData.id)
      
      // Step 1: 모든 프로젝트 가져오기
      const { data: allProjectsData, error: projectsError } = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (projectsError) throw projectsError
      
      // Step 2: 업체 참여 정보
      const [siteVisitsResponse, quotesResponse] = await Promise.all([
        supabase
          .from('site_visit_applications')
          .select('project_id, status, applied_at')
          .eq('contractor_id', contractorData.id),
        supabase
          .from('contractor_quotes')
          .select('id, project_id, price, status, created_at')
          .eq('contractor_id', contractorData.id)
      ])
      
      const siteVisitMap = new Map()
      siteVisitsResponse.data?.forEach(item => {
        siteVisitMap.set(item.project_id, item)
      })
      
      const quotesMap = new Map()
      quotesResponse.data?.forEach(item => {
        quotesMap.set(item.project_id, item)
      })
      
      // Step 3: 고객 정보
      const customerIds = [...new Set(allProjectsData?.map(p => p.customer_id).filter(Boolean) || [])]
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
      
      // Step 4: 선택된 업체 이름
      const selectedContractorIds = new Set<string>()
      allProjectsData?.forEach(project => {
        if (project.selected_contractor_id) {
          selectedContractorIds.add(project.selected_contractor_id)
        }
      })
      
      let contractorNames: Record<string, string> = {}
      if (selectedContractorIds.size > 0) {
        const { data } = await supabase
          .from('contractors')
          .select('id, company_name')
          .in('id', Array.from(selectedContractorIds))
        
        data?.forEach(contractor => {
          contractorNames[contractor.id] = contractor.company_name
        })
      }
      
      // Step 5: 프로젝트 처리
      const processedProjects = allProjectsData?.map((project) => {
        const customer = customersMap[project.customer_id]
        const siteVisit = siteVisitMap.get(project.id)
        const quote = quotesMap.get(project.id)
        
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
      
      setProjects(processedProjects)
      setSelectedContractorNames(contractorNames)
      console.log('🎉 Projects loaded:', processedProjects.length)
      
    } catch (error) {
      console.error('❌ Error loading projects:', error)
      setError('Error loading projects.')
    } finally {
      setIsLoading(false)
      loadProjectsRef.current = false
    }
  }, [contractorData])
  
  // ✅ 초기 데이터 로드 - 한 번만 실행
  useEffect(() => {
    console.log('🔄 Dashboard mounted')
    if (contractorData?.id) {
      loadProjects()
    }
  }, []) // ✅ 빈 배열!
  
  const refreshData = async () => {
    setIsRefreshing(true)
    loadProjectsRef.current = false
    await loadProjects()
    setIsRefreshing(false)
    toast.success('Data refreshed')
  }

  const handleSiteVisitApplication = async (projectId: string) => {
    if (!contractorData?.id) {
      toast.error('Contractor information not found')
      return
    }

    const updatedProjects = projects.map(p => 
      p.id === projectId 
        ? { 
            ...p, 
            projectStatus: 'site-visit-applied' as ProjectStatus,
            siteVisit: { status: 'pending', applied_at: new Date().toISOString() } 
          }
        : p
    )
    setProjects(updatedProjects)
    toast.success('Applying for site visit...')

    try {
      const response = await fetch('/api/apply-site-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId,
          contractorId: contractorData.id
        })
      })

      const data = await response.json()
      if (!response.ok) {
        loadProjectsRef.current = false
        await loadProjects()
        throw new Error(data.error || 'Failed')
      }

      toast.success('Site visit applied!')
      setTimeout(() => {
        loadProjectsRef.current = false
        loadProjects()
      }, 1000)
      
    } catch (error: any) {
      toast.error(error.message)
      loadProjectsRef.current = false
      await loadProjects()
    }
  }
  
  const handleSiteVisitCancellation = async (applicationId: string, projectId: string) => {
    const confirmed = window.confirm('Cancel site visit application?')
    if (!confirmed) return
    
    try {
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Login required')
        return
      }

      const { error: svaError } = await supabase
        .from('site_visit_applications')
        .update({
          is_cancelled: true,
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id
        })
        .eq('id', applicationId)

      if (svaError) throw svaError

      toast.success('Site visit cancelled')
      loadProjectsRef.current = false
      await loadProjects()
    } catch (error) {
      toast.error('Failed to cancel')
    }
  }
  
  const handleJoinBidding = (project: Project) => {
    setSelectedProject(project)
    setShowQuoteModal(true)
  }
  
  const handleCancelBidding = async (project: Project) => {
    if (!project.quote) {
      toast.error('Quote not found')
      return
    }
    
    const quoteId = project.quote.id || project.quote.quote_id
    if (!quoteId) {
      toast.error('Quote ID not found')
      return
    }
    
    const confirmed = window.confirm('Cancel bidding?')
    if (!confirmed) return
    
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from('contractor_quotes')
        .delete()
        .eq('id', quoteId)
      
      if (error) throw error
      
      toast.success('Bidding cancelled')
      loadProjectsRef.current = false
      await loadProjects()
    } catch (error) {
      toast.error('Failed to cancel')
    }
  }
  
  const handleQuoteSubmitted = async () => {
    setShowQuoteModal(false)
    setSelectedProject(null)
    loadProjectsRef.current = false
    await loadProjects()
  }

  const openQuoteViewModal = (project: Project) => {
    setSelectedProject(project)
    setShowQuoteModal(true)
  }
  
  const filteredProjects = useMemo(() => {
    if (projectFilter === 'all') return projects
    if (projectFilter === 'bidding') return projects.filter(p => p.projectStatus === 'bidding')
    if (projectFilter === 'failed-bid') return projects.filter(p => p.projectStatus === 'failed-bid')
    return projects.filter(p => p.projectStatus === projectFilter)
  }, [projects, projectFilter])
  
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
      if (p.projectStatus) counts[p.projectStatus]++
    })
    
    return counts
  }, [projects])
  
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] to-[#f0ebe0]">
      {/* 헤더 */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-[#daa520]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 py-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 hover:text-[#2c5f4e] transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="font-light">Home</span>
            </button>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm"
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
                    : 'border-transparent text-gray-500'
                }`}
              >
                My Projects
              </button>
              <button
                onClick={() => router.push('/contractor/profile')}
                className="py-4 px-1 border-b-2 border-transparent text-gray-500 font-medium text-sm"
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'portfolio'
                    ? 'border-[#daa520] text-[#2c5f4e]'
                    : 'border-transparent text-gray-500'
                }`}
              >
                Portfolio
              </button>
            </nav>
          </div>
        </div>
        
        {/* 통합 통계 및 필터 */}
        {activeTab === 'projects' && (
          <>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-[#daa520]/20 mb-6 overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-gray-200">
                <button
                  onClick={() => setProjectFilter('bidding')}
                  className={`p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors border-r border-gray-200 ${
                    projectFilter === 'bidding' ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <span className="text-2xl sm:text-3xl font-serif font-light text-[#2c5f4e]">
                      {statusCounts['bidding']}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-light">Bidding</p>
                </button>

                <button
                  onClick={() => setProjectFilter('selected')}
                  className={`p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors border-r border-gray-200 md:border-r-0 ${
                    projectFilter === 'selected' ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Trophy className="w-5 h-5 text-green-600" />
                    <span className="text-2xl sm:text-3xl font-serif font-light text-green-600">
                      {statusCounts['selected']}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-light">Selected</p>
                </button>

                <button
                  onClick={() => setProjectFilter('all')}
                  className={`p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors border-r border-t border-gray-200 md:border-t-0 md:border-r ${
                    projectFilter === 'all' ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-2xl sm:text-3xl font-serif font-light text-[#2c5f4e]">
                      {statusCounts['all']}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-light">Total</p>
                </button>

                <button
                  onClick={() => setProjectFilter('approved')}
                  className={`p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors border-t border-gray-200 md:border-t-0 ${
                    projectFilter === 'approved' ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-2xl sm:text-3xl font-serif font-light text-purple-600">
                      {statusCounts['approved']}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-light">Approved</p>
                </button>
              </div>

              <div className="p-3 sm:p-4 bg-gray-50 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                  {statusCounts['site-visit-applied'] > 0 && (
                    <button
                      onClick={() => setProjectFilter('site-visit-applied')}
                      className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        projectFilter === 'site-visit-applied'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Site Visit Applied ({statusCounts['site-visit-applied']})
                    </button>
                  )}
                  {statusCounts['quoted'] > 0 && (
                    <button
                      onClick={() => setProjectFilter('quoted')}
                      className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        projectFilter === 'quoted'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Quote Submitted ({statusCounts['quoted']})
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Project List ({filteredProjects.length})
                </h3>
              </div>
              
              {filteredProjects.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  No projects found
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        contractorId={contractorData?.id || ''}
                        onSiteVisitApply={handleSiteVisitApplication}
                        onSiteVisitCancel={handleSiteVisitCancellation}
                        onQuoteCreate={handleJoinBidding}
                        onQuoteView={openQuoteViewModal}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
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
      
      {showQuoteModal && selectedProject && contractorData?.id && (
        <QuoteModal
          isOpen={showQuoteModal}
          mode="create"
          project={selectedProject}
          contractorId={contractorData.id}
          onClose={() => {
            setShowQuoteModal(false)
            setSelectedProject(null)
          }}
          onSuccess={handleQuoteSubmitted}
        />
      )}
    </div>
  )
}
