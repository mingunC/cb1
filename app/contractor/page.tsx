'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { ArrowLeft, Eye, DollarSign, FileText, Upload, Calendar, MapPin, Clock, CheckCircle, XCircle, Image, Plus, Minus, RefreshCw, X, ChevronDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import PortfolioManager from '@/components/PortfolioManager'
import type { Project, ProjectStatus, ContractorData, QuoteModalProps } from '@/types/contractor'
import { 
  getProjectTypeInfo,
  getSpaceTypeInfo,
  formatPrice,
  isSiteVisitMissed,
  calculateProjectStatus,
  canApplySiteVisit,
  formatDate,
  getVisitDate
} from '@/lib/contractor/projectHelpers'
import StatusBadge from '@/components/contractor/StatusBadge'
import ProjectFilters from '@/components/contractor/ProjectFilters'
import ProjectCard from '@/components/contractor/ProjectCard'
import QuoteModal from '@/components/contractor/QuoteModal'
import { 
  fetchProjects, 
  applySiteVisit, 
  cancelSiteVisit, 
  getContractorInfo, 
  loadInitialProjects 
} from '@/lib/api/contractor'
import { 
  useProjectsData, 
  useInfiniteScroll, 
  useProjectFilter 
} from '@/hooks/useContractor'

export default function IntegratedContractorDashboard() {
  const router = useRouter()
  
  // 상태 관리
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [contractorData, setContractorData] = useState<ContractorData | null>(null)
  const [projectFilter, setProjectFilter] = useState<ProjectStatus | 'all'>('all')
  const [error, setError] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [itemsPerPage] = useState(9)
  const [activeTab, setActiveTab] = useState<'projects' | 'portfolio'>('projects')
  const [quoteModal, setQuoteModal] = useState<{
    isOpen: boolean
    projectId: string | null
    mode: 'create' | 'view'
    project: Project | null
  }>({
    isOpen: false,
    projectId: null,
    mode: 'create',
    project: null
  })

  // 무한 스크롤을 위한 데이터 페칭 함수
  const fetchProjectsData = useCallback(async (contractorId: string, offset: number = 0, isLoadMore: boolean = false) => {
    try {
      if (!isLoadMore) {
        setError(null)
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      
      const supabase = createBrowserClient()
      
      // 모든 프로젝트 조회 (명시적 외래키 지정)
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
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1)

      if (projectsError) throw projectsError

      // 프로젝트별로 업체와의 관계 데이터 필터링 및 상태 계산
      const processedProjects: Project[] = (projectsData || []).map(project => {
        // 현재 업체의 현장방문 신청 찾기 (취소되지 않은 활성 신청, legacy ID도 확인)
        const mySiteVisit = project.site_visit_applications?.find(
          (app: any) => (app.contractor_id === contractorId || 
                        app.contractor_id === '58ead562-2045-4d14-8522-53728f72537e') && 
                       !app.is_cancelled
        );
        
        // 현재 업체의 가장 최근 신청 (취소 여부 관계없이, legacy ID도 확인)
        const myLatestSiteVisit = project.site_visit_applications?.find(
          (app: any) => app.contractor_id === contractorId || 
                        app.contractor_id === '58ead562-2045-4d14-8522-53728f72537e'
        );
        
        // 현재 업체의 견적서 찾기 (legacy ID도 확인)
        const myQuote = project.contractor_quotes?.find(
          (quote: any) => quote.contractor_id === contractorId || 
                          quote.contractor_id === '58ead562-2045-4d14-8522-53728f72537e'
        );
        
        // micks1 사용자의 견적서가 있는 프로젝트인지 확인하고 로그 출력 (legacy contractor ID도 확인)
        if (project.contractor_quotes?.some((quote: any) => 
            quote.contractor_id === contractorId || 
            quote.contractor_id === '58ead562-2045-4d14-8522-53728f72537e')) {
          console.log('💡 내가 견적서를 제출한 프로젝트 발견:', {
            projectId: project.id,
            projectStatus: project.status,
            myQuote,
            contractorId,
            legacyIdFound: project.contractor_quotes?.some((quote: any) => 
              quote.contractor_id === '58ead562-2045-4d14-8522-53728f72537e')
          });
        }
        
        // 프로젝트 상태 계산
        const calculatedStatus = calculateProjectStatus({
          ...project,
          site_visit_application: myLatestSiteVisit,
          contractor_quote: myQuote
        }, contractorId);
        
        const processedProject: Project = {
          ...project,
          site_visit_application: myLatestSiteVisit,
          contractor_quote: myQuote,
          site_visit_applications: project.site_visit_applications,
          projectStatus: calculatedStatus
        };
        
        return processedProject;
      });
      
      // 무한 스크롤을 위한 데이터 처리
      const relevantProjects = processedProjects
      
      if (isLoadMore) {
        setProjects(prev => [...prev, ...relevantProjects])
        setCurrentOffset(prev => prev + itemsPerPage)
      } else {
        setProjects(relevantProjects)
        setCurrentOffset(itemsPerPage)
      }
      
      // 더 이상 로드할 데이터가 없는지 확인
      const hasMoreData = relevantProjects.length === itemsPerPage
      
      if (relevantProjects.length === 0) {
        setHasMore(false)
      } else {
        setHasMore(hasMoreData)
      }
      
      if (!hasMoreData) {
        setIsLoadingMore(false)
      }
      
    } catch (error) {
      console.error('프로젝트 데이터 로드 실패:', error)
      setError('프로젝트 데이터를 불러오는데 실패했습니다.')
      toast.error('데이터 로드 실패')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [itemsPerPage])

  // 인증 체크 및 초기 데이터 로드
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🔍 Contractor dashboard initializing...')
        setIsLoading(true)
        const supabase = createBrowserClient()
        
        // 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('📋 Session check:', { 
          hasSession: !!session, 
          userId: session?.user?.id,
          email: session?.user?.email,
          error: sessionError 
        })
        
        if (sessionError || !session) {
          console.log('❌ No session found, redirecting to login')
          router.push('/contractor-login')
          return
        }

        console.log('세션 확인됨:', session.user.email)

        // 업체 정보 확인
        const { data: contractorInfo, error: contractorError } = await supabase
          .from('contractors')
          .select('id, company_name, contact_name, status')
          .eq('user_id', session.user.id)
          .single()

        console.log('🏢 Contractor info:', { 
          found: !!contractorInfo, 
          data: contractorInfo,
          error: contractorError 
        })

        if (contractorError || !contractorInfo) {
          console.error('❌ No contractor info found:', contractorError)
          toast.error('업체 권한이 필요합니다')
          router.push('/contractor-signup')
          return
        }

        // 업체 상태 확인
        if (contractorInfo.status !== 'active') {
          console.error('⚠️ Contractor not active:', contractorInfo.status)
          toast.error('업체 계정이 비활성화되어 있습니다. 관리자에게 문의해주세요.')
          router.push('/')
          return
        }
        
        console.log('✅ Contractor authenticated:', contractorInfo.company_name)
        setContractorData(contractorInfo)
        
        // 초기 데이터 로드
        await fetchProjectsData(contractorInfo.id, 0, false)
        
      } catch (error) {
        console.error('🔥 Initialization error:', error)
        toast.error('시스템 오류가 발생했습니다')
        router.push('/contractor-login')
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()

    // 인증 상태 변경 리스너 추가
    const supabase = createBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('인증 상태 변경:', event, session?.user?.email)
        
        if (event === 'SIGNED_OUT') {
          // 로그아웃 시 로그인 페이지로 이동
          router.push('/contractor-login')
        } else if (event === 'SIGNED_IN' && session) {
          // 로그인 시 페이지 새로고침 (데이터 재로드)
          window.location.reload()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, fetchProjectsData])

  // 새로고침 함수
  const refreshData = useCallback(async () => {
    if (!contractorData) return
    
    setIsRefreshing(true)
    setCurrentOffset(0)
    setHasMore(true)
    
    try {
      await fetchProjectsData(contractorData.id, 0, false)
    } finally {
      setIsRefreshing(false)
      toast.success('데이터를 새로고침했습니다')
    }
  }, [contractorData, fetchProjectsData])

  // 무한 스크롤을 위한 추가 데이터 로드 함수
  const loadMoreProjects = useCallback(async () => {
    if (!contractorData || isLoadingMore || !hasMore) {
      return
    }
    
    await fetchProjectsData(contractorData.id, currentOffset, true)
  }, [contractorData, isLoadingMore, hasMore, currentOffset, fetchProjectsData])

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(() => {
    const scrollTop = document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.offsetHeight
    
    const isNearBottom = scrollTop + windowHeight >= documentHeight - 1000
    
    if (isNearBottom && !isLoadingMore && hasMore) {
      loadMoreProjects()
    }
  }, [loadMoreProjects, isLoadingMore, hasMore])

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // 필터 변경 시 데이터 리셋
  const handleFilterChange = useCallback((filter: ProjectStatus | 'all') => {
    setProjectFilter(filter)
    setCurrentOffset(0)
    setHasMore(true)
    if (contractorData) {
      fetchProjectsData(contractorData.id, 0, false)
    }
  }, [contractorData, fetchProjectsData])

  // 현장방문 신청 핸들러
  const handleSiteVisitApplication = useCallback(async (quoteRequestId: string) => {
    if (!confirm('현장방문을 신청하시겠습니까?')) return

    try {
      const supabase = createBrowserClient()
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      const { data: contractor, error: contractorError } = await supabase
        .from('contractors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (contractorError || !contractor) {
        console.error('Contractor 정보 조회 오류:', contractorError);
        toast.error('Contractor 등록이 필요합니다.');
        return;
      }

      const { data: existingApplication, error: checkError } = await supabase
        .from('site_visit_applications')
        .select('*')
        .eq('project_id', quoteRequestId)
        .eq('contractor_id', contractor.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('중복 체크 오류:', checkError);
        throw checkError;
      }

      // 취소된 신청이 있으면 재활성화
      if (existingApplication && existingApplication.is_cancelled) {
        const { data: reactivated, error: updateError } = await supabase
          .from('site_visit_applications')
          .update({
            is_cancelled: false,
            cancelled_at: null,
            cancelled_by: null,
            status: 'pending',
            applied_at: new Date().toISOString()
          })
          .eq('id', existingApplication.id)
          .select()
          .single();

        if (updateError) {
          console.error('재활성화 오류:', updateError);
          throw updateError;
        }

        toast.success('방문 신청이 다시 활성화되었습니다!');
        await refreshData();
        return;
      }

      // 활성 신청이 이미 있는 경우
      if (existingApplication && !existingApplication.is_cancelled) {
        toast.error('이미 이 프로젝트에 방문 신청을 하셨습니다.');
        return;
      }

      // 신청이 전혀 없는 경우에만 새로 생성
      const { data: newApplication, error: insertError } = await supabase
        .from('site_visit_applications')
        .insert([
          {
            project_id: quoteRequestId,
            contractor_id: contractor.id,
            status: 'pending',
            notes: '',
            is_cancelled: false
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('방문 신청 생성 오류:', insertError);
        throw insertError;
      }

      toast.success('방문 신청이 완료되었습니다!');
      await refreshData();
      
    } catch (error) {
      console.error('방문 신청 처리 중 오류:', error);
      toast.error('방문 신청 중 오류가 발생했습니다.');
    }
  }, [refreshData])

  // 현장방문 취소 핸들러
  const handleSiteVisitCancellation = useCallback(async (applicationId: string, projectId: string) => {
    if (!confirm('현장방문 신청을 취소하시겠습니까?\n나중에 다시 신청할 수 있습니다.')) return

    try {
      const supabase = createBrowserClient()
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Authentication error:', userError)
        toast.error('로그인이 필요합니다')
        return
      }

      const { data: svaData, error: svaError } = await supabase
        .from('site_visit_applications')
        .update({
          is_cancelled: true,
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id
        })
        .eq('id', applicationId)
        .select()

      if (svaError) {
        console.error('SVA Error:', svaError)
        toast.error(`취소 실패: ${svaError.message}`)
        return
      }

      if (!svaData || svaData.length === 0) {
        console.error('취소할 현장방문 신청을 찾을 수 없습니다')
        toast.error('취소할 현장방문 신청을 찾을 수 없습니다')
        return
      }

      toast.success('현장방문이 취소되었습니다')
      await refreshData()
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('오류가 발생했습니다')
    }
  }, [refreshData])

  // 견적서 작성 모달 열기
  const openQuoteCreateModal = (project: Project) => {
    setQuoteModal({
      isOpen: true,
      projectId: project.id,
      mode: 'create',
      project
    })
  }

  // 견적서 보기 모달 열기
  const openQuoteViewModal = (project: Project) => {
    setQuoteModal({
      isOpen: true,
      projectId: project.id,
      mode: 'view',
      project
    })
  }

  // 견적서 모달 닫기
  const closeQuoteModal = () => {
    setQuoteModal({
      isOpen: false,
      projectId: null,
      mode: 'create',
      project: null
    })
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

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">업체 정보를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // 메인 렌더링
  return (
    <Fragment>
    <div className="min-h-screen bg-gray-50">
      {/* 페이지 제목 및 새로고침 버튼 */}
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
                {contractorData ? `${contractorData.company_name} - 견적 관리` : '내 견적 관리'}
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

      {/* 에러 메시지 */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 메인 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                프로젝트 관리
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
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

        {/* 탭 내용 */}
        {activeTab === 'projects' && (
          <>
            {/* 필터 탭 */}
            <ProjectFilters
              currentFilter={projectFilter}
              onFilterChange={handleFilterChange}
              statusCounts={statusCounts}
            />

            {/* 프로젝트 목록 */}
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
                      <ProjectCard
                        key={project.id}
                        project={project}
                        contractorId={contractorData?.id || ''}
                        onSiteVisitApply={handleSiteVisitApplication}
                        onSiteVisitCancel={handleSiteVisitCancellation}
                        onQuoteCreate={openQuoteCreateModal}
                        onQuoteView={openQuoteViewModal}
                      />
                    ))}
                  </div>
                  
                  {/* 무한 스크롤 로딩 인디케이터 */}
                  {isLoadingMore && (
                    <div className="mt-8 flex justify-center">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span>더 많은 프로젝트를 불러오는 중...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* 더 이상 로드할 데이터가 없을 때 */}
                  {!hasMore && filteredProjects.length > 0 && (
                    <div className="mt-8 text-center text-gray-500">
                      모든 프로젝트를 불러왔습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* 포트폴리오 탭 내용 */}
        {activeTab === 'portfolio' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              {contractorData && (
                <PortfolioManager 
                  contractorId={contractorData.id}
                  onPortfolioUpdate={() => {
                    console.log('Portfolio updated')
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* 견적서 작성/보기 모달 */}
    {quoteModal.isOpen && (
      <QuoteModal
        isOpen={quoteModal.isOpen}
        onClose={closeQuoteModal}
        project={quoteModal.project}
        mode={quoteModal.mode}
        contractorId={contractorData?.id}
        onSuccess={async () => {
          closeQuoteModal()
          setTimeout(() => {
            refreshData()
          }, 500)
        }}
      />
    )}
  </Fragment>
  )
}
